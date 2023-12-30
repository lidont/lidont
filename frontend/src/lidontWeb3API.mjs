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

  async claim(signer, bytesData) {
    const who = await signer.getAddress()
    const contract = this.contract.connect(signer)
    console.log(bytesData)
    console.log(typeof bytesData)
    const tx = await contract.getFunction("claim").call(who, bytesData);
    this.addTx(tx)
    return tx
  }

  async changeOutput(signer, outputPipeAddr) {
    const who = await signer.getAddress()
    const contract = this.contract.connect(signer)
    const tx = await contract.getFunction("changeOutput").call(who, outputPipeAddr);
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


export const lidontAbi = [
  'event Transfer(address indexed _from, address indexed _to, uint256 _value)',
  'event Approval(address indexed _owner, address indexed _spender, uint256 _value)',
  'event Mint(uint256 indexed amount, address indexed recipient)',
  'function setMinter()',
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
  'function setUpgrade(address upgradeAddress)',
  'function triggerEmission(address output)',
  'function toggleValidOutput(address output)',
  'function changeEmissionRate(uint256 newEmissionPerBlock)',
  'function deposit(uint256 stETHAmount, address outputPipe)',
  'function changeOutput(address outputPipe)',
  'function initiateWithdrawal(address[] depositors) returns (uint256[])',
  'function finaliseWithdrawal(address[] depositors, uint256[] _hints) returns (uint256[])',
  'function claim(bytes data) returns (uint256)',
  'function lidont() view returns (address)',
  'function deposits(address arg0) view returns (tuple(uint256 stETH, uint256 requestId, uint256 ETH, address outputPipe))',
  'function queue(uint256 arg0) view returns (address)',
  'function queueSize() view returns (uint256)',
  'function queueFront() view returns (uint256)',
  'function queueBack() view returns (uint256)',
  'function admin() view returns (address)',
  'function newMinter() view returns (address)',
  'function outputIndex(address arg0) view returns (uint256)',
  'function outputPipes(uint256 arg0) view returns (address)',
  'function emissionPerBlock() view returns (uint256)',
  'function lastRewardBlock(address arg0) view returns (uint256)'
]

// ETH pipe abi
export const outputPipesAbi = [
  'event Receive(uint256 indexed amount, uint256 indexed oldBondValue, uint256 indexed newBondValue)',
  'event Stake(address indexed user, uint256 indexed amount)',
  'event Unstake(address indexed user, uint256 indexed amount, uint256 indexed reward)',
  'function receiveReward(address _token, address _from, uint256 _amount)',
  'function unstake(uint256 amount)',
  'function previewUnstake(address user, uint256 amount) returns (uint256)',
  'function bondValue() view returns (uint256)',
  'function temp() view returns (uint256)',
  'function dust() view returns (uint256)',
  'function stakes(address arg0) view returns (tuple(uint256 amount, uint256 bondValue))',
  'function totalStake() view returns (uint256)'
]

export const outputPipesRETHAbi = [
  'event Stake(address indexed user, uint256 indexed amount)',
  'event Unstake(address indexed user, uint256 indexed amount, uint256 rewardLidont, uint256 rewardRocket)',
  'function receiveReward(address _token, address _from, uint256 _amount)',
  'function unstake(uint256 amount)',
  'function previewUnstake(address user, uint256 amount) returns (uint256, uint256)',
  'function rewardPoolLidont() view returns (tuple(address token, uint256 precision, uint256 bondValue, uint256 temp, uint256 dust))',
  'function rewardPoolRocket() view returns (tuple(address token, uint256 precision, uint256 bondValue, uint256 temp, uint256 dust))',
  'function bondValueLidont() view returns (uint256)',
  'function bondValueRocket() view returns (uint256)',
  'function tempLidont() view returns (uint256)',
  'function dustLidont() view returns (uint256)',
  'function tempRocket() view returns (uint256)',
  'function dustRocket() view returns (uint256)',
  'function stakes(address arg0) view returns (tuple(uint256 amount, uint256 bondValueLidont, uint256 bondValueRocket))',
  'function totalStake() view returns (uint256)'
]


// rocket swap router abi
export const rocketSwapRouterAbi = [{
  "inputs": [{
      "internalType": "uint256",
      "name": "_amount",
      "type": "uint256"
  }, {
      "internalType": "uint256",
      "name": "_steps",
      "type": "uint256"
  }],
  "name": "optimiseSwapTo",
  "outputs": [{
      "internalType": "uint256[2]",
      "name": "portions",
      "type": "uint256[2]"
  }, {
      "internalType": "uint256",
      "name": "amountOut",
      "type": "uint256"
  }],
  "stateMutability": "nonpayable",
  "type": "function"
}]