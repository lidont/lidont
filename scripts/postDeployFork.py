from ape import accounts, networks, project, Contract
import IPython

def postDeployFork():
    stETH = Contract(addr['stETHAddress'])
    accounts.test_accounts[0].transfer(accounts[0], 1000000000000000000)
    stETH.submit(accounts[0], value='1000000000 gwei', sender=accounts[0])
    print(networks.active_provider.uri)