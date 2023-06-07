import * as ethers from '../node_modules/ethers/dist/ethers.js';
import { waitForSeconds, createStore, log } from './util.mjs'
import { Erc20Abi } from './ConnectWeb3.mjs'


// Lidont Store
//
/*
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
*/



// Wallet Store
//

export const walletStore = createStore(log( (setState, getState, api) => ({
    loading: false,
    address: null,
    balance: null,
    balanceFormatted: null,
    balancesErc20: [],

    provider: window.ethereum ? new ethers.BrowserProvider(window.ethereum) : new ethers.InfuraProvider("mainnet", "ID"),

    async connectWallet() {
        const { address, loading } = getState()
        const { ethereum } = window;

        if (ethereum && !address && !loading) {

          try {
            await ethereum.request({ method: "eth_requestAccounts" });
          } catch (error) { return console.log(error) }

          const accounts = await ethereum.request({ method: "eth_accounts" });
          const provider = getState().provider;
          const signer = await provider.getSigner();
          const network = await signer.provider.getNetwork();
          const chainId = network.chainId

          setState({ address: accounts[0] })
          setState({ chainId: chainId })
          
          await getState().updateBalance();
        }
    },

    async updateBalance() {
        let signer
        const { provider, address } = getState();

        try { 
          signer = await provider.getSigner();
        } catch(e) { return console.log(e) }
  
        const balance = await provider.getBalance(address);
        setState({ balance })
        const balanceFormatted = ethers.formatEther(balance)
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

})))


