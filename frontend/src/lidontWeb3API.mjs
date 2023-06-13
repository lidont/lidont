import * as ethers from './ethers.min.js';
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
  }

  async stake(signer, rETHAmount) {
    const who = await signer.getAddress()
    const contract = this.contract.connect(signer)
    const tx = await contract.getFunction("stake").call(who, rETHAmount);
    this.addTx(tx)
  }

  async unstake(signer, rETHAmount) {
    const who = await signer.getAddress()
    const contract = this.contract.connect(signer)
    const tx = await contract.getFunction("unstake").call(who, rETHAmount);
    this.addTx(tx)
  }

  async claimEmission(signer) {
    const who = await signer.getAddress()
    const contract = this.contract.connect(signer)
    const tx = await contract.getFunction("claimEmission").call(who);
    this.addTx(tx)
  }

  async claimMinipool(signer, nodeAddress, nodeIndex, index) {
    const who = await signer.getAddress()
    const contract = this.contract.connect(signer)
    const tx = await contract.getFunction("claimMinipool").call(who, nodeAddress, nodeIndex, index);
    this.addTx(tx)
  }

  async initiateWithdrawal(signer, stETHAmount) {
    const who = await signer.getAddress()
    const contract = this.contract.connect(signer)
    const tx = await contract.getFunction("initiateWithdrawal").call(who, stETHAmount);
    this.addTx(tx)
  }

  async finalizeWithdrawal(signer, requestIds, hints) {
    const who = await signer.getAddress()
    const contract = this.contract.connect(signer)
    const tx = await contract.getFunction("finalizeWithdrawal").call(who, requestIds, hints);
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

  async addTx(tx) {
    this.pending.push(await this.provider.getTransaction(tx.hash));
  }

  purgeMinedTransactions() {
    this.pending = this.pending.filter((tx) => tx.confirmations == 0);
  }

  async waitUntilTxConfirmed(tx, confirmationsneeded = 1){

    async function recur(tx){
      // get tx data and check
      const confirmations = tx.confirmations // get transaction bla
      if(confirmations >= confirmationsNeeded){
        return
      }
      await waitForSeconds(0.5)
      await recur()
    }

    const P = new Promise(async (resolve,reject) => {
      await recur()
      return resolve()
    })

    return P
  }

  async waitUntilTx(){
    await waitForCallback( async => {
      
    })
    return console.log("done")
  }
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
