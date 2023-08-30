# @version 0.3.9

interface ERC20:
  def decimals() -> uint8: view
  def balanceOf(_owner: address) -> uint256: view
  def transfer(_to: address, _value: uint256) -> bool: nonpayable
  def transferFrom(_from: address, _to: address, _value: uint256) -> bool: nonpayable

rewardToken: immutable(ERC20)

initialBondValue: constant(uint256) = 100000000
precision: immutable(uint256)
bondValue: public(uint256)

temp: public(uint256) # rewards received while there are no stakers
dust: public(uint256) # reward dust from a receipt to be added to next receipt

struct StakedBond:
  amount: uint256
  bondValue: uint256

stakes: public(HashMap[address, StakedBond])
totalStake: public(uint256)

@external
def __init__(rewardTokenAddress: address, rocketStorageAddress: address):
  rewardToken = ERC20(rewardTokenAddress)
  precision = 10 ** convert(rewardToken.decimals(), uint256)
  self.bondValue = initialBondValue
  rocketStorage = RocketStorage(rocketStorageAddress)
  rocketEther = ERC20(rocketStorage.getAddress(rocketEtherKey))

interface RocketStorage:
  def getAddress(_key: bytes32) -> address: view

interface RocketDepositPool:
  def deposit(): payable

rocketStorage: immutable(RocketStorage)
rocketEther: immutable(ERC20)
rocketEtherKey: constant(bytes32) = keccak256("contract.addressrocketTokenRETH")
rocketDepositPoolKey: constant(bytes32) = keccak256("contract.addressrocketDepositPool")

@external
def receiveReward(_from: address, _amount: uint256):
  assert rewardToken.transferFrom(_from, self, _amount), "transferFrom"

  if self.totalStake == 0:
    self.temp += _amount
    return

  amount: uint256 = _amount
  if 0 < self.temp:
    amount += self.temp
    self.temp = 0

  rawReward: uint256 = amount + self.dust
  totalBonds: uint256 = self.totalStake / precision
  bondInc: uint256 = rawReward / totalBonds
  reward: uint256 = totalBonds * bondInc
  self.bondValue += bondInc
  self.dust = rawReward - reward

event Stake:
  user: indexed(address)
  amount: indexed(uint256)

event Unstake:
  user: indexed(address)
  amount: indexed(uint256)
  reward: indexed(uint256)

@internal
def _stake(user: address, amount: uint256):
  assert 0 < amount, "amount"
  self.totalStake += amount
  reward: uint256 = self._reward(user, self.stakes[user].amount)
  self.stakes[user].amount += amount
  bondValue: uint256 = reward * precision / self.stakes[user].amount
  self.stakes[user].bondValue = self.bondValue - bondValue
  log Stake(user, amount)

@internal
def _unstake(user: address, amount: uint256):
  assert 0 < amount, "amount"
  assert amount <= self.stakes[user].amount, "balance"
  reward: uint256 = self._reward(user, amount)
  self.totalStake -= amount
  self.stakes[user].amount -= amount
  assert rocketEther.transfer(user, amount), "send"
  log Unstake(user, amount, reward)
  if reward == 0: return
  assert rewardToken.transfer(user, reward), "transfer"

@internal
@view
def _reward(user: address, stake: uint256) -> uint256:
  return (stake * (self.bondValue - self.stakes[user].bondValue)) / precision

@external
def unstake(amount: uint256):
  self._unstake(msg.sender, amount)

@external
@payable
def receive(user: address):
  rETHBefore: uint256 = rocketEther.balanceOf(self)
  RocketDepositPool(rocketStorage.getAddress(rocketDepositPoolKey)).deposit(value = msg.value)
  rETHMinted: uint256 = rocketEther.balanceOf(self) - rETHBefore
  self._stake(user, rETHMinted)
