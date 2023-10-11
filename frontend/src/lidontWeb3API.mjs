import * as ethers from './ethers.js';


export class lidontWeb3API {
  constructor(contractAddr) {
    if (!contractAddr) {
      throw new Error("param is missing from constructor");
    }
    this.contractAddr = contractAddr
    this.contract = new ethers.Contract(contractAddr, withdrawalerAbi);
    this.pending = []
  }

  connectProvider(provider) {
    this.provider = provider;
    this.contract = this.contract.connect(this.provider);
  }

  connectURL(url) {
    this.provider = new ethers.JsonRpcProvider(url);
    this.contract = this.contract.connect(this.provider);
  }

  disconnect() {
    this.provider.removeAllListeners();
  }


  // Writes
  //

  async deposit(signer, stETHAmount, outputPipeAddr) {
    const who = await signer.getAddress()
    const contract = this.contract.connect(signer)
    const tx = await contract.getFunction("deposit").call(who, stETHAmount, outputPipeAddr);
    this.addTx(tx)
    return tx
  }

  async claim(signer) {
    const who = await signer.getAddress()
    const contract = this.contract.connect(signer)
    const tx = await contract.getFunction("claim").call(who);
    this.addTx(tx)
    return tx
  }

  // Manage Lido Withdrawals
  //

  async initiateWithdrawal(signer, depositorsAddressArray) {
    const who = await signer.getAddress()
    const contract = this.contract.connect(signer)
    if(depositorsAddressArray.length === 0){
      throw new Error("nothing to initiate")
    }
    const tx = await contract.getFunction("initiateWithdrawal").call(who, depositorsAddressArray);
    await this.addTx(tx)
    return tx
  }

  async finaliseWithdrawal(signer, depositorsAddressArray, hints) {
    const who = await signer.getAddress()
    const contract = this.contract.connect(signer)
    console.log("depositorsAddresses: ", depositorsAddressArray)
    console.log("hints: ", hints)
    if(hints.length === 0 || depositorsAddressArray.length === 0){
      throw new Error("nothing to finalize")
    }
    const tx = await contract.getFunction("finaliseWithdrawal").call(who, depositorsAddressArray, hints);
    await this.addTx(tx)
    return tx
  }


  // Output Pipes / Admin
  //

  async triggerEmission(signer, outputAddress){
    const who = await signer.getAddress()
    const contract = this.contract.connect(signer)
    const tx = await contract.getFunction("triggerEmission").call(who, outputAddress);
    await this.addTx(tx)
    return tx
  }


  // Reads
  //

  async getDeposits(signer, who){ 
    return await this.contract.connect(signer).deposits(who);
  }

  async getQueue(signer, index){ 
    return await this.contract.connect(signer).queue(index);
  }

  async getQueueSize(signer){ 
    return await this.contract.connect(signer).queueSize();
  }

  async getQueueFront(signer){ 
    return await this.contract.connect(signer).queueFront();
  }

  async getQueueBack(signer){ 
    return await this.contract.connect(signer).queueBack();
  }

  async getOutputIndex(signer, address){ 
    return await this.contract.connect(signer).outputIndex(address);
  }

  async getOutputPipes(signer, index){ // 0-64 output pipes max
    return await this.contract.connect(signer).outputPipes(index);
  }

  async getEmissionPerBlock(signer){
    return await this.contract.connect(signer).emissionPerBlock();
  }

  async getLastRewardBlock(signer, address){ 
    return await this.contract.connect(signer).lastRewardBlock(address);
  }



  // Events

  async getEventsDEPOSIT(blockRange){
    const filter = this.contract.filters.Deposit
    const events = await this.contract.queryFilter(filter) // (filter, -100) for last 100 blocks range
    return events
  }

  async getEventsWITHDRAWALREQUEST(blockRange){
    const filter = this.contract.filters.WithdrawalRequest
    const events = await this.contract.queryFilter(filter) // (filter, -100) for last 100 blocks range
    return events
  }


  // Transaction Queue
  //
  async updatePendingTransactions() {
    this.pending = await Promise.all(
      this.pending.map(async (tx) => {
        return tx.confirmations == 0
          ? await this.provider.getTransaction(tx.hash)
          : tx;
      })
    );
  }

  async getTx(tx){
    return await this.provider.getTransaction(tx.hash)
  }

  async addTx(tx) {
    const txData = await this.provider.getTransaction(tx.hash)
    const newState = [].concat(this.pending)
    newState.push(txData);
    this.pending = newState
    return newState
  }

  purgeMinedTransactions() {
    this.pending = this.pending.filter((tx) => tx.confirmations == 0);
  }

  /*async waitUntilTxConfirmed(tx){
    const confirm = await waitForCallback( async () => {
      const data = await this.getTx(tx)
      if(data.blockNumber) {
        console.log(data)
        return true
      }
      return false
    })
    return confirm
  }*/
  
}


/* format abis with ethers 
*/
export function toHumanReadableAbi(abi){
  const out = []
  const iface = new ethers.Interface(abi);
  iface.format("full");
  iface.fragments.forEach(fragment => {
      out.push(fragment.format('full'))
  });
  console.log(out)
  return out
}


export const ERC20Abi = [
  'function transfer(address _to, uint256 _value) returns (bool)',
  'function approve(address _spender, uint256 _value) returns (bool)',
  'function transferFrom(address _from, address _to, uint256 _value) returns (bool)',
  'function mint(uint256 amount, address recipient)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address arg0) view returns (uint256)',
  'function allowance(address arg0, address arg1) view returns (uint256)'
];


export const unstETHAbi = [
  "function findCheckpointHints(uint256[],uint256,uint256) view returns (uint256[])",
  "function getWithdrawalRequests(address) view returns (uint256[])",
  "function getWithdrawalStatus(uint256[]) view returns (tuple(uint256,uint256,address,uint256,bool,bool)[])",
  "function getLastCheckpointIndex() view returns (uint256)",
  "function getLastFinalizedRequestId() view returns (uint256)",
  "function getLastRequestId() view returns (uint256)",
  "function unfinalizedRequestNumber() view returns (uint256)",
  "function unfinalizedStETH() view returns (uint256)"
];


export const outputPipesAbi = [
  'function unstake(uint256 amount)',
  'function bondValue() view returns (uint256)',
  'function temp() view returns (uint256)',
  'function dust() view returns (uint256)',
  'function stakes(address arg0) view returns (tuple(uint256 amount, uint256 bondValue))',
  'function totalStake() view returns (uint256)'
]

export const withdrawalerAbi = [
  'event ChangeAdmin(address indexed oldAdmin, address indexed newAdmin)',
  'event SetOutputValidity(address indexed output, bool indexed valid)',
  'event ChangeEmission(uint256 indexed oldEmissionPerBlock, uint256 indexed newEmissionPerBlock)',
  'event SetLastRewardBlock(address indexed pipe, uint256 indexed bnum)',
  'event Deposit(address indexed who, uint256 indexed amount)',
  'event WithdrawalRequest(uint256[] requestIds, address[] depositors, uint256[] amounts)',
  'event Claim(address indexed who, address indexed output, uint256 indexed amount)',
  'function changeAdmin(address newAdmin)',
  'function setLidont(address lidontAddress)',
  'function triggerEmission(address output)',
  'function toggleValidOutput(address output)',
  'function changeEmissionRate(uint256 newEmissionPerBlock)',
  'function deposit(uint256 stETHAmount, address outputPipe)',
  'function initiateWithdrawal(address[] depositors) returns (uint256[])',
  'function finaliseWithdrawal(address[] depositors, uint256[] _hints) returns (uint256[])',
  'function claim() returns (uint256)',
  'function lidont() view returns (address)',
  'function deposits(address arg0) view returns (tuple(uint256 stETH, uint256 requestId, uint256 ETH, address outputPipe))',
  'function queue(uint256 arg0) view returns (address)',
  'function queueSize() view returns (uint256)',
  'function queueFront() view returns (uint256)',
  'function queueBack() view returns (uint256)',
  'function admin() view returns (address)',
  'function outputIndex(address arg0) view returns (uint256)',
  'function outputPipes(uint256 arg0) view returns (address)',
  'function emissionPerBlock() view returns (uint256)',
  'function lastRewardBlock(address arg0) view returns (uint256)'
]