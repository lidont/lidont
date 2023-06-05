# @version 0.3.8

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

interface RocketStorage:
  def getAddress(_key: bytes32) -> address: view

interface RocketDepositPool:
  def deposit(): payable

interface RocketEther:
  def getExchangeRate() -> uint256: view

interface UnstETH:
  def requestWithdrawals(_amounts: DynArray[uint256, 1], _owner: address) -> DynArray[uint256, 1]: nonpayable
  def claimWithdrawals(_requestIds: DynArray[uint256, MAX_REQ], _hints: DynArray[uint256, MAX_REQ]): nonpayable

rocketStorage: immutable(RocketStorage)

MAX_REQ: constant(uint256) = 32
LIDONT_RATIO: constant(uint256) = 10000

rocketDepositPoolKey: constant(bytes32) = keccak256("contract.addressrocketDepositPool")
rocketEther: immutable(RocketEther)
oneRETH: immutable(uint256)
unstETH: immutable(UnstETH)
stakedEther: immutable(ERC20)

owner: public(address)
name: public(constant(String[64])) = "Lidont Staked to Rocket Ether Ratchet"
symbol: public(constant(String[8])) = "LIDONT"
decimals: public(constant(uint8)) = 18
totalSupply: public(uint256)
balanceOf: public(HashMap[address, uint256])
allowance: public(HashMap[address, HashMap[address, uint256]])

@external
def __init__():
  rocketStorage = RocketStorage(0x1d8f8f00cfa6758d7bE78336684788Fb0ee0Fa46)
  rocketEther = RocketEther(rocketStorage.getAddress(keccak256("contract.addressrocketTokenRETH")))
  oneRETH = 10 ** convert(ERC20(rocketEther.address).decimals(), uint256)
  unstETH = UnstETH(0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1)
  stakedEther = ERC20(0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84)
  self.owner = msg.sender

@external
def changeOwner(_newOwner: address):
  assert msg.sender == self.owner, "auth"
  self.owner = _newOwner

@external
def drain():
  assert msg.sender == self.owner, "auth"
  assert stakedEther.transfer(msg.sender, stakedEther.balanceOf(self))
  assert ERC20(rocketEther.address).transfer(msg.sender, ERC20(rocketEther.address).balanceOf(self))
  send(msg.sender, self.balance)

event Swap:
  who: indexed(address)
  stakedEther: indexed(uint256)
  rocketEther: indexed(uint256)

event Mint:
  amount: indexed(uint256)

event WithdrawalRequest:
  requestId: indexed(uint256)
  amount: indexed(uint256)

@internal
def _mint(amount: uint256):
  self.totalSupply += amount
  self.balanceOf[empty(address)] += amount
  log Mint(amount)

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

@external
def swap(stETHAmount: uint256):
  rETHAmount: uint256 = (stETHAmount * rocketEther.getExchangeRate()) / oneRETH
  assert stakedEther.transferFrom(msg.sender, self, stETHAmount), "stETH transfer failed"
  assert ERC20(rocketEther.address).transfer(msg.sender, rETHAmount), "rETH transfer failed"
  lidontAmount: uint256 = stETHAmount * LIDONT_RATIO
  self._mint(lidontAmount)
  self._transfer(empty(address), msg.sender, lidontAmount)
  log Swap(msg.sender, stETHAmount, rETHAmount)

@external
def initiateWithdrawal():
  amount: uint256 = stakedEther.balanceOf(self)
  assert stakedEther.approve(unstETH.address, amount), "stETH approve failed"
  requestId: uint256 = unstETH.requestWithdrawals([amount], self)[0]
  log WithdrawalRequest(requestId, amount)

@external
def finaliseWithdrawal(_requestIds: DynArray[uint256, MAX_REQ], _hints: DynArray[uint256, MAX_REQ]):
  unstETH.claimWithdrawals(_requestIds, _hints)

@external
def deposit():
  depositPool: RocketDepositPool = RocketDepositPool(rocketStorage.getAddress(rocketDepositPoolKey))
  depositPool.deposit(value = self.balance)
