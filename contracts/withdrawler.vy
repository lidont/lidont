# @version 0.3.8

MAX_LIDO_WITHDRAWAL: constant(uint256) = 1000 * (10 ** 18) # maximum size of a requestId

MAX_REQUESTS: constant(uint256) = 32 # maximum number of requestIds to process at a time
LIDONT_REWARD: constant(uint256) = 1 # amount of LIDONT rewarded per atto-stETH withdrawn through this contract

interface ERC20:
  def name() -> String[64]: view
  def symbol() -> String[8]: view
  def decimals() -> uint8: view
  def totalSupply() -> uint256: view
  def balanceOf(_owner: address) -> uint256: view
  def transfer(_to: address, _value: uint256) -> bool: nonpayable
  def transferFrom(_from: address, _to: address, _value: uint256) -> bool: nonpayable
  def approve(_spender: address, _value: uint256) -> bool: nonpayable
  def allowance(_owner: address, _spender: address) -> uint256: view

event Transfer:
  _from: indexed(address)
  _to: indexed(address)
  _value: uint256

event Approval:
  _owner: indexed(address)
  _spender: indexed(address)
  _value: uint256

interface UnstETH:
  def requestWithdrawals(_amounts: DynArray[uint256, MAX_REQUESTS], _owner: address) -> DynArray[uint256, MAX_REQUESTS]: nonpayable
  def getClaimableEther(_requestIds: DynArray[uint256, MAX_REQUESTS], _hints: DynArray[uint256, MAX_REQUESTS]) -> DynArray[uint256, MAX_REQUESTS]: view
  def claimWithdrawals(_requestIds: DynArray[uint256, MAX_REQUESTS], _hints: DynArray[uint256, MAX_REQUESTS]): nonpayable

interface OutputPipe:
  def receive(_who: address): payable

stakedEther: immutable(ERC20)
unstETH: immutable(UnstETH)

# Claims tracking

# Stages:
# 1. No deposit           - outputPipe empty
#    deposit →
# 2. stETH deposited      - outputPipe set, stETH non-zero
#    initiateWithdrawal →
# 3. Withdrawal requested - outputPipe set, stETH zero, ETH zero
#    finaliseWithdrawal →
# 4. Withdrawal finalised - outputPipe set, stETH zero, ETH non-zero
#    claim →
struct DepositData:
  stETH: uint256
  requestId: uint256
  ETH: uint256
  outputPipe: address

deposits: public(HashMap[address, DepositData])

queue: public(DynArray[address, MAX_REQUESTS])
queueSize: public(uint256)
queueFront: public(uint256)
queueBack: public(uint256)
@internal
def _appendQueue(a: address):
  self.queue[self.queueBack] = a
  self.queueBack += 1
  if self.queueBack == MAX_REQUESTS: self.queueBack = 0
  self.queueSize += 1
  assert self.queueSize < MAX_REQUESTS, "too many depositors"
@internal
def _popQueue() -> address:
  front: address = self.queue[self.queueFront]
  self.queueFront += 1
  if self.queueFront == MAX_REQUESTS: self.queueFront = 0
  self.queueSize -= 1
  return front

# Output pipes

admin: public(address)
validOutput: public(HashMap[address, bool])

event ChangeAdmin:
  oldAdmin: indexed(address)
  newAdmin: indexed(address)

event SetOutputValidity:
  output: indexed(address)
  valid: indexed(bool)

@external
def __init__(stETHAddress: address, unstETHAddress: address):
  stakedEther = ERC20(stETHAddress)
  unstETH = UnstETH(unstETHAddress)
  self.admin = msg.sender

@external
def changeAdmin(newAdmin: address):
  assert msg.sender == self.admin, "auth"
  self.admin = newAdmin
  log ChangeAdmin(msg.sender, newAdmin)

@external
def setValidOutput(output: address, valid: bool):
  assert msg.sender == self.admin, "auth"
  self.validOutput[output] = valid
  log SetOutputValidity(output, valid)

# Main mechanisms:
# - deposit stETH for (pending) ETH
# - process withdrawals with Lido
# - claim withdrawn ETH to output pipe

event Deposit:
  who: indexed(address)
  amount: indexed(uint256)

event WithdrawalRequest:
  requestIds: DynArray[uint256, MAX_REQUESTS]
  depositors: DynArray[address, MAX_REQUESTS]
  amounts: DynArray[uint256, MAX_REQUESTS]

event Claim:
  who: indexed(address)
  output: indexed(address)
  amount: indexed(uint256)

@external
def deposit(stETHAmount: uint256, outputPipe: address):
  assert self.validOutput[outputPipe], "invalid pipe"
  assert 0 < stETHAmount, "no deposit"
  assert stakedEther.transferFrom(msg.sender, self, stETHAmount), "stETH transfer failed"
  assert self.deposits[msg.sender].outputPipe == empty(address) or (
           self.deposits[msg.sender].outputPipe == outputPipe and
           self.deposits[msg.sender].stETH > 0), "pending deposit"
  self.deposits[msg.sender].stETH += stETHAmount
  self.deposits[msg.sender].outputPipe = outputPipe
  self._appendQueue(msg.sender)
  log Deposit(msg.sender, stETHAmount)

@external
def initiateWithdrawal(depositors: DynArray[address, MAX_REQUESTS]) -> DynArray[uint256, MAX_REQUESTS]:
  requestAmounts: DynArray[uint256, MAX_REQUESTS] = []
  totalRequestAmount: uint256 = 0
  for depositor in depositors:
    assert self.deposits[depositor].ETH == 0, "claim pending"
    amount: uint256 = self.deposits[depositor].stETH
    assert amount > 0, "no deposit"
    requestAmounts.append(amount)
    totalRequestAmount += amount
  assert stakedEther.approve(unstETH.address, totalRequestAmount), "stETH approve failed"
  requestIds: DynArray[uint256, MAX_REQUESTS] = unstETH.requestWithdrawals(requestAmounts, self)
  for i in range(MAX_REQUESTS):
    if i == len(requestIds): break
    depositor: address = depositors[i]
    self.deposits[depositor].stETH = 0
    self.deposits[depositor].requestId = requestIds[i]
  log WithdrawalRequest(requestIds, depositors, requestAmounts)
  return requestIds

@external
def finaliseWithdrawal(depositors: DynArray[address, MAX_REQUESTS], _hints: DynArray[uint256, MAX_REQUESTS]):
  requestIds: DynArray[uint256, MAX_REQUESTS] = []
  for depositor in depositors:
    requestIds.append(self.deposits[depositor].requestId)
  claimAmounts: DynArray[uint256, MAX_REQUESTS] = unstETH.getClaimableEther(requestIds, _hints)
  unstETH.claimWithdrawals(requestIds, _hints)
  for i in range(MAX_REQUESTS):
    if i == len(claimAmounts): break
    self.deposits[depositors[i]].ETH = claimAmounts[i]

@external
def claim():
  recipient: address = self._popQueue()
  output: address = self.deposits[recipient].outputPipe
  amount: uint256 = self.deposits[recipient].ETH
  OutputPipe(output).receive(recipient, value=amount)
  self.deposits[recipient].ETH = 0
  self.deposits[recipient].outputPipe = empty(address)
  log Claim(recipient, output, amount)
