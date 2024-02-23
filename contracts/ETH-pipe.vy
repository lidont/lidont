# @version ^0.3.9

interface Withdrawler:
  def triggerEmission(_pipe: address): nonpayable

interface RewardToken:
  def decimals() -> uint8: view
  def transfer(_to: address, _value: uint256) -> bool: nonpayable
  def transferFrom(_from: address, _to: address, _value: uint256) -> bool: nonpayable

rewardToken: public(immutable(RewardToken))
withdrawler: public(immutable(Withdrawler))

decimals: public(immutable(uint256))

initialBondValue: constant(uint256) = 100000000
bondValue: public(uint256)

temp: public(uint256) # rewards received while there are no stakers
dust: public(uint256) # reward dust from a receipt to be added to next receipt

struct StakedBond:
  amount: uint256
  pending: uint256
  bondValue: uint256

stakes: public(HashMap[address, StakedBond])
totalStake: public(uint256)

@external
def __init__(rewardTokenAddress: address, withdrawlerAddress: address):
  withdrawler = Withdrawler(withdrawlerAddress)
  rewardToken = RewardToken(rewardTokenAddress)
  decimals = convert(rewardToken.decimals(), uint256)
  self.bondValue = initialBondValue

event Receive:
  amount: indexed(uint256)
  oldBondValue: indexed(uint256)
  newBondValue: indexed(uint256)

@external
def receiveReward(_token: address, _from: address, _amount: uint256):
  assert _token == rewardToken.address, "token"
  assert rewardToken.transferFrom(_from, self, _amount), "transferFrom"

  totalBonds: uint256 = self.totalStake / decimals

  if totalBonds == 0:
    self.temp += _amount
    return

  amount: uint256 = _amount

  if 0 < self.temp:
    amount += self.temp
    self.temp = 0

  toDistribute: uint256 = self.dust + amount
  bondIncrease: uint256 = toDistribute / totalBonds
  distributedTotal: uint256 = totalBonds * bondIncrease
  oldBondValue: uint256 = self.bondValue
  self.bondValue += bondIncrease
  self.dust = toDistribute - distributedTotal

  log Receive(_amount, oldBondValue, self.bondValue)

event Stake:
  user: indexed(address)
  amount: indexed(uint256)

event Unstake:
  user: indexed(address)
  amount: indexed(uint256)
  reward: indexed(uint256)

@internal
def forceSend(_to: address, _amount: uint256) -> bool:
  # gas=0 should prevent any action on receipt, and hence any chance of reentrancy
  return raw_call(_to, b"", value=_amount, gas=0, revert_on_failure=False)

@internal
def _stake(user: address, amount: uint256):
  assert 0 < amount, "amount"
  self.totalStake += amount
  reward: uint256 = self._reward(user, self.stakes[user].amount)
  if 0 < reward:
    self.stakes[user].pending += reward
  self.stakes[user].amount += amount
  self.stakes[user].bondValue = self.bondValue
  log Stake(user, amount)

@internal
def _unstake(user: address, amount: uint256):
  assert 0 < amount, "amount"
  self.totalStake -= amount
  self.stakes[user].amount -= amount
  reward: uint256 = self._reward(user, amount) + self.stakes[user].pending
  self.stakes[user].pending = 0
  assert self.forceSend(user, amount), "send"
  log Unstake(user, amount, reward)
  if 0 < reward:
    assert rewardToken.transfer(user, reward), "transfer"

@internal
@view
def _reward(user: address, stake: uint256) -> uint256:
  return stake * (self.bondValue - self.stakes[user].bondValue)

@external
def unstake(amount: uint256):
  withdrawler.triggerEmission(self)
  self._unstake(msg.sender, amount)

@external
def previewUnstake(user: address, amount: uint256) -> uint256:
  withdrawler.triggerEmission(self)
  return self._reward(user, amount) + self.stakes[user].pending

@external
@payable
def receive(user: address, unused_data: Bytes[1]):
  assert msg.sender == withdrawler.address, "auth"
  self._stake(user, msg.value)
