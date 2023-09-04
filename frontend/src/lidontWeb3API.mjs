import * as ethers from './ethers.js';
import { abi as Abi } from "./abi.mjs";
import { waitForCallback, waitForSeconds } from './util.mjs';


export class lidontWeb3API {
  constructor(contractAddr) {
    if (!contractAddr) {
      throw new Error("param is missing from constructor");
    }
    this.contractAddr = contractAddr
    this.contract = new ethers.Contract(contractAddr, Abi);
    // pending txs
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
    const tx = await contract.getFunction("initiateWithdrawal").call(who, depositorsAddressArray);
    await this.addTx(tx)
    return tx
  }

  async finaliseWithdrawal(signer, depositorsAddressArray, hints) {
    const who = await signer.getAddress()
    const contract = this.contract.connect(signer)
    console.log("depositorsAddresses: ", depositorsAddressArray)
    console.log("hints: ", hints)
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
  const iface = new ethers.Interface(abi);
  const formatted = iface.format("full");
  return formatted
}


export const ERC20Abi = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address arg0) view returns (uint256)",
  "function allowance(address arg0, address arg1) view returns (uint256)",
  "function approve(address _spender, uint256 _value) returns (bool)"
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


export const outputPipeAbi = []