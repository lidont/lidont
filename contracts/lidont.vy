# @version 0.3.8

MAX_REQUESTS: constant(uint256) = 32 # maximum number of stETH withdrawals a caller of finaliseWithdrawal can process at a time
LIDONT_EMISSION: constant(uint256) = 10 * (10 ** 18) # amount of LIDONT emitted per staked atto-rETH per block
MINIPOOL_REWARD: constant(uint256) = 1000 # amount of LIDONT emitted per minipool claim

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
  def getNodeWithdrawalAddress(_nodeAddress: address) -> address: view

interface RocketMinipoolManager:
  def getNodeMinipoolAt(_nodeAddress: address, _index: uint256) -> address: view

interface RocketDepositPool:
  def deposit(): payable

interface RocketEther:
  def getRethValue(_ethAmount: uint256) -> uint256: view

interface UnstETH:
  def requestWithdrawals(_amounts: DynArray[uint256, 1], _owner: address) -> DynArray[uint256, 1]: nonpayable
  def claimWithdrawals(_requestIds: DynArray[uint256, MAX_REQUESTS], _hints: DynArray[uint256, MAX_REQUESTS]): nonpayable

rocketStorage: immutable(RocketStorage)
rocketDepositPoolKey: constant(bytes32) = keccak256("contract.addressrocketDepositPool")
rocketMinipoolManagerKey: constant(bytes32) = keccak256("contract.addressrocketMinipoolManager")
rocketEther: immutable(ERC20)
stakedEther: immutable(ERC20)
unstETH: immutable(UnstETH)

owner: public(address)

# ERC20 functions
name: public(constant(String[64])) = "Lidont Staked to Rocket Ether Ratchet"
symbol: public(constant(String[8])) = "LIDONT"
decimals: public(constant(uint8)) = 18
totalSupply: public(uint256)
balanceOf: public(HashMap[address, uint256])
allowance: public(HashMap[address, HashMap[address, uint256]])

# Staked rETH accounting
struct StakedRETHDetails:
  stake: uint256 # amount of rETH currently staked
  rewardDebt: uint256 # amount of LIDONT owed
  lastClaimBlock: uint256 # block for which rewardDebt is current

stakedReth: public(HashMap[address, StakedRETHDetails])
totalStakedReth: public(uint256)

# Minipool rewards accounting
minipoolUsed: public(HashMap[address, bool])

# Addresses: could be made arguments to handle other networks
rocketStorageAddress: constant(address) = 0x1d8f8f00cfa6758d7bE78336684788Fb0ee0Fa46
unstETHAddress:       constant(address) = 0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1
stETHAddress:         constant(address) = 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84
@external
def __init__():
  rocketStorage = RocketStorage(rocketStorageAddress)
  rocketEther = ERC20(rocketStorage.getAddress(keccak256("contract.addressrocketTokenRETH")))
  stakedEther = ERC20(stETHAddress)
  unstETH = UnstETH(unstETHAddress)
  self.minipoolUsed[empty(address)] = True
  self.owner = msg.sender

# owner can drain this contract when finished with it

@external
def changeOwner(_newOwner: address):
  assert msg.sender == self.owner, "auth"
  self.owner = _newOwner

@external
def drain():
  assert msg.sender == self.owner, "auth"
  assert stakedEther.transfer(msg.sender, stakedEther.balanceOf(self))
  assert rocketEther.transfer(msg.sender, rocketEther.balanceOf(self))
  send(msg.sender, self.balance)

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

# internal functions for minting LIDONT and staking and unstaking rETH

event Mint:
  amount: indexed(uint256)

event Stake:
  who: indexed(address)
  amount: indexed(uint256)

event Unstake:
  who: indexed(address)
  amount: indexed(uint256)

@internal
def _mint(amount: uint256):
  self.totalSupply += amount
  self.balanceOf[empty(address)] += amount
  log Mint(amount)

@internal
def _addRewardDebt(who: address):
  if self.stakedReth[who].lastClaimBlock != 0:
    blocks: uint256 = block.number - self.stakedReth[who].lastClaimBlock
    self.stakedReth[who].rewardDebt += blocks * self.stakedReth[who].stake * LIDONT_EMISSION
  self.stakedReth[who].lastClaimBlock = block.number

@internal
def _stake(who: address, amount: uint256):
  self._addRewardDebt(who)
  self.totalStakedReth += amount
  self.stakedReth[who].stake += amount
  log Stake(who, amount)

@internal
def _unstake(who: address, amount: uint256):
  self._addRewardDebt(who)
  self.totalStakedReth -= amount
  self.stakedReth[who].stake -= amount
  log Unstake(who, amount)

@internal
@view
def _rETHBalance() -> uint256:
  return rocketEther.balanceOf(self) - self.totalStakedReth

# Main mechanisms:
# - swap stETH for staked rETH
# - deposit rETH for staked rETH
# - withdraw (unstake) staked rETH
# - claim LIDONT for a minipool
# - claim LIDONT rewards for staked rETH

event Swap:
  who: indexed(address)
  stakedEther: indexed(uint256)
  rocketEther: indexed(uint256)

event ClaimMinipool:
  who: indexed(address)
  node: indexed(address)
  minipool: indexed(address)

event ClaimEmission:
  who: indexed(address)
  lidont: indexed(uint256)

@external
def swap(stETHAmount: uint256):
  rETHAmount: uint256 = RocketEther(rocketEther.address).getRethValue(stETHAmount)
  assert stakedEther.transferFrom(msg.sender, self, stETHAmount), "stETH transfer failed"
  assert rETHAmount <= self._rETHBalance(), "not enough rETH"
  self._stake(msg.sender, rETHAmount)
  log Swap(msg.sender, stETHAmount, rETHAmount)

@external
def stake(rETHAmount: uint256):
  assert rocketEther.transferFrom(msg.sender, self, rETHAmount), "rETH transfer failed"
  self._stake(msg.sender, rETHAmount)

@external
def unstake(rETHAmount: uint256):
  self._unstake(msg.sender, rETHAmount)
  assert rocketEther.transfer(msg.sender, rETHAmount), "rETH transfer failed"

@external
def claim() -> uint256:
  self._addRewardDebt(msg.sender)
  amount: uint256 = self.stakedReth[msg.sender].rewardDebt
  self._mint(amount)
  self._transfer(empty(address), msg.sender, amount)
  self.stakedReth[msg.sender].rewardDebt = 0
  log ClaimEmission(msg.sender, amount)
  return amount

@external
def claimMinipool(nodeAddress: address, index: uint256):
  assert msg.sender == rocketStorage.getNodeWithdrawalAddress(nodeAddress), "auth"
  rocketMinipoolManager: RocketMinipoolManager = RocketMinipoolManager(rocketStorage.getAddress(rocketMinipoolManagerKey))
  minipool: address = rocketMinipoolManager.getNodeMinipoolAt(nodeAddress, index)
  assert not self.minipoolUsed[minipool], "already claimed"
  self._mint(MINIPOOL_REWARD)
  self._transfer(empty(address), msg.sender, MINIPOOL_REWARD)
  self.minipoolUsed[minipool] = True
  log ClaimMinipool(msg.sender, nodeAddress, minipool)

# Manage this contract's stETH and rETH balances:
# - withdraw ETH for stETH
# - mint rETH with ETH

event WithdrawalRequest:
  requestId: indexed(uint256)
  amount: indexed(uint256)

@external
def initiateWithdrawal():
  amount: uint256 = stakedEther.balanceOf(self)
  assert stakedEther.approve(unstETH.address, amount), "stETH approve failed"
  requestId: uint256 = unstETH.requestWithdrawals([amount], self)[0]
  log WithdrawalRequest(requestId, amount)

@external
def finaliseWithdrawal(_requestIds: DynArray[uint256, MAX_REQUESTS], _hints: DynArray[uint256, MAX_REQUESTS]):
  unstETH.claimWithdrawals(_requestIds, _hints)

@external
def mintRocketEther():
  depositPool: RocketDepositPool = RocketDepositPool(rocketStorage.getAddress(rocketDepositPoolKey))
  depositPool.deposit(value = self.balance)
