#pragma version ~=0.4.0
#pragma evm-version cancun
#pragma optimize gas

interface ERC20:
  def balanceOf(_owner: address) -> uint256: view
  def transfer(_to: address, _value: uint256) -> bool: nonpayable
  def transferFrom(_from: address, _to: address, _value: uint256) -> bool: nonpayable

interface RocketStorage:
  def getAddress(_key: bytes32) -> address: view

interface RocketDepositPool:
  def deposit(): payable

rocketStorage: immutable(RocketStorage)
rocketEther: immutable(ERC20)
rocketEtherKey: constant(bytes32) = keccak256("contract.addressrocketTokenRETH")
rocketDepositPoolKey: constant(bytes32) = keccak256("contract.addressrocketDepositPool")

@deploy
def __init__(rocketStorageAddress: address):
  rocketStorage = RocketStorage(rocketStorageAddress)
  rocketEther = ERC20(staticcall rocketStorage.getAddress(rocketEtherKey))

event Output:
  user: indexed(address)
  rETH: indexed(uint256)
  lidont: indexed(uint256)

@external
@payable
def receive(user: address, lidontAmount: uint256):
  rETHBefore: uint256 = staticcall rocketEther.balanceOf(self)
  extcall RocketDepositPool(staticcall rocketStorage.getAddress(rocketDepositPoolKey)).deposit(value = msg.value)
  rETHMinted: uint256 = staticcall rocketEther.balanceOf(self) - rETHBefore
  assert extcall ERC20(msg.sender).transferFrom(empty(address), user, lidontAmount)
  assert extcall rocketEther.transfer(user, rETHMinted)
  log Output(user, rETHMinted, lidontAmount)
