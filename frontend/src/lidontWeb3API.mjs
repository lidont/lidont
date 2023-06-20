import * as ethers from '../node_modules/ethers/dist/ethers.js';
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

  async swap(signer, stETHAmount, stake) {
    const who = await signer.getAddress()
    const contract = this.contract.connect(signer)
    const tx = await contract.getFunction("swap").call(who, stETHAmount, stake);
    this.addTx(tx)
    return tx
  }

  async stake(signer, rETHAmount) {
    const who = await signer.getAddress()
    const contract = this.contract.connect(signer)
    const tx = await contract.getFunction("stake").call(who, rETHAmount);
    this.addTx(tx)
    return tx
  }

  async unstake(signer, rETHAmount) {
    const who = await signer.getAddress()
    const contract = this.contract.connect(signer)
    const tx = await contract.getFunction("unstake").call(who, rETHAmount);
    this.addTx(tx)
    return tx
  }

  async unstakeStatic(signer, rETHAmount) {
    const contract = this.contract.connect(signer)
    return await contract.unstake.staticCall(rETHAmount);
  }

  async claimEmission(signer) {
    const who = await signer.getAddress()
    const contract = this.contract.connect(signer)
    const tx = await contract.getFunction("claimEmission").call(who);
    this.addTx(tx)
    return tx
  }

  async claimEmissionStatic(signer) {
    const who = await signer.getAddress()
    const contract = this.contract.connect(signer)
    return await contract.claimEmission.staticCall();
  }

  async claimMinipool(signer, nodeAddress, nodeIndex, index) {
    const who = await signer.getAddress()
    const contract = this.contract.connect(signer)
    const tx = await contract.getFunction("claimMinipool").call(who, nodeAddress, nodeIndex, index);
    this.addTx(tx)
    return tx
  }

  async initiateWithdrawal(signer, stETHAmount) {
    const who = await signer.getAddress()
    const contract = this.contract.connect(signer)
    const tx = await contract.getFunction("initiateWithdrawal").call(who, stETHAmount);
    this.addTx(tx)
    return tx
  }

  async finaliseWithdrawal(signer, requestIds, hints) {
    const who = await signer.getAddress()
    const contract = this.contract.connect(signer)
    console.log("requestIds: ", requestIds)
    console.log("hints: ", hints)
    const tx = await contract.getFunction("finaliseWithdrawal").call(who, requestIds, hints);
    this.addTx(tx)
  }

  async mintRocketEther(signer, ethAmount) {
    const who = await signer.getAddress()
    const contract = this.contract.connect(signer)
    const tx = await contract.getFunction("mintRocketEther").call(who, ethAmount);
    this.addTx(tx)
  }


  // Reads
  //
  async getStake(signer, who) {
    return await this.contract.connect(signer).getStake(who);
  }

  async getAllowance(signer, owner, spender) {
    const who = await signer.getAddress()
    return await this.contract.connect(signer).allowance(owner, spender);
  }

  async getStakedRETH(signer, address) {
    const contract = this.contract.connect(signer)
    // stake, rewardDebt, lastClaimBlock
    return await contract.stakedReth(address);
  }

  async getRewardMinipoolsFromIndex(signer) {
    return await this.contract.connect(signer).rewardMinipoolsFromIndex();
  }

  async isMinipoolClaimed(signer, address) {
    return await this.contract.connect(signer).minipoolClaimed(address);
  }

  async getEventsSWAP(){
    const filter = this.contract.filters.Transfer
    const events = await this.contract.queryFilter(filter) // (filter, -100) for last 100 blocks range
    return events
  }

  async getEventsWITHDRAWALREQUEST(){
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
  }

  purgeMinedTransactions() {
    this.pending = this.pending.filter((tx) => tx.confirmations == 0);
  }

  async waitUntilTxConfirmed(tx){
    return await waitForCallback( async () => {
      const data = await this.getTx(tx)
      if(data.blockNumber) return true
    })
  }
  
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