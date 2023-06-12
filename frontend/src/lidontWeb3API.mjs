import * as ethers from "../node_modules/ethers/dist/ethers.js";
import { abi as Abi } from "./abi.mjs";

const iface = new ethers.Interface(Abi);
const ABI = iface.format(false);

console.log(ABI)


export class lidontWeb3API {
  constructor(contractAddr) {
    if (!contractAddr) {
      throw new Error("param is missing from constructor");
    }
    this.contract = new ethers.Contract(contractAddr, Abi);
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

  async approve(signer, spender, value) {
    const tx = await this.contract.connect(signer).approve(spender, value);
    this.addTx(tx)
  }

  async swap(signer, stETHAmount, stake) {
    const who = await signer.getAddress()
    debugger
    const swapFunc = this.contract.getFunction("swap")
    const tx =  await swapFunc(who, stETHAmount, stake);
    this.addTx(tx)
  }

  async stake(signer, rETHAmount) {
    const tx = await this.contract.connect(signer).stake(rETHAmount);
    this.addTx(tx)
  }

  async unstake(signer, rETHAmount) {
    // const amount = AbiCoder.defaultAbiCoder().encode(["uint"], [rETHAmount])
    // const amount = ethers.formatUnits()
    const tx = await this.contract.connect(signer).unstake(rETHAmount);
    this.addTx(tx)
  }

  async claimEmission(signer) {
    const tx = await this.contract.connect(signer).claimEmission();
    this.addTx(tx)
  }

  async claimMinipool(signer, nodeAddress, nodeIndex, index) {
    const tx = await this.contract
      .connect(signer)
      .claimMinipool(nodeAddress, nodeIndex, index);
  }

  async initiateWithdrawal(signer, stETHAmount) {
    const tx = await this.contract.connect(signer).initiateWithdrawal(stETHAmount);
  }

  async finalizeWithdrawal(signer, requestIds, hints) {
    const tx = await this.contract
      .connect(signer)
      .finaliseWithdrawal(requestIds, hints);
  }

  async mintRocketEther(signer, ethAmount) {
    const tx = await this.contract.connect(signer).mintRocketEther(ethAmount)
    this.addTx(tx)
  }


  // Reads
  //
  async getStake(signer, who) {
    return await this.contract.connect(signer).getStake(who);
  }

  async getAllowance(signer, owner, spender) {
    return await this.contract.connect(signer).allowance(owner, spender);
  }

  async getStakedRETH(signer, address) {
    // stake, rewardDebt, lastClaimBlock
    return await this.contract.connect(signer).stakedReth(address);
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
}

export const ERC20Abi = `[
    {
      "constant": true,
      "inputs": [],
      "name": "name",
      "outputs": [
        {
          "name": "",
          "type": "string"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "decimals",
      "outputs": [
        {
          "name": "",
          "type": "uint8"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_owner",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "name": "balance",
          "type": "uint256"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "symbol",
      "outputs": [
        {
          "name": "",
          "type": "string"
        }
      ],
      "payable": false,
      "type": "function"
    }
  ]`;
