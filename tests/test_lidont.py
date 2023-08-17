from ape import reverts, Contract
import pytest

addresses = dict(mainnet =
                 dict(rocketStorageAddress = '0x1d8f8f00cfa6758d7bE78336684788Fb0ee0Fa46',
                      stETHAddress         = '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
                      unstETHAddress       = '0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1',
                      ),
                 goerli =
                 dict(rocketStorageAddress = '0xd8Cd47263414aFEca62d6e2a3917d6600abDceB3',
                      stETHAddress         = '0x1643E812aE58766192Cf7D2Cf9567dF2C37e9B7F',
                      unstETHAddress       = '0xCF117961421cA9e546cD7f50bC73abCdB3039533',
                      )
                 )

@pytest.fixture(scope="session")
def addr(networks):
    network = networks.provider.network.name.removesuffix('-fork')
    return addresses[network]

@pytest.fixture(scope="session")
def stETH(addr):
    return Contract(addr['stETHAddress'])

@pytest.fixture(scope="session")
def unstETH(addr):
    return Contract(addr['unstETHAddress'])

@pytest.fixture(scope="session")
def withdrawler(project, addr, accounts):
    return project.withdrawler.deploy(
            addr['stETHAddress'], addr['unstETHAddress'], sender=accounts[0])

@pytest.fixture(scope="session")
def lidont(project, accounts, withdrawler):
    lidont = project.lidont.deploy(withdrawler.address, sender=accounts[0])
    withdrawler.setLidont(lidont.address, sender=accounts[0])
    return lidont

@pytest.fixture(scope="session")
def ETH_pipe(project, lidont, accounts):
    return project._get_attr('ETH-pipe').deploy(lidont.address, sender=accounts[0])

@pytest.fixture(scope="session")
def rETH_pipe(project, lidont, accounts, addr):
    return project._get_attr('rETH-pipe').deploy(lidont.address, addr["rocketStorageAddress"], sender=accounts[0])


def test_lidont_symbol_decimals(lidont):
    assert lidont.symbol() == 'LIDONT'
    assert lidont.decimals() == 18

def test_cannot_deposit_no_pipe(withdrawler, accounts):
    import secrets
    arbitraryPipe = f'0x{secrets.token_hex(20)}'
    assert withdrawler.outputIndex(arbitraryPipe) == 0
    with reverts("invalid pipe"):
        withdrawler.deposit(1, arbitraryPipe, sender=accounts[0])

def test_toggle_pipe_makes_valid(withdrawler, ETH_pipe, accounts):
    assert withdrawler.outputIndex(ETH_pipe.address) == 0
    withdrawler.toggleValidOutput(ETH_pipe.address, sender=accounts[0])
    assert withdrawler.outputIndex(ETH_pipe.address) == 1

@pytest.fixture(scope="function")
def ETH_pipe_added(withdrawler, ETH_pipe, accounts):
    withdrawler.toggleValidOutput(ETH_pipe.address, sender=accounts[0])
    return ETH_pipe

@pytest.fixture(scope="function")
def rETH_pipe_added(withdrawler, rETH_pipe, accounts):
    withdrawler.toggleValidOutput(rETH_pipe.address, sender=accounts[0])
    return rETH_pipe

def test_cannot_deposit_no_amount(withdrawler, ETH_pipe_added, accounts):
    with reverts("no deposit"):
        withdrawler.deposit(0, ETH_pipe_added.address, sender=accounts[0])

@pytest.fixture(scope="function")
def have_stETH(stETH, accounts):
    return stETH.submit(accounts[0], value='6942069420 gwei', sender=accounts[0])

def test_cannot_deposit_not_approved(withdrawler, have_stETH, ETH_pipe_added, accounts):
    with reverts("ALLOWANCE_EXCEEDED"):
        withdrawler.deposit(1, ETH_pipe_added.address, sender=accounts[0])

def test_cannot_deposit_no_balance(withdrawler, stETH, ETH_pipe_added, accounts):
    assert stETH.balanceOf(accounts[0]) == 0
    assert stETH.approve(withdrawler.address, 1, sender=accounts[0])
    with reverts("balance"):
        withdrawler.deposit(1, ETH_pipe_added.address, sender=accounts[0])

def test_deposit_pipe_ETH(withdrawler, stETH, have_stETH, ETH_pipe_added, accounts):
    amount = 42 * 10 ** 9
    assert stETH.approve(withdrawler.address, amount, sender=accounts[0])
    withdrawler.deposit('42 gwei', ETH_pipe_added.address, sender=accounts[0])
    assert withdrawler.deposits(accounts[0]).stETH == amount

def test_deposit_pipe_rETH(withdrawler, addr, stETH, have_stETH, rETH_pipe_added, accounts):
    amount = 42 * 10 ** 9
    assert stETH.approve(withdrawler.address, amount, sender=accounts[0])
    withdrawler.deposit('42 gwei', rETH_pipe_added.address, sender=accounts[0])
    assert withdrawler.deposits(accounts[0]).stETH == amount

@pytest.fixture(scope="function")
def deposit_ETH_pipe(accounts, withdrawler, stETH, ETH_pipe_added):
    amount = 42 * 10 ** 9
    stETH.approve(withdrawler.address, amount, sender=accounts[0])
    withdrawler.deposit('42 gwei', ETH_pipe_added.address, sender=accounts[0])
    withdrawler.deposits(accounts[0]).stETH == amount

def test_cannot_deposit_different_pipe_after_deposit(withdrawler, addr, accounts, stETH, have_stETH, rETH_pipe_added, deposit_ETH_pipe):
    amount = 42 * 10 ** 9
    assert stETH.approve(withdrawler.address, amount, sender=accounts[0])
    with reverts("pending deposit"):
        withdrawler.deposit('42 gwei', rETH_pipe_added.address, sender=accounts[0])

def test_initiateWithdrawal(withdrawler, addr, accounts, stETH, have_stETH, deposit_ETH_pipe, ETH_pipe_added):
    queueSize = withdrawler.queueSize()
    queue = []
    for x in range(queueSize):
        queue.append(withdrawler.queue(x))
    assert queueSize == 1
    assert queue[0] == "0x1e59ce931B4CFea3fe4B875411e280e173cB7A9C"
    receipt = withdrawler.initiateWithdrawal(queue, sender=accounts[0])
    requestIds = receipt.transaction.data
    assert requestIds