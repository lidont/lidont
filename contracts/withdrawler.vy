# @version 0.3.8

MAX_LIDO_WITHDRAWAL: constant(uint256) = 1000 * (10 ** 18) # maximum size of a requestId

MAX_REQUESTS: constant(uint8) = 32 # maximum number of requestIds to process at a time
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

pendingStakedEther: public(HashMap[address, uint256]) # amount deposited by pending depositors, waiting for request
pendingEther: public(HashMap[address, uint256]) # amount of withdrawn ether waiting to be claimed by this address
pendingRequestId: public(HashMap[address, uint256]) # requestId for a pending withdrawal by this address if any

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
# - claim pending rewards and ether to output pipe

event Deposit:
  who: indexed(address)
  amount: indexed(uint256)

event Claim:
  who: indexed(address)
  output: indexed(address)
  etherAmount: uint256

@external
def deposit(stETHAmount: uint256):
  assert stakedEther.transferFrom(msg.sender, self, stETHAmount), "stETH transfer failed"
  self.pendingStakedEther[msg.sender] += stETHAmount
  log Deposit(msg.sender, stETHAmount)

event WithdrawalRequest:
  requestIds: DynArray[uint256, MAX_REQUESTS]
  depositors: DynArray[address, MAX_REQUESTS]
  amounts: DynArray[uint256, MAX_REQUESTS]

@external
def initiateWithdrawal(depositors: DynArray[address, MAX_REQUESTS]) -> DynArray[uint256, MAX_REQUESTS]:
  requestAmounts: DynArray[uint256, MAX_REQUESTS] = []
  totalRequestAmount: uint256 = 0
  for depositor in depositors:
    amount: uint256 = self.pendingStakedEther[depositor]
    assert amount > 0, "no pending deposit"
    requestAmounts.append(amount)
    totalRequestAmount += amount
  assert stakedEther.approve(unstETH.address, totalRequestAmount), "stETH approve failed"
  requestIds: DynArray[uint256, MAX_REQUESTS] = unstETH.requestWithdrawals(requestAmounts, self)
  for i in range(MAX_REQUESTS):
    if convert(i, uint256) == len(requestIds): break
    depositor: address = depositors[i]
    self.pendingStakedEther[depositor] = 0
    self.pendingRequestId[depositor] = requestIds[i]
  log WithdrawalRequest(requestIds, depositors, requestAmounts)
  return requestIds

@external
def claim(output: address) -> uint256:
  assert self.validOutput[output], "invalid pipe"
  etherAmount: uint256 = self.pendingEther[msg.sender]
  OutputPipe(output).receive(msg.sender, value=etherAmount)
  self.pendingEther[msg.sender] = 0
  log Claim(msg.sender, output, etherAmount)
  return etherAmount

@external
def finaliseWithdrawal(depositors: DynArray[address, MAX_REQUESTS], _hints: DynArray[uint256, MAX_REQUESTS]):
  requestIds: DynArray[uint256, MAX_REQUESTS] = []
  for depositor in depositors:
    requestIds.append(self.pendingRequestId[depositor])
  claimAmounts: DynArray[uint256, MAX_REQUESTS] = unstETH.getClaimableEther(requestIds, _hints)
  unstETH.claimWithdrawals(requestIds, _hints)
  for i in range(MAX_REQUESTS):
    if convert(i, uint256) == len(claimAmounts): break
    self.pendingEther[depositors[i]] += claimAmounts[i]
