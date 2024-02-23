# @version ^0.3.9

interface Withdrawler:
  def triggerEmission(_pipe: address): nonpayable

withdrawler: public(immutable(Withdrawler))
MAX_DATA: constant(uint256) = 32 * 4

interface ERC20:
  def decimals() -> uint8: view
  def balanceOf(_owner: address) -> uint256: view
  def transfer(_to: address, _value: uint256) -> bool: nonpayable
  def transferFrom(_from: address, _to: address, _value: uint256) -> bool: nonpayable

struct RewardPool:
  token: ERC20
  precision: uint256
  bondValue: uint256
  temp: uint256
  dust: uint256

rewardPoolLidont: public(RewardPool)
rewardPoolRocket: public(RewardPool)

rewardTokenLidont: public(immutable(ERC20))
rewardTokenRocket: public(immutable(ERC20))

decimals: public(immutable(uint256))

initialBondValue: constant(uint256) = 100000000
bondValueLidont: public(uint256)
bondValueRocket: public(uint256)

tempLidont: public(uint256) # rewards received while there are no stakers
dustLidont: public(uint256) # reward dust from a receipt to be added to next receipt
tempRocket: public(uint256) # rewards received while there are no stakers
dustRocket: public(uint256) # reward dust from a receipt to be added to next receipt

struct StakedBond:
  amount: uint256
  pendingLidont: uint256
  pendingRocket: uint256
  bondValueLidont: uint256
  bondValueRocket: uint256

stakes: public(HashMap[address, StakedBond])
totalStake: public(uint256)

@external
def __init__(rewardTokenAddress: address, withdrawlerAddress: address, rocketStorageAddress: address):
  withdrawler = Withdrawler(withdrawlerAddress)
  rewardTokenLidont = ERC20(rewardTokenAddress)
  rocketStorage = RocketStorage(rocketStorageAddress)
  rewardTokenRocket = ERC20(rocketStorage.getAddress(rocketTokenKey))
  decimals = convert(rewardTokenLidont.decimals(), uint256)
  assert convert(rewardTokenRocket.decimals(), uint256) == decimals, "decimals"
  self.bondValueLidont = initialBondValue
  self.bondValueRocket = initialBondValue
  rocketEther = ERC20(rocketStorage.getAddress(rocketEtherKey))
  rocketSwapRouter = SwapRouter(0x16D5A408e807db8eF7c578279BEeEe6b228f1c1C)

interface RocketStorage:
  def getAddress(_key: bytes32) -> address: view

interface SwapRouter:
  def swapTo(_uniswap: uint256, _balancer: uint256, _minOut: uint256, _idealOut: uint256): payable

rocketStorage: immutable(RocketStorage)
rocketEther: immutable(ERC20)
rocketEtherKey: constant(bytes32) = keccak256("contract.addressrocketTokenRETH")
rocketTokenKey: constant(bytes32) = keccak256("contract.addressrocketTokenRPL")
rocketSwapRouter: public(immutable(SwapRouter))

event Receive:
  token: indexed(address)
  amount: indexed(uint256)
  oldBondValue: uint256
  newBondValue: uint256

@external
def receiveReward(_token: address, _from: address, _amount: uint256):
  if _token == rewardTokenLidont.address:
    assert rewardTokenLidont.transferFrom(_from, self, _amount), "transferFrom lidont"

    totalBonds: uint256 = self.totalStake / decimals

    if totalBonds == 0:
      self.tempLidont += _amount
      return

    amount: uint256 = _amount

    if 0 < self.tempLidont:
      amount += self.tempLidont
      self.tempLidont = 0

    toDistribute: uint256 = self.dustLidont + amount
    bondIncrease: uint256 = toDistribute / totalBonds
    distributedTotal: uint256 = totalBonds * bondIncrease
    oldBondValue: uint256 = self.bondValueLidont
    self.bondValueLidont += bondIncrease
    self.dustLidont = toDistribute - distributedTotal

    log Receive(_token, _amount, oldBondValue, self.bondValueLidont)

  elif _token == rewardTokenRocket.address:
    assert rewardTokenRocket.transferFrom(_from, self, _amount), "transferFrom RPL"

    totalBonds: uint256 = self.totalStake / decimals

    if totalBonds == 0:
      self.tempRocket += _amount
      return

    amount: uint256 = _amount

    if 0 < self.tempRocket:
      amount += self.tempRocket
      self.tempRocket = 0

    toDistribute: uint256 = self.dustRocket + amount
    bondIncrease: uint256 = toDistribute / totalBonds
    distributedTotal: uint256 = totalBonds * bondIncrease
    oldBondValue: uint256 = self.bondValueRocket
    self.bondValueRocket += bondIncrease
    self.dustRocket = toDistribute - distributedTotal

    log Receive(_token, _amount, oldBondValue, self.bondValueRocket)

  else:
    raise "token"

event Stake:
  user: indexed(address)
  amount: indexed(uint256)

event Unstake:
  user: indexed(address)
  amount: indexed(uint256)
  rewardLidont: uint256
  rewardRocket: uint256

@internal
def _stake(user: address, amount: uint256):
  assert 0 < amount, "amount"
  self.totalStake += amount
  rewardLidont: uint256 = self._rewardLidont(user, self.stakes[user].amount)
  rewardRocket: uint256 = self._rewardRocket(user, self.stakes[user].amount)
  if 0 < rewardLidont:
    self.stakes[user].pendingLidont += rewardLidont
  if 0 < rewardRocket:
    self.stakes[user].pendingRocket += rewardRocket
  self.stakes[user].amount += amount
  self.stakes[user].bondValueLidont = self.bondValueLidont
  self.stakes[user].bondValueRocket = self.bondValueRocket
  log Stake(user, amount)

@internal
def _unstake(user: address, amount: uint256):
  assert 0 < amount, "amount"
  self.totalStake -= amount
  self.stakes[user].amount -= amount
  rewardLidont: uint256 = self._rewardLidont(user, amount) + self.stakes[user].pendingLidont
  self.stakes[user].pendingLidont = 0
  rewardRocket: uint256 = self._rewardRocket(user, amount) + self.stakes[user].pendingRocket
  self.stakes[user].pendingRocket = 0
  assert rocketEther.transfer(user, amount), "send"
  log Unstake(user, amount, rewardLidont, rewardRocket)
  if 0 < rewardLidont:
    assert rewardTokenLidont.transfer(user, rewardLidont), "transfer lidont"
  if 0 < rewardRocket:
    assert rewardTokenRocket.transfer(user, rewardRocket), "transfer RPL"

@internal
@view
def _rewardLidont(user: address, stake: uint256) -> uint256:
  return stake * (self.bondValueLidont - self.stakes[user].bondValueLidont)

@internal
@view
def _rewardRocket(user: address, stake: uint256) -> uint256:
  return stake * (self.bondValueRocket - self.stakes[user].bondValueRocket)

@external
def unstake(amount: uint256):
  withdrawler.triggerEmission(self)
  self._unstake(msg.sender, amount)

@external
def previewUnstake(user: address, amount: uint256) -> (uint256, uint256):
  withdrawler.triggerEmission(self)
  return (self._rewardLidont(user, amount), self._rewardRocket(user, amount))

@external
@payable
def receive(user: address, data: Bytes[MAX_DATA]):
  assert msg.sender == withdrawler.address, "auth"
  rETHBefore: uint256 = rocketEther.balanceOf(self)
  uniswapPortion: uint256 = empty(uint256)
  balancerPortion: uint256 = empty(uint256)
  minOut: uint256 = empty(uint256)
  idealOut: uint256 = empty(uint256)
  uniswapPortion, balancerPortion, minOut, idealOut = _abi_decode(data, (uint256, uint256, uint256, uint256))
  rocketSwapRouter.swapTo(
    uniswapPortion, balancerPortion, minOut, idealOut, value = msg.value)
  rETHMinted: uint256 = rocketEther.balanceOf(self) - rETHBefore
  self._stake(user, rETHMinted)
