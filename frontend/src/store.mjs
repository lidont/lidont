import * as ethers from "../node_modules/ethers/dist/ethers.js";
import { createStore, RADIO, log} from "./util.mjs";
import { ERC20Abi, lidontWeb3API } from "./lidontWeb3API.mjs";


// addresses
//
export const detailsByChainId = {
  1: {
      lidont: "",
      reth: "",
      steth: "",
      SCAN: 'https://etherscan.io/',
      NAME: "Ethereum Mainnet",
      ICON: "eth.png"
  },
  5: {
      lidont: "0xfaabbe302750635e3f918385a1aeb4a9eb45977a",
      reth: "0x178E141a0E3b34152f73Ff610437A7bf9B83267A",
      steth: "0x1643E812aE58766192Cf7D2Cf9567dF2C37e9B7F",
      SCAN: 'https://goerli.etherscan.io/',
      NAME: "Ethereum Goerli",
      ICON: "eth.png"
  },
  31337: {
      lidont: "",
      reth: "",
      steth: "",
      SCAN: '',
      RPC: '',
      NAME: "Testnet",
      ICON: "eth.png"
  },

}

const chainIdTestnet = 5
const chainIdMainnet = 1

console.log("!!!!! DEV ONLY - BETA TESTNET !!!!!")
const chainIdDefault = chainIdTestnet // import.meta.env.MODE === "production" ? chainIdMainnet : chainIdTestnet

function intToHex(number){
  return '0x'+number.toString(16)
}



// Store
//
export const store = createStore(
  log((setState, getState, api) => ({
    loading: false,
    address: null,
    balance: null,
    balanceFormatted: null,

    balances: {

    },
    balancesBySymbol: {

    },

    // forms 
    // for <input-connected> inputs are mapped to <input name=???> name components & forms
    inputs: {},

    stETHAllowance: undefined,
    rETHAllowance: undefined,
    rETHStakedDetails: {},

    provider: window.ethereum
      ? new ethers.BrowserProvider(window.ethereum)
      : new ethers.InfuraProvider("mainnet", "ID"),

    lidontWeb3API: new lidontWeb3API(detailsByChainId[chainIdDefault].lidont),
    pending: undefined,

    // compound actions
    async INIT(){
      const { lidontWeb3API, getStake, provider, addConnectNetwork, connectWallet, updateBalance, updateErc20Balance } = getState()
      await addConnectNetwork(chainIdDefault)
      await connectWallet()
      // web3 contract lidont
      lidontWeb3API.connectProvider(provider)
      //eth
      await updateBalance() 
      //erc20
      await updateErc20Balance(detailsByChainId[chainIdDefault].steth)
      await updateErc20Balance(detailsByChainId[chainIdDefault].reth)
      await updateErc20Balance(detailsByChainId[chainIdDefault].lidont)

      // get staked rETH
      await getStake()

      let prev = undefined
      store.subscribe( () => {
        if(prev === lidontWeb3API.pending) return
        prev = lidontWeb3API.pending
        setState({ pending: lidontWeb3API.pending })
      })

    },

    // actions
    async swap(){
      const { provider, inputs, lidontWeb3API } = getState();
      const signer = await provider.getSigner();
      const amount = ethers.parseUnits(inputs.stETHAmount, 18)
      const alsoStake = !!inputs.alsoStake

      // check stETH spending allowance
      const ownAddress = await signer.getAddress()
      const stETHAddress = detailsByChainId[chainIdDefault].steth
      const lidontAddress = detailsByChainId[chainIdDefault].lidont
      const stETH = new ethers.Contract(stETHAddress, ERC20Abi, signer);
      const allowance = await stETH.allowance(ownAddress, lidontAddress)
      setState({stETHAllowance: allowance})

      if(allowance < amount){
        RADIO.emit("msg", "stETH allowance: "+allowance+" approving "+amount)
        await stETH.approve(lidontAddress, amount)
      }

      RADIO.emit("msg", "swapping. "+allowance+" sufficient for: "+amount)
      await lidontWeb3API.swap(signer, amount, alsoStake)
    },

    async stake(){
      const { provider, inputs, lidontWeb3API } = getState();
      const signer = await provider.getSigner();
      const amount = ethers.parseUnits(inputs.rETHAmount, 18)

      // check stETH spending allowance
      const ownAddress = await signer.getAddress()
      const rETHAddress = detailsByChainId[chainIdDefault].reth
      const lidontAddress = detailsByChainId[chainIdDefault].lidont
      const rETH = new ethers.Contract(rETHAddress, ERC20Abi, signer);
      const allowance = await rETH.allowance(ownAddress, lidontAddress)
      setState({rETHAllowance: allowance})

      if(allowance < amount){
        RADIO.emit("msg", "rETH allowance: "+allowance+" approving "+amount)
        await rETH.approve(lidontAddress, amount)
      }

      RADIO.emit("msg", "rETH staking. "+allowance+" sufficient for: "+amount)
      await lidontWeb3API.stake(signer, amount)
    },

    async unstake(){
      const { provider, inputs, lidontWeb3API } = getState();
      const signer = await provider.getSigner();
      const amount = ethers.parseUnits(inputs.rETHAmount, 18)
      RADIO.emit("msg", "rETH unstaking: "+amount)
      await lidontWeb3API.unstake(signer, amount)
    },

    async getStake(){
      const { provider, lidontWeb3API } = getState();
      const signer = await provider.getSigner();
      const me = await signer.getAddress()
      const rETHStakedDetails = await lidontWeb3API.getStakedRETH(signer, me)
      const details = Object.assign({}, rETHStakedDetails)
      
      details.stake = rETHStakedDetails[0]
      details.stakeFormatted = ethers.formatUnits(rETHStakedDetails[0], 18)
      details.rewardDebt = rETHStakedDetails[1]
      details.rewardDebtFormatted = ethers.formatUnits(rETHStakedDetails[1], 18)
      details.lastClaimBlock = rETHStakedDetails[2]

      setState({ rETHStakedDetails: details  })
    },

    async claimEmission(){
      const { provider, inputs, lidontWeb3API } = getState();
      const signer = await provider.getSigner();
      RADIO.emit("msg", "claiming emission rewards")
      await lidontWeb3API.claimEmission(signer)
    },

    async claimMinipool(){
      const { provider, inputs, lidontWeb3API } = getState();
      const signer = await provider.getSigner();
      RADIO.emit("msg", "claiming minipool rewards")
      const nodeAddress = null
      const nodeIndex = null
      const index = null
      await lidontWeb3API.claimMinipool(signer, nodeAddress, nodeIndex, index)
    },

    async initiateWithdrawal(){
      const { provider, inputs, lidontWeb3API } = getState();
      const signer = await provider.getSigner();
      RADIO.emit("msg", "initiating withdrawal")
      await lidontWeb3API.initiateWithdrawal(signer, stETHAmount)
    },

    async finalizeWithdrawal(){
      const { provider, inputs, lidontWeb3API } = getState();
      const signer = await provider.getSigner();
      RADIO.emit("msg", "finalizing withdrawal")
      const requestids = null
      const hints = null
      await lidontWeb3API.finalizeWithdrawal(signer, requestIds, hints)
    },

    async mintRocketEther(){
      const { provider, inputs, lidontWeb3API } = getState();
      const signer = await provider.getSigner();
      RADIO.emit("msg", "minting RocketEther")
      await lidontWeb3API.mintRocketEther(signer, ethAmount)
    },

    async connectWallet() {
      const { address, loading } = getState();
      const { ethereum } = window;

      if (ethereum && !address && !loading) {
        try {
          await ethereum.request({ method: "eth_requestAccounts" });
        } catch (error) {
          return console.log(error);
        }

        const accounts = await ethereum.request({ method: "eth_accounts" });
        const provider = getState().provider;
        const signer = await provider.getSigner();
        const network = await signer.provider.getNetwork();
        const chainId = network.chainId;

        setState({ address: accounts[0] });
        setState({ chainId: chainId });

        ethereum.on("accountsChanged", (accounts) =>
          this.onAccountChange(accounts)
        );
        ethereum.on("chainChanged", (chainId) => this.onNetworkChange(chainId));

        await getState().updateBalance();
      }
    },

    // Network Events
    async addConnectNetwork(netId) {
      const networkId = netId || chainIdDefault;
      console.log("connecting to: " + networkId);
      // Check if MetaMask is installed
      // MetaMask injects the global API into window.ethereum
      if (window.ethereum) {
        try {
          console.log("check if the chain to connect to is installed");
          return await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: intToHex(networkId) }], // chainId must be in hexadecimal numbers
          });
        } catch (error) {
          // This error code indicates that the chain has not been added to MetaMask
          // if it is not, then install it into the user MetaMask
          if (error.code === 4902) {
            try {
              return await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: intToHex(networkId),
                    chainName: detailsByChainId[networkId].NAME,
                    rpcUrls: [detailsByChainId[networkId].RPC],
                    blockExplorerUrls: [detailsByChainId[networkId].SCAN],
                  },
                ],
              });
            } catch (addError) {
              console.error(addError);
            }
          }
          console.error(error);
        }
      } else {
        // if no window.ethereum then MetaMask is not installed
        //return alert('MetaMask is not installed. Please consider installing it: https://metamask.io/download.html');
      }
    },

    async onAccountChange(accounts) {
      console.log("Account Changed", accounts);
      /*
      this.address = accounts[0];
      this.balance = ethers.parseEther("0");
      this.balances = {};
      this.last_blockheight = 0;
      if (accounts.length == 0) {
        await this.connectWallet();
      }
      */
    },

    async onNetworkChange(chainId) {
      console.log("ChainChanged");
      //this.addresses = detailsByChainId[chainId];
      //this.unsupported_network = false;
      //if (this.addresses == undefined) this.unsupported_network = true;
    },

    async changeChains(chainIdString) {
      const chainId = ethers.hexValue(parseInt(chainIdString));
      const provider = getState().provider;
      const success = provider.send("wallet_switchEthereumChain", [
        { chainId },
      ]);
      return success == null ? true : false;
    },

    async signMessage(message) {
      const provider = getState().provider;
      const signer = provider.getSigner();
      return await signer.signMessage(message);
    },

    async updateBalance() {
      const { provider, address } = getState();
      const signer = await provider.getSigner();
      const balance = await provider.getBalance(address);
      setState({ balance });
      const balanceFormatted = ethers.formatEther(balance);
      setState({ balanceFormatted });

      return { balance, balanceFormatted };
    },

    async updateErc20Balance(address) {
      let signer;
      let signerAddr;

      try {
        signer = await getState().provider.getSigner();
        signerAddr = await signer.getAddress();
      } catch (e) {
        return console.log(e);
      }

      const details = await getState().getTokenDetails(address)

      const balancesNew = getState().balances
      balancesNew[address] = details
      setState({balances: balancesNew})

      const balancesBySymbolNew = getState().balancesBySymbol
      balancesBySymbolNew[details.symbol] = details
      setState({balancesBySymbol: balancesBySymbolNew})

      return details;
    },

    async getTokenDetails(tokenAddr) {
      const { provider } = getState()
      if(!ethers.isAddress(tokenAddr)) throw "Invalid tokenAddr";
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(tokenAddr, ERC20Abi, provider);
      const signerAddr = await signer.getAddress()
      const [symbol, name, decimals, balance] = [
          await contract.symbol(),
          await contract.name(),
          await contract.decimals(),
          await contract.balanceOf(signerAddr)
      ]
      const balanceFormatted = await ethers.formatUnits(balance, decimals);
      
      return {symbol, name, decimals, balance, balanceFormatted}
  }

  }))
);


window.STORE = store;