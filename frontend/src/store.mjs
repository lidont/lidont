import * as ethers from './ethers.js';
import { createStore, RADIO, log, waitForSeconds, isObjectEmpty} from "./util.mjs";
import { outputPipesAbi, unstETHAbi, ERC20Abi, lidontWeb3API } from "./lidontWeb3API.mjs";


const chainIdTestnet = 5
const chainIdMainnet = 1

const isProduction = true // false
const chainIdDefault = isProduction ? chainIdMainnet : chainIdTestnet

console.log("chain id is: "+chainIdDefault)

// output pipes by id, starts at 1
//
const mapAddrToProtocol = new Map()
mapAddrToProtocol.set("0x0", "ETH")
mapAddrToProtocol.set("0x1", "rETH")



// addresses
//
export const detailsByChainId = {
  1: {
      withdrawler: "0x274b028b03A250cA03644E6c578D81f019eE1323",
      lidont: "0xBcF7FFFD8B256Ec51a36782a52D0c34f6474D951",
      reth: "",
      rocketStorage: "0x1d8f8f00cfa6758d7bE78336684788Fb0ee0Fa46",
      steth: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
      unsteth: "0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1",
      SCAN: 'https://etherscan.io/',
      NAME: "Ethereum Mainnet",
      ICON: "eth.png"
  },
  5: {
      withdrawler: "0x3fAA7e474B810c2Bf9590D69368E0ba7D7AD1146",
      lidont: "0x055EC52e9fC20Acf31495d4dC57a47a372faDe04",
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

    outputPipes: {
      // 1: {i: 0, addr: "0x0"}
    },

    addrToOutputPipes: {
      // [0x0]: {i: 0, addr: "0x0"}
    },

    queue: {
      // size, back, front, map
    },

    // raw events
    depositEvents: [],
    withdrawEvents: [],

     // derived from deposit events
    addrToDeposits: {},     // depositorsAddr -> deposit

    // derived from withdraw events
    addrToRequestIds: {},   // depositorsAddr -> requestIds

    balanceOfLidontSTETH: undefined,
    balanceOfLidontETH: undefined,

    stETHAllowance: undefined,

    provider: window.ethereum
      ? new ethers.BrowserProvider(window.ethereum)
      : new ethers.InfuraProvider("mainnet", "ID"),

    lidontWeb3API: new lidontWeb3API(detailsByChainId[chainIdDefault].withdrawler),

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

      RADIO.emit("msg", "fetching data...")
      await RELOAD()

      /*
      setInterval( async () => {
        await getState().RELOAD()
      },10000) // check every 10s
      */

    },

    async RELOAD(){
      const { getQueue, getAllOutputPipes, getDepositEvents, getWithdrawEvents, getOutputPipesManual, updateBalance, updateErc20Balance, getAllowanceSTETH } = getState()
      // eth
      if(intervalIdEmissions) clearInterval(intervalIdEmissions)
      await updateBalance() 
      // erc20
      await updateErc20Balance(detailsByChainId[chainIdDefault].steth)
      await updateErc20Balance(detailsByChainId[chainIdDefault].lidont)
      // allowances
      await getAllowanceSTETH()
      // pipes
      // await getAllOutputPipes()
      // await getOutputPipesManual()
      // queue
      await getQueue()
      // emission auto-loading:
      
      // withdrawals
      await getDepositEvents()
      await getWithdrawEvents()
      // 

      RADIO.emit("msg", "<3")
      return
    },

    async openMenu(){
      RADIO.emit("ADMIN")
      await getState().getDepositEvents()
      await getState().getWithdrawEvents()
    },

    async fetchWithdrawals(){
      await getState().getLidontSTETHBalance()
      await getState().getDepositEvents()
      await getState().getWithdrawRequests()
    },

    async getQueue(){
      const { lidontWeb3API } = getState()
      const { provider } = getState();
      const signer = await provider.getSigner();
      const front = await lidontWeb3API.getQueueFront(signer)
      const back = await lidontWeb3API.getQueueBack(signer)
      const size = await lidontWeb3API.getQueueSize(signer)
      const list = {}
      for(let i = 0; i < Number(size); i++){ 
        const depositorAddr = await lidontWeb3API.getQueue(signer, i)
        list[depositorAddr] = undefined
      }
      const queue = {front, back, size, list}
      setState({queue})
    },

    async getAllOutputPipes(){
      const { lidontWeb3API , getStakesForPipe, staticUnstakeForPipe } = getState()
      const { provider } = getState();
      const signer = await provider.getSigner();

      const outputPipes = {}
      const addrToOutputPipes = {}

      for(let i = 0; i <64; i++){ 
        try{
          const addr = await lidontWeb3API.getOutputPipes(signer, i)
          const stakes = await getStakesForPipe(addr)
          const claimableLidont = await staticUnstakeForPipe(addr)
          console.log(claimableLidont)
          console.log("got pipe "+i, addr)
          outputPipes[i] = {i, addr, stakes, claimableLidont}
          addrToOutputPipes[addr] = {i, addr, stakes}
        } catch(e){
          console.log(e)
          console.log("pipes total: "+(i))
          break
        }
      }

      setState({outputPipes, addrToOutputPipes})
    },
    /*
        async getOutputPipesManual(){
          const { lidontWeb3API } = getState()
          const { provider } = getState();
          const signer = await provider.getSigner();

          for(let [key, value] of pipes){ 
            const id = key
            console.log("getting pipe "+id, value)
            try{
              const addr = await lidontWeb3API.getOutputPipes(signer, id)
              const newState = Object.assign({}, getState().outputPipes)
              newState[id] = {value, id, addr}

              const byAddress = Object.assign({},getState().addrToOutputPipes)
              byAddress[addr] = byAddress[addr] || {}
              byAddress[addr].id = id
              byAddress[addr].value = value
              byAddress[addr].addr = addr

              setState({outputPipes: newState, addrToOutputPipes: byAddress})
            } catch(e){
              console.log(e)
              break
            }
          }
        },
    */
    async getDeposits(){
      const { lidontWeb3API } = getState()
      const { provider } = getState();
      const signer = await provider.getSigner();
      const me = await signer.getAddress()
      const myDeposits = await lidontWeb3API.getDeposits(signer, me)
      setState({deposits: myDeposits})
    },

    async getQueue(){
      const { lidontWeb3API } = getState()
      const { provider } = getState();
      const signer = await provider.getSigner();
      const size = await lidontWeb3API.getQueueSize(signer)
      const front = await lidontWeb3API.getQueueFront(signer)
      const back = await lidontWeb3API.getQueueBack(signer)
      const queue = []
      for(let index = 0; index < size; index++){
        const entry = await lidontWeb3API.getQueue(signer, index)
        queue.push(entry)
      }
      setState({queue})
      setState({queueDetails: {size, front, back}})
    },

    async getLidontSTETHBalance(){
      const { lidontWeb3API } = getState()
      const { provider } = getState();
      const signer = await provider.getSigner();
      const ownAddress = await signer.getAddress()
      const stETHAddress = detailsByChainId[chainIdDefault].steth
      const withdrawlerAddress = detailsByChainId[chainIdDefault].withdrawler
      const stETH = new ethers.Contract(stETHAddress, ERC20Abi, signer);
      const balanceOfLidontSTETH = await stETH.balanceOf(withdrawlerAddress)
      setState({ balanceOfLidontSTETH })
    },

    // SWAP
    async getAllowanceSTETH(){
      const { provider } = getState();
      const signer = await provider.getSigner();
      const ownAddress = await signer.getAddress()
      const stETHAddress = detailsByChainId[chainIdDefault].steth
      const withdrawlerAddress = detailsByChainId[chainIdDefault].withdrawler
      const stETH = new ethers.Contract(stETHAddress, ERC20Abi, signer);
      const allowance = await stETH.allowance(ownAddress, withdrawlerAddress)
      setState({stETHAllowance: allowance})
      return allowance
    },

    async deposit(){
      const { provider, inputs, lidontWeb3API, RELOAD, getAllowanceSTETH, outputPipes } = getState();
      const signer = await provider.getSigner();
      const amount = ethers.parseUnits(inputs.stETHAmount, 18)
      const ownAddress = await signer.getAddress()
      const stETHAddress = detailsByChainId[chainIdDefault].steth
      const withdrawlerAddress = detailsByChainId[chainIdDefault].withdrawler
      const stETH = new ethers.Contract(stETHAddress, ERC20Abi, signer);

      const outputPipeKey = inputs.selectedOutputPipe

      const outputPipeIndex = Object.keys(outputPipes).find( key => {
        const entry = outputPipes[key]
        return entry.i === parseInt(outputPipeKey)
      })

      const outputPipe = outputPipes[outputPipeIndex]
      const allowance = await getAllowanceSTETH()

      if(allowance < amount){
        RADIO.emit("spinner", "stETH allowance: "+allowance+" approving "+amount)
        const bufferedAmount = parseInt(amount)
        const finalAmount = bufferedAmount + (bufferedAmount*0.0001)
        const tx = await stETH.getFunction("approve").call(ownAddress, withdrawlerAddress, finalAmount.toString())
        await tx.wait()
        await RELOAD()
        await waitForSeconds(0.5)
      }

      if(allowance < amount){
        await waitForSeconds(3)
        await RELOAD()
        await waitForSeconds(2)
      }

      RADIO.emit("spinner", "swapping. "+allowance+" sufficient for: "+amount)
      const tx = await lidontWeb3API.deposit(signer, amount, outputPipe.addr)
      await tx.wait()
      await RELOAD()
    },

    // EMISSION / OUTPUT PIPES
    //

    // pipes reads
    async getDataForPipe(pipeAddress){
      const { provider } = getState();
      const signer = await provider.getSigner();
      const pipe = new ethers.Contract(pipeAddress, outputPipesAbi, signer);
      const bondValue = await pipe.bondValue()
      const totalStake = await pipe.totalStake()
      const temp = await pipe.temp()
      const dust = await pipe.dust()
      return {
        bondValue, totalStake, temp, dust
      }
    },

    async getStakesForPipe(pipeAddress){
      const { provider } = getState();
      const signer = await provider.getSigner();
      const who = await signer.getAddress()
      const pipe = new ethers.Contract(pipeAddress, outputPipesAbi, signer);
      const stakes = await pipe.getFunction("stakes").call(who, signer)
      const out = {
        stakesRaw: stakes,
        amount: stakes[0],
        bondValue: stakes[1]
      }
      return out
    },

    // pipes writes
    //

    async unstakeForPipe(pipeAddress, amount = 1){
      const { provider, lidontWeb3API, RELOAD } = getState();
      const signer = await provider.getSigner();
      const me = await signer.getAddress()
      const pipe = new ethers.Contract(pipeAddress, outputPipesAbi, signer);
      RADIO.emit("spinner", "claiming emission rewards")
      const tx = await pipe.getFunction("unstake").call(me, amount)
      await tx.wait()
      await RELOAD()
    },

    async staticUnstakeForPipe(pipeAddress, amount = 1000000000){
      const { provider, lidontWeb3API } = getState();
      const signer = await provider.getSigner();
      const me = await signer.getAddress()
      const pipe = new ethers.Contract(pipeAddress, outputPipesAbi, signer);
      RADIO.emit("spinner", "...getting emissions")
      try {
        const res = await pipe.unstake.staticCall(amount, {from: await signer.getAddress()})
        console.log(res)
        return res
      } catch (e) {
        console.log(e)
        return null
      }
    },

    // DEPOSIT EVENTS
    //
    async getDepositEvents(){
      const { provider, lidontWeb3API } = getState();
      const signer = await provider.getSigner();
      const me = await signer.getAddress()
      const withdrawalerAddress = detailsByChainId[chainIdDefault].withdrawler
      const depositEvents = await lidontWeb3API.getEventsDEPOSIT()

      console.log(depositEvents)

      const addrToDeposits = Object.assign({})

      for(const value of depositEvents){
        const addr = value.args[0]
        const amount = value.args[1]
        addrToDeposits[addr] = addrToDeposits[addr] || {}

        addrToDeposits[addr].deposits = addrToDeposits[addr].deposits || []
        addrToDeposits[addr].depositTotalAmount = addrToDeposits[addr].depositTotalAmount || 0n

        addrToDeposits[addr].deposits.push({block: value.blockNumber, txhash: value.transactionHash, address: addr, amount})
        addrToDeposits[addr].depositTotalAmount = addrToDeposits[addr].depositTotalAmount + amount
      }

      setState({addrToDeposits})

      return depositEvents
    },

    // WITHDRAW EVENTS
    //
    async getWithdrawEvents(){
      const { provider, lidontWeb3API, depositEvents } = getState();
      const signer = await provider.getSigner();
      const me = await signer.getAddress()
      const unstETHAddress = detailsByChainId[chainIdDefault].unsteth
      const withdrawalerAddress = detailsByChainId[chainIdDefault].withdrawler
      const unstETH = new ethers.Contract(unstETHAddress, unstETHAbi, signer);
      const withdrawEvents = await lidontWeb3API.getEventsWITHDRAWALREQUEST()
      
      setState({withdrawEvents})

      // filter request ids
      const addrToRequestIds = Object.assign({})

      for(const value of withdrawEvents){
        const requestIds = value.args[0].toArray()
        const depositors = value.args[1].toArray()
        const requestAmounts = value.args[2].toArray()
        const requestsStatus = await unstETH.getWithdrawalStatus(requestIds)

        // map all request Ids an address has
        requestIds.forEach( (requestId, index) => {
          const depositor = depositors[index]
          const status = requestsStatus[index]
          
          addrToRequestIds[depositor]           = addrToRequestIds[depositor] || {}
          addrToRequestIds[depositor].amounts   = addrToRequestIds[depositor].amounts || {
            total: 0n,
            unfinalized: 0n,
            finalized: 0n,
            claimed: 0n
          }

          const out = {
            requestId: requestId,
            amount: requestAmounts[index],
            amountOfStETH  :requestsStatus[index][0],
            amountOfShares :requestsStatus[index][1],
            owner          :requestsStatus[index][2],
            timestamp      :requestsStatus[index][3],
            isFinalized    :requestsStatus[index][4],
            isClaimed      :requestsStatus[index][5],
            statusRaw: status,
          }

          // all
          addrToRequestIds[depositor].allRequestIds = addrToRequestIds[depositor].allRequestIds || {}
          addrToRequestIds[depositor].allRequestIds[requestId] = out
          addrToRequestIds[depositor].amounts.total = addrToRequestIds[depositor].amounts.total + out.amount

          if(!out.isFinalized){
            addrToRequestIds[depositor].unfinalized = addrToRequestIds[depositor].unfinalized || {}
            addrToRequestIds[depositor].unfinalized[requestId] = out
            addrToRequestIds[depositor].amounts.unfinalized = addrToRequestIds[depositor].amounts.unfinalized + out.amount
          }

          if(out.isFinalized && !out.isClaimed){
            addrToRequestIds[depositor].finalized = addrToRequestIds[depositor].finalized || {}
            addrToRequestIds[depositor].finalized[requestId] = out
            addrToRequestIds[depositor].amounts.finalized = addrToRequestIds[depositor].amounts.finalized + out.amount
          }

          if(out.isFinalized && out.isClaimed){
            addrToRequestIds[depositor].claimed = addrToRequestIds[depositor].claimed || {}
            addrToRequestIds[depositor].claimed[requestId] = out
            addrToRequestIds[depositor].amounts.claimed = addrToRequestIds[depositor].amounts.claimed + out.amount
          }

        })

      }

      setState({addrToRequestIds})

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
      const { provider, addrToDeposits, addrToRequestIds, lidontWeb3API } = getState();
      const signer = await provider.getSigner();
      RADIO.emit("msg", "initiating withdrawal")

      const depositorAddrArray = []

      Object.keys(addrToDeposits).forEach( addr => {
        // check map addr -> deposit amount
        const addrWithdrawRequests = addrToRequestIds[addr]

        if(!addrWithdrawRequests){
          // never withdrawn, doesnt have requestId listed
          depositorAddrArray.push(addr)
          return
        }
        if(addrWithdrawRequests){
          // has withdrawn in the past - check amounts
          const depositAmount = addrToDeposits[addr].depositTotalAmount
          const user = addrToRequestIds[addr]
          if(depositAmount > user.amounts.total){
            // if has more deposited than we record total requestIds
              depositorAddrArray.push(addr)
              return
          }
        }
      })

      console.log(depositorAddrArray)
      
      const tx = await lidontWeb3API.initiateWithdrawal(signer, depositorAddrArray)
      await tx.wait()
      await waitForSeconds(0.3)

    },

    async assembleFinalizationBatch(){

      const { addrToRequestIds } = getState();
      RADIO.emit("msg", "assemble next batch for withdrawal")

      const depositors = []
      const requestIds = []

      Object.keys(addrToRequestIds).forEach( addr => {
        const depositor = addrToRequestIds[addr]

        if(depositor.finalized){
          // get all lido finalized batches to ... lidont finalize
          Object.keys(depositor.finalized).forEach( requestIdsString => {
            const item = depositor.finalized[requestIdsString]
            if(item.isFinalized){
              depositors.push(addr)
              requestIds.push(item.requestId)
            }
          })
        }
      })

      console.log(depositors, requestIds)
      
      // max size 32
      if(depositors.length > 32){
        depositors.length = 32
        requestIds.length = 32
      }

      return {depositors, requestIds}
    },

    async finalizeWithdrawal(){
      const { provider, inputs, lidontWeb3API, getCheckpointHints, assembleFinalizationBatch } = getState();
      const signer = await provider.getSigner();

      const batch = await assembleFinalizationBatch()

      RADIO.emit("msg", "getting hints...")
      const hints = await getCheckpointHints(batch.requestIds)
      RADIO.emit("msg", "finalizing withdrawal")
      // const test = [detailsByChainId[chainIdDefault].withdrawler]
      await lidontWeb3API.finaliseWithdrawal(signer, batch.depositors, hints.toArray())
    },

    async claimWithdrawal(){
      const { provider, inputs, lidontWeb3API, getCheckpointHints, assembleFinalizationBatch } = getState();
      const signer = await provider.getSigner();
      RADIO.emit("msg", "claiming")
      await lidontWeb3API.claim(signer)
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


// DEV ONLY: quick get-state log with excludes
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

window.store = store;
