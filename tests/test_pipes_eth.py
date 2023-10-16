from ape import reverts, Contract
from eth_abi.abi import encode
from eth_utils import keccak
import pytest

addresses = dict(mainnet =
                 dict(rocketStorageAddress = '0x1d8f8f00cfa6758d7bE78336684788Fb0ee0Fa46',
                      stETHAddress         = '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
                      unstETHAddress       = '0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1',
                      ),
                 )

EMISSION_PER_BLOCK = 10 ** 9

@pytest.fixture(scope="session")
def addr(networks):
    network = networks.provider.network.name.removesuffix('-fork')
    return addresses[network]

@pytest.fixture(scope="session")
def withdrawler(project, addr, accounts):
    withdrawler = project.withdrawler.deploy(
            addr['stETHAddress'], addr['unstETHAddress'], sender=accounts[0])
    return withdrawler

@pytest.fixture(scope="session")
def start_emission(withdrawler, accounts):
    return withdrawler.changeEmissionRate(EMISSION_PER_BLOCK, sender=accounts[0])

@pytest.fixture(scope="session")
def lidont(project, accounts, withdrawler):
    lidont = project.lidont.deploy(withdrawler.address, sender=accounts[0])
    withdrawler.setLidont(lidont.address, sender=accounts[0])
    return lidont

@pytest.fixture(scope="session")
def ETH_pipe(project, lidont, withdrawler, accounts):
    pipe = project._get_attr('ETH-pipe').deploy(lidont.address, withdrawler.address, sender=accounts[0])
    withdrawler.toggleValidOutput(pipe.address, sender=accounts[0])
    return pipe

@pytest.fixture(scope="function")
def mint_lidont(lidont, project, withdrawler, accounts):
    lidont.mint(800 * 10 ** 18, accounts[0].address, sender=withdrawler)
    lidont.transferFrom("0x0000000000000000000000000000000000000000", accounts[0], 800 * 10 ** 18, sender=accounts[0])
    return lidont.balanceOf(accounts[0].address)

@pytest.fixture(scope="function")
def stake_ETH(ETH_pipe, accounts):
    amount0 = 10**18
    amount1 = 5 * 10**17
    ETH_pipe.receive(accounts[0].address, value=amount0, sender=accounts[0])
    ETH_pipe.receive(accounts[1].address, value=amount1, sender=accounts[0])
    return {"stake0":amount0, "stake1":amount1}

@pytest.fixture(scope="function")
def setup_allowance(ETH_pipe, lidont, accounts):
    lidont.approve(ETH_pipe.address, 99999999 * 10**18, sender=accounts[0])
    return lidont.allowance(accounts[0].address, ETH_pipe.address)

@pytest.fixture(scope="function")
def distribute_reward(ETH_pipe, lidont, mint_lidont, accounts):
    ETH_pipe.receiveReward(lidont.address, accounts[0].address, mint_lidont, sender=accounts[0])
    return mint_lidont

def test_init_eth(ETH_pipe, lidont, accounts):
    assert ETH_pipe.temp() == 0
    assert ETH_pipe.dust() == 0
    assert ETH_pipe.bondValue() == 100000000
    assert ETH_pipe.totalStake() == 0

def test_stake_eth(ETH_pipe, stake_ETH, accounts):
    assert ETH_pipe.totalStake() == stake_ETH['stake0'] + stake_ETH['stake1']
    assert ETH_pipe.stakes(accounts[0].address).amount == stake_ETH['stake0']
    assert ETH_pipe.stakes(accounts[1].address).amount == stake_ETH['stake1']

def test_unstake_eth_no_rewards(ETH_pipe, stake_ETH, accounts):
    ETH_pipe.unstake(stake_ETH['stake0'], sender=accounts[0])
    assert ETH_pipe.totalStake() == stake_ETH['stake1']

def test_rewards_eth_no_stakers(ETH_pipe, lidont, mint_lidont, setup_allowance, distribute_reward, accounts):
    assert ETH_pipe.temp() == mint_lidont
    assert ETH_pipe.bondValue() == 100000000

def test_rewards_eth(ETH_pipe, lidont, mint_lidont, setup_allowance, stake_ETH, distribute_reward, accounts):
    assert ETH_pipe.temp() == 0
    totalBonds = ETH_pipe.totalStake() // 10 ** 9 # dividing the stake by precision here
    bondInc = distribute_reward // totalBonds
    totalDistributed = bondInc * totalBonds
    assert ETH_pipe.bondValue() == 100000000 + bondInc
    assert ETH_pipe.dust() == distribute_reward - totalDistributed

def test_rewards_eth_temp_clearing(ETH_pipe, lidont, withdrawler, mint_lidont, setup_allowance, distribute_reward, stake_ETH, accounts):
    assert ETH_pipe.temp() == mint_lidont
    lidont.mint(800 * 10 ** 18, accounts[0].address, sender=withdrawler)
    lidont.transferFrom("0x0000000000000000000000000000000000000000", accounts[0], 800 * 10 ** 18, sender=accounts[0])
    ETH_pipe.receiveReward(lidont.address, accounts[0].address, mint_lidont, sender=accounts[0])
    assert ETH_pipe.temp() == 0

def test_rewards_eth_dust_clearing(ETH_pipe, lidont, withdrawler, mint_lidont, setup_allowance, stake_ETH, distribute_reward, accounts):
    assert ETH_pipe.dust() > 0
    dust = ETH_pipe.dust()
    totalBonds = ETH_pipe.totalStake() // 10 ** 9
    perfectReward = totalBonds * 2
    rewardsToClear = perfectReward - dust
    lidont.mint(rewardsToClear, accounts[0].address, sender=withdrawler)
    lidont.transferFrom("0x0000000000000000000000000000000000000000", accounts[0], rewardsToClear, sender=accounts[0])
    ETH_pipe.receiveReward(lidont.address, accounts[0].address, rewardsToClear, sender=accounts[0])
    assert ETH_pipe.dust() == 0

def test_unstake_eth_with_rewards(ETH_pipe, lidont, mint_lidont, setup_allowance, stake_ETH, distribute_reward, accounts):
    reward = (stake_ETH['stake1'] * (ETH_pipe.bondValue() - ETH_pipe.stakes(accounts[1]).bondValue)) // 10 * 9
    ETH_pipe.unstake(stake_ETH['stake1'], sender=accounts[1])
    assert ETH_pipe.totalStake() == stake_ETH['stake0']
    lidont.balanceOf(accounts[1]) == reward
