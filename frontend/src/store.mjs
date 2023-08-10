import * as ethers from './ethers.js';
import { createStore, RADIO, log, waitForSeconds} from "./util.mjs";
import { unstETHAbi, ERC20Abi, lidontWeb3API } from "./lidontWeb3API.mjs";


const chainIdTestnet = 5
const chainIdMainnet = 1

const isProduction = false
const chainIdDefault = isProduction ? chainIdMainnet : chainIdTestnet



// addresses
//
export const detailsByChainId = {
  1: {
      lidont: "",
      reth: "",
      rocketStorage: "0x1d8f8f00cfa6758d7bE78336684788Fb0ee0Fa46",
      steth: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
      unsteth: "0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1",
      SCAN: 'https://etherscan.io/',
      NAME: "Ethereum Mainnet",
      ICON: "eth.png"
  },
  5: {
      lidont: "0x308AF4D8158FCbFc7818dF33dac826E5CADa8740",
      reth: "0x178E141a0E3b34152f73Ff610437A7bf9B83267A",
      rocketStorage: "0xd8Cd47263414aFEca62d6e2a3917d6600abDceB3",
      steth: "0x1643E812aE58766192Cf7D2Cf9567dF2C37e9B7F",
      unsteth: "0xCF117961421cA9e546cD7f50bC73abCdB3039533",
      SCAN: 'https://goerli.etherscan.io/',
      NAME: "Ethereum Goerli",
      ICON: "eth.png"
  }
}


function intToHex(number){
  return '0x'+number.toString(16)
}

let intervalIdEmissions = null


// dev: quick get-state log with excludes
window.gs = () => {
  const state = Object.assign({}, store.getState())
  delete state.provider
  delete state.lidontWeb3API
  for(const key in state){   // deleta all functions too
    if(typeof state[key] === "function") delete state[key]
  }
  console.table(state)
  return state
}


// Store
//
export const store = createStore(
  log((setState, getState, api) => ({
    loading: false,
    address: null,

    balance: null,
    balanceFormatted: null,

    balances: {},
    balancesBySymbol: {},

    // forms 
    // for <input-connected> inputs are mapped to <input name=???> name components & forms
    inputs: {},

    pendingRequests: [],

    balanceOfLidontSTETH: undefined,
    balanceOfLidontETH: undefined,

    stETHAllowance: undefined,

    provider: window.ethereum
      ? new ethers.BrowserProvider(window.ethereum)
      : new ethers.InfuraProvider("mainnet", "ID"),

    lidontWeb3API: new lidontWeb3API(detailsByChainId[chainIdDefault].lidont),
    pending: undefined,

    // compound actions
    async INIT(){
      const { RELOAD, lidontWeb3API, provider, addConnectNetwork, connectWallet } = getState()
      await addConnectNetwork(chainIdDefault)
      await connectWallet()
      // web3 contract lidont
      lidontWeb3API.connectProvider(provider)

      let prev = undefined
      store.subscribe( () => {
        if(prev === lidontWeb3API.pending) return
        prev = lidontWeb3API.pending
        setState({ pending: lidontWeb3API.pending })
      })

      window.RADIO.emit("msg", "fetching data...")
      await RELOAD()
    },

    async RELOAD(){
      const { getStake, fetchEvents, updateBalance, updateErc20Balance, getAllowanceSTETH } = getState()
      // eth
      if(intervalIdEmissions) clearInterval(intervalIdEmissions)
      await updateBalance() 
      // erc20
      await updateErc20Balance(detailsByChainId[chainIdDefault].steth)
      await updateErc20Balance(detailsByChainId[chainIdDefault].lidont)
      // allowances
      await getAllowanceSTETH()
      // emission auto-loading
      setInterval( () => {
        getState().claimStatic()
      },30000) // check every 30s
    },

    async openMenu(){
      RADIO.emit("ADMIN")
      await getState().fetchAdminData()
    },

    async fetchAdminData(){
      await getState().getLidontSTETHBalance()
      await getState().getWithdrawalRequests()
    },

    async getLidontSTETHBalance(){
      const { lidontWeb3API } = getState()
      const { provider } = getState();
      const signer = await provider.getSigner();
      const ownAddress = await signer.getAddress()
      const stETHAddress = detailsByChainId[chainIdDefault].steth
      const lidontAddress = detailsByChainId[chainIdDefault].lidont
      const stETH = new ethers.Contract(stETHAddress, ERC20Abi, signer);
      const balanceOfLidontSTETH = await stETH.balanceOf(lidontAddress)
      setState({ balanceOfLidontSTETH })
    },

    // SWAP
    async getAllowanceSTETH(){
      const { provider } = getState();
      const signer = await provider.getSigner();
      const ownAddress = await signer.getAddress()
      const stETHAddress = detailsByChainId[chainIdDefault].steth
      const lidontAddress = detailsByChainId[chainIdDefault].lidont
      const stETH = new ethers.Contract(stETHAddress, ERC20Abi, signer);
      const allowance = await stETH.allowance(ownAddress, lidontAddress)
      setState({stETHAllowance: allowance})
      return allowance
    },

    async deposit(){
      const { provider, inputs, lidontWeb3API, RELOAD, getAllowanceSTETH } = getState();
      const signer = await provider.getSigner();
      const amount = ethers.parseUnits(inputs.stETHAmount, 18)
      const ownAddress = await signer.getAddress()
      const stETHAddress = detailsByChainId[chainIdDefault].steth
      const lidontAddress = detailsByChainId[chainIdDefault].lidont
      const stETH = new ethers.Contract(stETHAddress, ERC20Abi, signer);
      const allowance = await getAllowanceSTETH()

      if(allowance < amount){
        RADIO.emit("spinner", "stETH allowance: "+allowance+" approving "+amount)
        const tx = await stETH.getFunction("approve").call(ownAddress, lidontAddress, amount)
        await lidontWeb3API.addTx(tx)
        await lidontWeb3API.waitUntilTxConfirmed(tx)
        await RELOAD()
        await waitForSeconds(0.5)
      }

      RADIO.emit("spinner", "swapping. "+allowance+" sufficient for: "+amount)
      const tx = await lidontWeb3API.deposit(signer, amount)
      await lidontWeb3API.waitUntilTxConfirmed(tx)
      await RELOAD()
    },

    // EMISSION
    async claim(){
      const { provider, lidontWeb3API } = getState();
      const signer = await provider.getSigner();
      RADIO.emit("spinner", "claiming emission rewards")
      const tx = await lidontWeb3API.claim(signer)
      await lidontWeb3API.waitUntilTxConfirmed(tx)
      await RELOAD()
    },

    async claimStatic(){
      const { provider, lidontWeb3API, rETHStakedDetails } = getState();
      const signer = await provider.getSigner();
      const amount = await lidontWeb3API.claimStatic(signer)
      const newState = Object.assign({} , rETHStakedDetails)
      newState.rewardDebt = amount
      newState.rewardDebtFormatted = ethers.formatEther(amount)
      setState({rETHStakedDetails: newState})
    },

    // WITHDRAW
    //
    async getWithdrawalRequests(){
      const { provider, lidontWeb3API } = getState();
      const signer = await provider.getSigner();
      const me = await signer.getAddress()
      const unstETHAddress = detailsByChainId[chainIdDefault].unsteth
      const lidontAddress = detailsByChainId[chainIdDefault].lidont
      const unstETH = new ethers.Contract(unstETHAddress, unstETHAbi, signer);
      const withdrawalRequestEvents = await lidontWeb3API.getEventsWITHDRAWALREQUEST()

      const pendingRequests = []

      for(const value of withdrawalRequestEvents){
        const requestIds = value.args[0].toArray()
        const requestStatus = await unstETH.getWithdrawalStatus(requestIds)

        const details = {}

        requestIds.forEach( (value, index) =>  {
          const uniqueId = requestIds[index]+'of'+requestIds.join() // requestStatus[index][3] timestamp for uniqueness?
          details[uniqueId] = {
            amountOfStETH: requestStatus[index][0],
            amountOfShares: requestStatus[index][1],
            owner: requestStatus[index][2],
            timestamp: requestStatus[index][3],
            isFinalized: requestStatus[index][4],
            isClaimed: requestStatus[index][5],
            requestIds,
          }
        })

        pendingRequests.push(details)
        // todo filter claimed & finalized withdrawals
      }

      setState({ pendingRequests })
    },

    async getCheckpointHints(withdrawalRequestIds){
      const { provider } = getState();
      const unstETHAddress = detailsByChainId[chainIdDefault].unsteth
      const signer = await provider.getSigner();
      const unstETH = new ethers.Contract(unstETHAddress, unstETHAbi, signer);
      const firstIndex = 1n // starts at 1 apparently: https://goerli.etherscan.io/address/0x077B60752864B3e5291863cf8890603f9ab335d3#code#F22#L289
      const lastIndex = await unstETH.getLastCheckpointIndex()
      const checkpointHints = await unstETH.findCheckpointHints(withdrawalRequestIds, firstIndex, lastIndex)
      return checkpointHints
    },

    async initiateWithdrawal(){
      const { provider, inputs, lidontWeb3API, balanceOfLidontSTETH } = getState();
      const signer = await provider.getSigner();
      RADIO.emit("msg", "initiating withdrawal")
      const amount = ethers.parseUnits(getState().inputs.stETHWithdrawAmount, 18)
      const tx = await lidontWeb3API.initiateWithdrawal(signer, amount)
      await provider.waitForTransaction(tx.hash)
      await waitForSeconds(0.3)
      await getState().getLidontSTETHBalance()
      await getState().getWithdrawalRequests()
    },

    async finalizeWithdrawal(requestsDetails){
      const { provider, inputs, lidontWeb3API, getCheckpointHints } = getState();
      const signer = await provider.getSigner();
      let requestIds = []
      // handling if we get multiple requestIds in one go
      Object.keys(requestsDetails).forEach( key => {
        const obj = requestsDetails[key]
        requestIds = requestIds.concat(obj.requestIds)
      })
      RADIO.emit("msg", "getting hints...")
      const hints = await getCheckpointHints(requestIds)
      RADIO.emit("msg", "finalizing withdrawal")
      await lidontWeb3API.finaliseWithdrawal(signer, requestIds, hints.toArray())
    },

    //MINT
    async mintRocketEther(){
      const { provider, inputs, lidontWeb3API } = getState();
      const signer = await provider.getSigner();
      RADIO.emit("msg", "minting RocketEther")
      await lidontWeb3API.mintRocketEther(signer, ethAmount)
    },


    // wallet
    //
    async connectWallet() {
      const { address, loading, onAccountChange, onNetworkChange } = getState();
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

        ethereum.on("accountsChanged", onAccountChange );
        ethereum.on("chainChanged", onNetworkChange );

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