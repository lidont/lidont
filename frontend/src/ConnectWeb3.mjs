import { Contract, JsonRpcProvider } from "ethers";


export class ConnectWeb3 {

    constructor(contractAddr) {
        if(!contractAddr){
            throw new Error("param is missing from constructor")
        }
        this.contract = new Contract(contractAddr, /*Abi*/)
        this.lidont = new Contract("0x0", ERC20Abi)
    }

    connectProvider(provider) {
            this.provider = provider;
            this.contract = this.contract.connect(this.provider);
            this.lidont = this.lidont.connect(this.provider);
    }

    connectURL(url) {
        this.provider = new JsonRpcProvider(url);
        this.contract = this.contract.connect(this.provider);
        this.lidont = this.lidont.connect(this.provider);
    }

    disconnect() {
        this.provider.removeAllListeners();
    }


    async updatePendingTransactions() {
        this.pending = await Promise.all(this.pending.map(async tx => {
            return tx.confirmations == 0? await this.provider.getTransaction(tx.hash) : tx;
        }));
    }

    async addTx(tx) {
        this.pending.push(await this.provider.getTransaction(tx.hash));
    }

    purgeMinedTransactions() {
        this.pending = this.pending.filter(tx => tx.confirmations == 0);
    }


    /**
     * Helper to query the amount of digits of an erc20 token
     * @param tokenAddr Address of the erc20 token
     * @returns Number of digits of an erc20 token
     */
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