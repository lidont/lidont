import { Contract, JsonRpcProvider, AbiCoder } from '../node_modules/ethers/dist/ethers.js';


export class ConnectWeb3 {

  constructor(contractAddr) {
    if (!contractAddr) {
      throw new Error("param is missing from constructor")
    }
    this.contract = new Contract(contractAddr, /*Abi*/)
  }

  connectProvider(provider) {
    this.provider = provider;
    this.contract = this.contract.connect(this.provider);
  }

  connectURL(url) {
    this.provider = new JsonRpcProvider(url);
    this.contract = this.contract.connect(this.provider);
  }

  disconnect() {
    this.provider.removeAllListeners();
  }

  // SC Functions & reads
  //

  async swap(signer, amount, stake = false) {
    const pair = new Contract(pairAddr, Abi, signer);
    const distributorAddr = await pair.distributor();
    const distributor = new Contract(distributorAddr, Abi, signer);
  }

  async fetchDuration(pairAddr) {
    if (!ethers.utils.isAddress(pairAddr)) throw "Invalid pairAddr";
    const pair = new Contract(pairAddr, Abi, this.provider);
    const bondAddr = await pair.bond();
    const bond = new Contract(bondAddr, Abi, this.provider);
    return await bond.bondDuration();
  }



  async stake(signer,amount,duration) {
    if (duration < 0 || duration > await (await this.getMaxLockingDuration()).toNumber()) throw "Invalid locking duration";
    this.addTx(await this.contract.connect(signer).stake(amount, AbiCoder.defaultAbiCoder().encode(["uint"], [duration])));
  }

  async unstake(signer,amount,lockID) {
    const tx = await this.contract.connect(signer).unstake(amount, AbiCoder.defaultAbiCoder().encode(["uint"], [lockID]));
    this.addTx(tx);
  }

  async claimRewards(signer) {
    const reward = await this.getRewardFor(signer);
    this.addTx(await this.contract.connect(signer).withdraw(reward));
  }



  // Transaction Queue
  //

  async updatePendingTransactions() {
    this.pending = await Promise.all(this.pending.map(async tx => {
      return tx.confirmations == 0 ? await this.provider.getTransaction(tx.hash) : tx;
    }));
  }

  async addTx(tx) {
    this.pending.push(await this.provider.getTransaction(tx.hash));
  }

  purgeMinedTransactions() {
    this.pending = this.pending.filter(tx => tx.confirmations == 0);
  }


  // Helper
  //
  async getTokenDecimals(tokenAddr) {
    const token = new Contract(tokenAddr, ERC20Abi, this.provider)
    return await token.decimals();
  }
}



export const Erc20Abi = `[
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
  ]`