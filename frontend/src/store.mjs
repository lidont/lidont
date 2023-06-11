import * as ethers from "../node_modules/ethers/dist/ethers.js";
import { createStore, log } from "./util.mjs";
import { Erc20Abi } from "./ConnectWeb3.mjs";


const chainById = {
  1: {
      lidont: "",
      SCAN: 'https://etherscan.io/',
      NAME: "Ethereum Mainnet",
      ICON: "eth.png"
  },
  5: {
      lidont: "0xfaabbe302750635e3f918385a1aeb4a9eb45977a",
      SCAN: 'https://goerli.etherscan.io/',
      NAME: "Ethereum Goerli",
      ICON: "eth.png"
  },
  31337: {
      lidont: "0x",
      SCAN: '',
      RPC: '',
      NAME: "Testnet",
      ICON: "eth.png"
  },

}

const chainIdTestnet = 5
const chainIdMainnet = 1

console.log("!!!!! DEV ONLY - BETA TESTNET !!!!!")
const chainIdDefault = chainIdTestnet // import.meta.env.MODE === "production" ? chainIdMainnet : chainIdTestnet

function intToHex(number){
  return '0x'+number.toString(16)
}



// Store
//
export const store = createStore(
  log((setState, getState, api) => ({
    loading: false,
    address: null,
    balance: null,
    balanceFormatted: null,
    erc20OfInterest: ["LIDONT", "rETH", "stETH"],
    balances: {

    },

    // for <input-connected> inputs are mapped to <input name=???> name components & forms
    inputs: {},

    provider: window.ethereum
      ? new ethers.BrowserProvider(window.ethereum)
      : new ethers.InfuraProvider("mainnet", "ID"),

    // compound actions
    async connectNetworkAndWallet(){
      await this.addConnectNetwork(chainIdDefault)
      await this.connectWallet()
    },

    async connectWallet() {
      const { address, loading } = getState();
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

        ethereum.on("accountsChanged", (accounts) =>
          this.onAccountChange(accounts)
        );
        ethereum.on("chainChanged", (chainId) => this.onNetworkChange(chainId));

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
                    chainName: chainById[networkId].NAME,
                    rpcUrls: [chainById[networkId].RPC],
                    blockExplorerUrls: [chainById[networkId].SCAN],
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
      this.address = accounts[0];
      this.balance = ethers.utils.parseEther("0");
      this.balances = {};
      this.last_blockheight = 0;
      if (accounts.length == 0) {
        await this.connectWallet();
      }
    },

    async onNetworkChange(chainId) {
      console.log("ChainChanged");
      this.addresses = chainById[chainId];
      this.unsupported_network = false;
      if (this.addresses == undefined) this.unsupported_network = true;
    },

    async changeChains(chainIdString) {
      const chainId = ethers.utils.hexValue(parseInt(chainIdString));
      const provider = this.provider;
      const success = provider.send("wallet_switchEthereumChain", [
        { chainId },
      ]);
      return success == null ? true : false;
    },

    async signMessage(message) {
      const provider = this.provider;
      const signer = provider.getSigner();
      return await signer.signMessage(message);
    },

    async updateBalance() {
      let signer;
      const { provider, address } = getState();

      try {
        signer = await provider.getSigner();
      } catch (e) {
        return console.log(e);
      }

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
        signer = provider.getSigner();
        signerAddr = signer.getAddress();
      } catch (e) {
        return console.log(e);
      }

      const entry = balances[address];
      entry = entry || {};
      const contract = new ethers.Contract(address, Erc20Abi, provider);
      entry.name = await contract.name();
      entry.symbol = await contract.symbol();
      entry.decimals = await contract.decimals();
      entry.balance = await contract.balanceOf(signerAddr);
      entry.balanceFormatted = await ethers.utils.formatUnits(
        entry.balance,
        entry.decimals
      );
      return entry;
    },
  }))
);


window.STORE = store;