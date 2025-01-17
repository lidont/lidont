from ape import reverts, Contract
from eth_abi.abi import encode
from eth_utils import keccak
import pytest
import time

addresses = dict(mainnet =
                 dict(rocketStorageAddress = '0x1d8f8f00cfa6758d7bE78336684788Fb0ee0Fa46',
                      stETHAddress         = '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
                      unstETHAddress       = '0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1',
                      hashConsensus        = '0xD624B08C83bAECF0807Dd2c6880C3154a5F0B288',
                      accountingOracle     = '0x852deD011285fe67063a08005c71a85690503Cee',
                      withdrawalVault      = '0xB9D7934878B5FB9610B3fE8A5e441e8fad7E293f',
                      elRewardsVault       = '0x388C818CA8B9251b393131C08a736A67ccB19297',
                      burner               = '0xD15a672319Cf0352560eE76d9e89eAB0889046D3',
                      sanityChecker        = '0x9305c1Dbfe22c12c66339184C0025d7006f0f1cC',
                      ),
                 goerli =
                 dict(rocketStorageAddress = '0xd8Cd47263414aFEca62d6e2a3917d6600abDceB3',
                      stETHAddress         = '0x1643E812aE58766192Cf7D2Cf9567dF2C37e9B7F',
                      unstETHAddress       = '0xCF117961421cA9e546cD7f50bC73abCdB3039533',
                      )
                 )

EMISSION_PER_BLOCK = 10 ** 9

@pytest.fixture(scope="session")
def addr(networks):
    time.sleep(2)
    network = networks.provider.network.name.removesuffix('-fork')
    return addresses[network]

@pytest.fixture(scope="session")
def stETH(addr):
    time.sleep(2)
    return Contract(addr['stETHAddress'])

@pytest.fixture(scope="session")
def unstETH(addr):
    time.sleep(2)
    return Contract(addr['unstETHAddress'])

@pytest.fixture(scope="session")
def withdrawler(project, addr, accounts):
    time.sleep(2)
    withdrawler = project.withdrawler.deploy(
            addr['stETHAddress'], addr['unstETHAddress'], sender=accounts[0])
    return withdrawler

@pytest.fixture(scope="session")
def start_emission(withdrawler, accounts):
    time.sleep(2)
    return withdrawler.changeEmissionRate(EMISSION_PER_BLOCK, sender=accounts[0])

@pytest.fixture(scope="session")
def lidont(project, accounts, withdrawler):
    time.sleep(2)
    lidont = project.lidont.deploy(withdrawler.address, sender=accounts[0])
    withdrawler.setLidont(lidont.address, sender=accounts[0])
    return lidont

@pytest.fixture(scope="session")
def ETH_pipe(project, lidont, withdrawler, accounts):
    time.sleep(2)
    pipe = project.ETH_pipe.deploy(lidont.address, withdrawler.address, sender=accounts[0])
    withdrawler.toggleValidOutput(pipe.address, sender=accounts[0])
    return pipe

@pytest.fixture(scope="function")
def mint_lidont(lidont, project, withdrawler, accounts):
    lidont.mint(800 * 10 ** 18, accounts[0].address, sender=withdrawler)
    lidont.transferFrom("0x0000000000000000000000000000000000000000", accounts[0], 800 * 10 ** 18, sender=accounts[0])
    return lidont.balanceOf(accounts[0].address)

@pytest.fixture(scope="function")
def have_stETH(stETH, accounts):
    time.sleep(2)
    # Submit ETH to get stETH
    stETH.submit(accounts[0], value='6.9 ETH', sender=accounts[0])
    stETH.submit(accounts[1], value='6.9 ETH', sender=accounts[1])
    return True

@pytest.fixture(scope="function")
def stake_ETH(ETH_pipe, accounts, withdrawler, stETH, unstETH, have_stETH):
    print("\n=== Starting stake_ETH fixture ===")
    
    # Define test amounts
    amount0 = 10**18  # 1 ETH
    amount1 = 5 * 10**17  # 0.5 ETH
    
    # First deposit through stETH path for accounts[0]
    # Submit ETH to get stETH
    accounts[0].balance = amount0 * 2  # Ensure enough balance
    stETH.submit(accounts[0], value=amount0, sender=accounts[0])
    
    # Approve withdrawler to spend stETH
    stETH.approve(withdrawler.address, amount0, sender=accounts[0])
    
    # Deposit stETH to withdrawler
    withdrawler.deposit(amount0, ETH_pipe.address, sender=accounts[0])
    
    # Process withdrawal
    withdrawler.initiateWithdrawal([accounts[0]], sender=accounts[0])
    
    # Get request IDs and finalize withdrawal
    requestIds = withdrawler.initiateWithdrawal([accounts[0]], sender=accounts[0]).return_value
    hints = unstETH.findCheckpointHints([requestIds[0]], 1, unstETH.getLastCheckpointIndex())
    
    # Finalize and claim
    withdrawler.finaliseWithdrawal([accounts[0]], hints, sender=accounts[0])
    withdrawler.claim(b"", sender=accounts[0])
    
    # Same process for accounts[1]
    accounts[1].balance = amount1 * 2
    stETH.submit(accounts[1], value=amount1, sender=accounts[1])
    stETH.approve(withdrawler.address, amount1, sender=accounts[1])
    withdrawler.deposit(amount1, ETH_pipe.address, sender=accounts[1])
    withdrawler.initiateWithdrawal([accounts[1]], sender=accounts[1])
    requestIds = withdrawler.initiateWithdrawal([accounts[1]], sender=accounts[1]).return_value
    hints = unstETH.findCheckpointHints([requestIds[0]], 1, unstETH.getLastCheckpointIndex())
    withdrawler.finaliseWithdrawal([accounts[1]], hints, sender=accounts[1])
    withdrawler.claim(b"", sender=accounts[1])
    
    print("=== Completed stake_ETH fixture ===")
    return {"stake0": amount0, "stake1": amount1}

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
    totalBonds = ETH_pipe.totalStake() // 10 ** 9  # dividing the stake by precision here
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