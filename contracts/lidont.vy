# @version 0.3.8

MAX_LIDO_REQUESTS: constant(uint8) = 80 # maximum requestIds within a withdrawal request
MAX_LIDO_WITHDRAWAL: constant(uint256) = 1000 * (10 ** 18) # maximum size of a requestId

MAX_REQUESTS: constant(uint8) = 32 # maximum number of stETH withdrawals a caller of finaliseWithdrawal can process at a time
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
  def requestWithdrawals(_amounts: DynArray[uint256, MAX_LIDO_REQUESTS], _owner: address) -> DynArray[uint256, MAX_LIDO_REQUESTS]: nonpayable
  def claimWithdrawals(_requestIds: DynArray[uint256, MAX_REQUESTS], _hints: DynArray[uint256, MAX_REQUESTS]): nonpayable

stakedEther: immutable(ERC20)
unstETH: immutable(UnstETH)

# ERC20 functions

name: public(constant(String[64])) = "Lidont Staked to Rocket Ether Ratchet"
symbol: public(constant(String[8])) = "LIDONT"
decimals: public(constant(uint8)) = 18
totalSupply: public(uint256)
balanceOf: public(HashMap[address, uint256])
allowance: public(HashMap[address, HashMap[address, uint256]])

# Rewards and claims tracking

pendingLidont: public(HashMap[address, uint256])
pendingEther: public(HashMap[address, uint256])

# Output pipes

admin: public(address)
validOutput: public(HashMap[address, bool])

event ChangeAdmin:
  oldAdmin: indexed(address)
  newAdmin: indexed(address)

event SetOutput:
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
  log SetOutput(output, valid)

# ERC20 functions

@internal
def _transfer(_from: address, _to: address, _amount: uint256) -> bool:
  balanceFrom: uint256 = self.balanceOf[_from]
  if balanceFrom < _amount:
    return False
  self.balanceOf[_from] = unsafe_sub(balanceFrom, _amount)
  self.balanceOf[_to] = self.balanceOf[_to] + _amount
  log Transfer(_from, _to, _amount)
  return True

@external
def transfer(_to: address, _value: uint256) -> bool:
  return self._transfer(msg.sender, _to, _value)

@external
def approve(_spender: address, _value: uint256) -> bool:
  self.allowance[msg.sender][_spender] = _value
  log Approval(msg.sender, _spender, _value)
  return True

@external
def transferFrom(_from: address, _to: address, _value: uint256) -> bool:
  allowanceFrom: uint256 = self.allowance[_from][_to]
  if allowanceFrom < _value:
    return False
  transferred: bool = self._transfer(_from, _to, _value)
  if transferred:
    self.allowance[_from][_to] = unsafe_sub(allowanceFrom, _value)
  return transferred

# internal LIDONT minting

event Mint:
  amount: indexed(uint256)

@internal
def _mint(amount: uint256):
  self.totalSupply += amount
  self.balanceOf[empty(address)] += amount
  log Mint(amount)

# Main mechanisms:
# - deposit stETH for (pending) ETH
# - claim pending rewards and ether

event Deposit:
  who: indexed(address)
  amount: indexed(uint256)

event Claim:
  who: indexed(address)
  output: indexed(address)
  etherAmount: uint256
  lidontAmount: uint256

@external
def deposit(stETHAmount: uint256):
  assert stakedEther.transferFrom(msg.sender, self, stETHAmount), "stETH transfer failed"
  self.pendingEther[msg.sender] += stETHAmount
  rewardAmount: uint256 = stETHAmount * LIDONT_REWARD
  self._mint(rewardAmount)
  self.pendingLidont[msg.sender] += rewardAmount
  log Deposit(msg.sender, stETHAmount)

@external
def claim(output: address) -> (uint256, uint256):
  assert self.validOutput[output], "invalid"
  etherAmount: uint256 = min(self.balance, self.pendingEther[msg.sender])
  assert 0 < etherAmount, "unavailable"
  self.pendingEther[msg.sender] -= etherAmount
  send(output, etherAmount)
  lidontAmount: uint256 = 0
  if self.pendingEther[msg.sender] == 0:
    lidontAmount = self.pendingLidont[msg.sender]
    assert self._transfer(empty(address), output, lidontAmount)
    self.pendingLidont[msg.sender] = 0
  log Claim(msg.sender, output, etherAmount, lidontAmount)
  return (etherAmount, lidontAmount)

# Manage Lido withdrawals

event WithdrawalRequest:
  requestIds: DynArray[uint256, MAX_LIDO_REQUESTS]
  amount: indexed(uint256)

@external
def initiateWithdrawal(stETHAmount: uint256) -> DynArray[uint256, MAX_LIDO_REQUESTS]:
  assert stakedEther.approve(unstETH.address, stETHAmount), "stETH approve failed"
  amountLeft: uint256 = stETHAmount
  requestAmounts: DynArray[uint256, MAX_LIDO_REQUESTS] = []
  for _ in range(MAX_LIDO_REQUESTS):
    amount: uint256 = min(amountLeft, MAX_LIDO_WITHDRAWAL)
    requestAmounts.append(amount)
    amountLeft = unsafe_sub(amountLeft, amount)
    if amountLeft == 0: break
  requestIds: DynArray[uint256, MAX_LIDO_REQUESTS] = unstETH.requestWithdrawals(requestAmounts, self)
  log WithdrawalRequest(requestIds, stETHAmount)
  return requestIds

@external
def finaliseWithdrawal(_requestIds: DynArray[uint256, MAX_REQUESTS], _hints: DynArray[uint256, MAX_REQUESTS]):
  unstETH.claimWithdrawals(_requestIds, _hints)
