from ape import accounts, networks, project
from postDeployFork import postDeployFork
import IPython

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

def main():
    network = networks.provider.network.name
    if network.endswith('-fork'):
        deployer = accounts.test_accounts[0]
    else:
        deployer = accounts[0]
    network = network.removesuffix('-fork')
    addr = addresses[network]
    withdrawler = project.withdrawler.deploy(
            addr['stETHAddress'], addr['unstETHAddress'], sender=deployer)
    lidont = project.lidont.deploy(withdrawler.address, sender=deployer)
    withdrawler.setLidont(lidont.address, sender=deployer)
    ethPipe = project._get_attr('ETH-pipe').deploy(
            lidont.address, sender=deployer)
    rethPipe = project._get_attr('rETH-pipe').deploy(
            lidont.address, addr['rocketStorageAddress'], sender=deployer)
    withdrawler.toggleValidOutput(ethPipe.address, sender=deployer)
    withdrawler.toggleValidOutput(rethPipe.address, sender=deployer)

    """
        postDeployFork()
    """
        
    IPython.embed()
