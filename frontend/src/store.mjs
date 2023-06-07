import { waitForSeconds, createStore } from './util.mjs'

// usage: const { setState, getState, subscribe, destroy } = store
// based on zustand state management lib


// Lidont Store
//
export const store = createStore((setState, getState, api) => ({
    time: 200,
    points: undefined,
    isReloading: false,

    reload: async () => {
        await waitForSeconds(2)
        setState({ isReloading: false })
        window.RADIO.emit("reload")
    },

}))



// Wallet Store
//

export const walletStore = createStore((setState, getState, api) => ({
    balance: null,
    balanceFormatted: null,
    balancesErc20: [],

    provider: window.ethereum ? new ethers.providers.Web3Provider(window.ethereum) : new ethers.providers.InfuraProvider("mainnet", "ID"),

    async connectWallet() {
        const { ethereum } = window;
        if (ethereum && this.address == "" && this.loading === false) {

          try {
            await ethereum.request({ method: "eth_requestAccounts" });
          } catch (error) { return console.log(error) }

          const accounts = await ethereum.request({ method: "eth_accounts" });
          const provider = provider;
          const signer = provider.getSigner();
          const chainId = await signer.getChainId();
          
          await updateBalance();

          setState({ address: accounts[0] })
          setState({ chainId: chainId })

        }
    },

    async updateBalance() {
        let signer

        try { 
          signer = provider.getSigner();
        } catch(e) { return console.log(e) }
  
        const balance = await signer.getBalance();
        setState({ balance })
        const balanceFormatted = ethers.utils.formatEther(balance)
        setState({ balanceFormatted })

        return {balance, balanceFormatted}
      },
  
      async updateErc20Balance(address) {
        let signer
        let signerAddr
        
        try {
          signer = provider.getSigner();
          signerAddr = signer.getAddress()
        } catch(e) { return console.log(e) }
  
        const entry = balances[address]
        entry = entry || {}
        const contract = new ethers.Contract(address, Erc20Abi, provider);
        entry.name = await contract.name()
        entry.symbol = await contract.symbol()
        entry.decimals = await contract.decimals()
        entry.balance = await contract.balanceOf(signerAddr);
        entry.balanceFormatted = await ethers.utils.formatUnits(entry.balance, entry.decimals)
        return entry
      },

}))


