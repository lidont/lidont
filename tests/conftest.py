from ape import Contract
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
                      rocketSwapRouter     = '0x16D5A408e807db8eF7c578279BEeEe6b228f1cC',
                      ),
                 goerli =
                 dict(rocketStorageAddress = '0xd8Cd47263414aFEca62d6e2a3917d6600abDceB3',
                      stETHAddress         = '0x1643E812aE58766192Cf7D2Cf9567dF2C37e9B7F',
                      unstETHAddress       = '0xCF117961421cA9e546cD7f50bC73abCdB3039533',
                      )
                 )

ONE_DAY_SECONDS = 24 * 60 * 60
EMISSION_PER_BLOCK = 10 ** 9

@pytest.fixture()
def addr(networks):
    time.sleep(1)
    network = networks.provider.network.name.removesuffix('-fork')
    return addresses[network]

@pytest.fixture()
def stETH(addr):
    time.sleep(1)
    return Contract(addr['stETHAddress'])

@pytest.fixture()
def unstETH(addr):
    time.sleep(1)
    return Contract(addr['unstETHAddress'])

@pytest.fixture()
def rocketStorage(addr):
    time.sleep(1)
    return Contract(addr['rocketStorageAddress'])

@pytest.fixture()
def rocketSwapRouter(addr):
    time.sleep(1)
    return Contract(addr['rocketSwapRouter'])

@pytest.fixture()
def withdrawler(project, addr, accounts):
    time.sleep(1)
    withdrawler = project.withdrawler.deploy(
            addr['stETHAddress'], addr['unstETHAddress'], sender=accounts[0])
    return withdrawler

@pytest.fixture()
def start_emission(withdrawler, accounts):
    time.sleep(1)
    return withdrawler.changeEmissionRate(EMISSION_PER_BLOCK, sender=accounts[0])

@pytest.fixture()
def lidont(project, accounts, withdrawler):
    time.sleep(1)
    lidont = project.lidont.deploy(withdrawler.address, sender=accounts[0])
    withdrawler.setLidont(lidont.address, sender=accounts[0])
    return lidont

@pytest.fixture()
def ETH_pipe(project, lidont, withdrawler, accounts):
    time.sleep(1)
    return project.get_contract('ETH-pipe').deploy(lidont.address, withdrawler.address, sender=accounts[0])

@pytest.fixture()
def ETH_pipe_added(withdrawler, ETH_pipe, accounts):
    time.sleep(1)
    receipt = withdrawler.toggleValidOutput(ETH_pipe.address, sender=accounts[0])
    return {'pipe': ETH_pipe, 'toggle_valid_receipt': receipt}

@pytest.fixture()
def deposit_ETH_pipe(accounts, withdrawler, have_stETH, stETH, ETH_pipe_added):
    time.sleep(1)
    amount = 42 * 10 ** 17
    assert stETH.approve(withdrawler.address, amount, sender=accounts[0])
    withdrawler.deposit(amount, ETH_pipe_added['pipe'].address, sender=accounts[0])
    return {"amount": amount}

@pytest.fixture()
def rETH_pipe(project, lidont, withdrawler, accounts, addr):
    time.sleep(1)
    return project.get_contract('rETH-pipe').deploy(lidont.address, withdrawler.address, addr["rocketStorageAddress"], sender=accounts[0])

@pytest.fixture()
def rETH_pipe_added(withdrawler, rETH_pipe, accounts):
    time.sleep(1)
    withdrawler.toggleValidOutput(rETH_pipe.address, sender=accounts[0])
    return rETH_pipe

@pytest.fixture()
def deposit_rETH_pipe(accounts, withdrawler, have_stETH, stETH, rETH_pipe_added):
    time.sleep(1)
    amount = 42 * 10 ** 9
    assert stETH.approve(withdrawler.address, amount, sender=accounts[0])
    withdrawler.deposit('42 gwei', rETH_pipe_added.address, sender=accounts[0])
    return {"amount": amount}

@pytest.fixture()
def one_withdrawal_initiated(withdrawler, deposit_ETH_pipe, accounts):
    time.sleep(1)
    queueSize = withdrawler.queueSize()
    assert queueSize == 1
    assert withdrawler.queue(0) == accounts[0].address
    receipt = withdrawler.initiateWithdrawal([accounts[0]], sender=accounts[0])
    requestIds = receipt.return_value
    return requestIds

@pytest.fixture()
def reth_withdrawal_initiated(withdrawler, deposit_rETH_pipe, accounts):
    time.sleep(1)
    queueSize = withdrawler.queueSize()
    assert queueSize == 1
    assert withdrawler.queue(0) == accounts[0].address
    receipt = withdrawler.initiateWithdrawal([accounts[0]], sender=accounts[0])
    requestIds = receipt.return_value
    return requestIds

@pytest.fixture()
def one_withdrawal_finalized(withdrawler, addr, stETH, unstETH, one_withdrawal_initiated, chain, accounts):
    time.sleep(1)
    requestId = one_withdrawal_initiated[0]
    return finalize(requestId, withdrawler, addr, stETH, unstETH, chain, accounts)

@pytest.fixture()
def reth_withdrawal_finalized(withdrawler, addr, stETH, unstETH, reth_withdrawal_initiated, chain, accounts):
    time.sleep(1)
    requestId = reth_withdrawal_initiated[0]
    return finalize(requestId, withdrawler, addr, stETH, unstETH, chain, accounts)

@pytest.fixture()
def one_withdrawal_claimed(one_withdrawal_finalized, withdrawler, accounts):
    time.sleep(1)
    assert len(one_withdrawal_finalized) == 1
    return withdrawler.claim(b'', sender=accounts[0])

@pytest.fixture()
def reth_withdrawal_claimed(reth_withdrawal_finalized, withdrawler, rocketSwapRouter, accounts):
    time.sleep(1)
    assert len(reth_withdrawal_finalized) == 1
    amount = reth_withdrawal_finalized[0]
    result = rocketSwapRouter.call_view_method('optimiseSwapTo', amount, 10, sender=accounts[0])
    portions = result[0]
    amountOut = result[1]
    data = (portions[0], portions[1], amountOut, amountOut)
    byteData = encode(['(uint256,uint256,uint256,uint256)'], [data])
    return withdrawler.claim(byteData, sender=accounts[0])

@pytest.fixture()
def have_stETH(stETH, accounts):
    time.sleep(1)
    return stETH.submit(accounts[0], value='6.9 ETH', sender=accounts[0])
