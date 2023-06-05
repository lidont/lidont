# @version 0.3.8

MAX_REQUESTS: constant(uint256) = 32 # maximum number of stETH withdrawals a caller of finaliseWithdrawal can process at a time
STAKING_EMISSION: constant(uint256) = 10 * (10 ** 18) # amount of LIDONT emitted per staked atto-rETH per block
LIQUIDITY_EMISSION: constant(uint256) = 20 * (10 ** 18) # amount of LIDONT emitted per atto-rETH of liquidity provided per block
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

interface Minipool:
  def getUserDepositAssignedTime() -> uint256: view

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

# Emissions (for both LP and staked rETH) accounting
struct EmissionDetails:
  rewardDebt: uint256 # amount of (LIDONT) rewards owed
  lastClaimBlock: uint256 # block for which rewardDebt is current

emissions: public(HashMap[bool, HashMap[address, EmissionDetails]]) # first key is fromLP

# Liquidity provision accounting
struct LiquidityShare:
  # a ratio based on a snapshot of the contract total liquidity
  # to get the current ratio, update total to the current contract liquidity
  share: uint256 # numerator (in rETH)
  total: uint256 # denominator (in rETH)

liquidityShare: public(HashMap[address, LiquidityShare])

# Staked rETH accounting
stakedReth: public(HashMap[address, uint256])
totalStakedReth: public(uint256)

# Minipool rewards accounting
rewardMinipoolsAfter: public(immutable(uint256))
minipoolUsed: public(HashMap[address, bool])

# stETH withdrawal accounting
pendingWithdrawalValue: public(uint256)

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
  rewardMinipoolsAfter = block.timestamp
  self.minipoolUsed[empty(address)] = True

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

# internal functions for minting LIDONT, staking and unstaking rETH, and adding/removing liquidity

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
@view
def _totalLiquidity() -> uint256:
  ETHBalance: uint256 = self.balance + stakedEther.balanceOf(self) + self.pendingWithdrawalValue
  return self._rETHBalance() + RocketEther(rocketEther.address).getRethValue(ETHBalance)

@internal
def _updateLiquidityRatio(who: address):
  newTotal: uint256 = self._totalLiquidity()
  newShare: uint256 = 0
  if self.liquidityShare[who].share != 0:
    newShare = (self.liquidityShare[who].share * newTotal) / self.liquidityShare[who].total
  self.liquidityShare[who].share = newShare
  self.liquidityShare[who].total = newTotal
  # justification: newShare / newTotal
  # == (share * newTotal / total) / newTotal
  # == share / total

@internal
def _addRewardDebt(fromLP: bool, who: address):
  blocks: uint256 = block.number - self.emissions[fromLP][who].lastClaimBlock
  value: uint256 = self.stakedReth[who]
  multiplier: uint256 = STAKING_EMISSION
  if fromLP:
    self._updateLiquidityRatio(who)
    value = self.liquidityShare[who].share
    multiplier = LIQUIDITY_EMISSION
  self.emissions[fromLP][who].rewardDebt += blocks * value * multiplier
  self.emissions[fromLP][who].lastClaimBlock = block.number

@internal
def _stake(who: address, amount: uint256):
  self._addRewardDebt(False, who)
  self.totalStakedReth += amount
  self.stakedReth[who] += amount
  log Stake(who, amount)

@internal
def _unstake(who: address, amount: uint256):
  self._addRewardDebt(False, who)
  self.totalStakedReth -= amount
  self.stakedReth[who] -= amount
  log Unstake(who, amount)

@internal
@view
def _rETHBalance() -> uint256:
  return rocketEther.balanceOf(self) - self.totalStakedReth

@internal
def forceSend(_to: address, _amount: uint256) -> bool:
  return raw_call(_to, b"", value=_amount, gas=0, revert_on_failure=False)

# Main mechanisms:
# - swap stETH for staked rETH
# - deposit rETH for staked rETH
# - withdraw (unstake) staked rETH
# - add liquidity in the form of rETH
# - remove liquidity
# - claim LIDONT for a minipool
# - claim LIDONT rewards for staked rETH / liquidity provision

event Swap:
  who: indexed(address)
  stakedEther: indexed(uint256)
  rocketEther: indexed(uint256)

event AddLiquidity:
  who: indexed(address)
  amount: indexed(uint256)
  newShare: uint256
  newTotal: uint256

event RemoveLiquidity:
  who: indexed(address)
  share: uint256
  total: uint256

event ClaimMinipool:
  who: indexed(address)
  node: indexed(address)
  minipool: indexed(address)

event ClaimEmission:
  who: indexed(address)
  fromLP: indexed(bool)
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
def addLiquidity(rETHAmount: uint256):
  self._addRewardDebt(True, msg.sender)
  assert rocketEther.transferFrom(msg.sender, self, rETHAmount), "rETH transfer failed"
  self.liquidityShare[msg.sender].share += rETHAmount
  self.liquidityShare[msg.sender].total += rETHAmount
  log AddLiquidity(msg.sender, rETHAmount,
    self.liquidityShare[msg.sender].share,
    self.liquidityShare[msg.sender].total)

@external
def removeLiquidity():
  self._addRewardDebt(True, msg.sender)
  share: uint256 = self.liquidityShare[msg.sender].share
  total: uint256 = self.liquidityShare[msg.sender].total
  self.liquidityShare[msg.sender].share = 0
  amountETH: uint256 = (self.balance * share) / total
  amountETH += (self.pendingWithdrawalValue * share) / total
  assert self.forceSend(msg.sender, amountETH), "ETH transfer failed"
  assert stakedEther.transfer(msg.sender, (stakedEther.balanceOf(self) * share) / total), "stETH transfer failed"
  assert rocketEther.transfer(msg.sender, (self._rETHBalance() * share) / total), "rETH transfer failed"
  log RemoveLiquidity(msg.sender, share, total)

@external
def claimEmission(fromLP: bool) -> uint256:
  self._addRewardDebt(fromLP, msg.sender)
  amount: uint256 = self.emissions[fromLP][msg.sender].rewardDebt
  self._mint(amount)
  self._transfer(empty(address), msg.sender, amount)
  self.emissions[fromLP][msg.sender].rewardDebt = 0
  log ClaimEmission(msg.sender, fromLP, amount)
  return amount

@external
def claimMinipool(nodeAddress: address, index: uint256):
  assert (msg.sender == rocketStorage.getNodeWithdrawalAddress(nodeAddress) or
          msg.sender == nodeAddress), "auth"
  rocketMinipoolManager: RocketMinipoolManager = RocketMinipoolManager(rocketStorage.getAddress(rocketMinipoolManagerKey))
  minipool: address = rocketMinipoolManager.getNodeMinipoolAt(nodeAddress, index)
  assert rewardMinipoolsAfter < Minipool(minipool).getUserDepositAssignedTime(), "old"
  assert not self.minipoolUsed[minipool], "claimed"
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
  self.pendingWithdrawalValue += amount
  log WithdrawalRequest(requestId, amount)

@external
def finaliseWithdrawal(_requestIds: DynArray[uint256, MAX_REQUESTS], _hints: DynArray[uint256, MAX_REQUESTS]):
  before: uint256 = self.balance
  unstETH.claimWithdrawals(_requestIds, _hints)
  self.pendingWithdrawalValue -= (self.balance - before)

@external
def mintRocketEther():
  depositPool: RocketDepositPool = RocketDepositPool(rocketStorage.getAddress(rocketDepositPoolKey))
  depositPool.deposit(value = self.balance)
