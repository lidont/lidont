from ape import networks, config

def main():
    print("Network settings:")
    print(f"Current network: {networks.active_provider.network.name}")
    print(f"Default provider: {networks.active_provider.name}")
    
    print("\nProvider settings:")
    if hasattr(config, 'infura'):
        print(f"Infura configured: {'api_key' in config.infura}")
    if hasattr(config, 'etherscan'):
        print(f"Etherscan configured: {'api_key' in config.etherscan}")
    
    print("\nFork settings:")
    try:
        print("Foundry config:", config.foundry)
        if hasattr(config.foundry, 'fork'):
            print("Fork config:", config.foundry.fork)
    except Exception as e:
        print(f"Error accessing fork settings: {e}")