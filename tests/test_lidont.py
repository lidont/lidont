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
def rETH_pipe(project, lidont, accounts):
    return project._get_attr('rETH-pipe').deploy(lidont.address, sender=accounts[0])

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

@pytest.fixture(scope="session")
def ETH_pipe_added(withdrawler, ETH_pipe, accounts):
    withdrawler.toggleValidOutput(ETH_pipe.address, sender=accounts[0])
    return ETH_pipe

@pytest.fixture(scope="session")
def rETH_pipe_added(withdrawler, rETH_pipe, accounts):
    withdrawler.toggleValidOutput(rETH_pipe.address, sender=accounts[0])
    return ETH_pipe

def test_cannot_deposit_no_amount(withdrawler, ETH_pipe_added, accounts):
    with reverts("no deposit"):
        withdrawler.deposit(0, ETH_pipe_added.address, sender=accounts[0])

def test_cannot_deposit_not_approved(withdrawler, ETH_pipe_added, accounts):
    with reverts("ALLOWANCE_EXCEEDED"):
        withdrawler.deposit(1, ETH_pipe_added.address, sender=accounts[0])

def test_cannot_deposit_no_balance(withdrawler, stETH, ETH_pipe_added, accounts):
    assert stETH.approve(withdrawler.address, 1, sender=accounts[0])
    with reverts():
        withdrawler.deposit(1, ETH_pipe_added.address, sender=accounts[0])
