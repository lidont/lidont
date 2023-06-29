export const abi = `
[
  {
    "name": "Transfer",
    "inputs": [
      { "name": "_from", "type": "address", "indexed": true },
      { "name": "_to", "type": "address", "indexed": true },
      { "name": "_value", "type": "uint256", "indexed": false }
    ],
    "anonymous": false,
    "type": "event"
  },
  {
    "name": "Approval",
    "inputs": [
      { "name": "_owner", "type": "address", "indexed": true },
      { "name": "_spender", "type": "address", "indexed": true },
      { "name": "_value", "type": "uint256", "indexed": false }
    ],
    "anonymous": false,
    "type": "event"
  },
  {
    "name": "Mint",
    "inputs": [{ "name": "amount", "type": "uint256", "indexed": true }],
    "anonymous": false,
    "type": "event"
  },
  {
    "name": "Stake",
    "inputs": [
      { "name": "who", "type": "address", "indexed": true },
      { "name": "amount", "type": "uint256", "indexed": true }
    ],
    "anonymous": false,
    "type": "event"
  },
  {
    "name": "Unstake",
    "inputs": [
      { "name": "who", "type": "address", "indexed": true },
      { "name": "amount", "type": "uint256", "indexed": true }
    ],
    "anonymous": false,
    "type": "event"
  },
  {
    "name": "Swap",
    "inputs": [
      { "name": "who", "type": "address", "indexed": true },
      { "name": "stakedEther", "type": "uint256", "indexed": true },
      { "name": "rocketEther", "type": "uint256", "indexed": true }
    ],
    "anonymous": false,
    "type": "event"
  },
  {
    "name": "ClaimMinipool",
    "inputs": [
      { "name": "who", "type": "address", "indexed": true },
      { "name": "node", "type": "address", "indexed": true },
      { "name": "minipool", "type": "address", "indexed": true }
    ],
    "anonymous": false,
    "type": "event"
  },
  {
    "name": "ClaimEmission",
    "inputs": [
      { "name": "who", "type": "address", "indexed": true },
      { "name": "lidont", "type": "uint256", "indexed": true }
    ],
    "anonymous": false,
    "type": "event"
  },
  {
    "name": "WithdrawalRequest",
    "inputs": [
      { "name": "requestIds", "type": "uint256[]", "indexed": false },
      { "name": "amount", "type": "uint256", "indexed": true }
    ],
    "anonymous": false,
    "type": "event"
  },
  {
    "stateMutability": "nonpayable",
    "type": "constructor",
    "inputs": [
      { "name": "rocketStorageAddress", "type": "address" },
      { "name": "stETHAddress", "type": "address" },
      { "name": "unstETHAddress", "type": "address" }
    ],
    "outputs": []
  },
  {
    "stateMutability": "nonpayable",
    "type": "function",
    "name": "transfer",
    "inputs": [
      { "name": "_to", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "bool" }]
  },
  {
    "stateMutability": "nonpayable",
    "type": "function",
    "name": "approve",
    "inputs": [
      { "name": "_spender", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "bool" }]
  },
  {
    "stateMutability": "nonpayable",
    "type": "function",
    "name": "transferFrom",
    "inputs": [
      { "name": "_from", "type": "address" },
      { "name": "_to", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "bool" }]
  },
  {
    "stateMutability": "nonpayable",
    "type": "function",
    "name": "swap",
    "inputs": [
      { "name": "stETHAmount", "type": "uint256" },
      { "name": "stake", "type": "bool" }
    ],
    "outputs": []
  },
  {
    "stateMutability": "nonpayable",
    "type": "function",
    "name": "stake",
    "inputs": [{ "name": "rETHAmount", "type": "uint256" }],
    "outputs": []
  },
  {
    "stateMutability": "nonpayable",
    "type": "function",
    "name": "unstake",
    "inputs": [{ "name": "rETHAmount", "type": "uint256" }],
    "outputs": [
      { "name": "", "type": "uint256" },
      { "name": "", "type": "uint256" },
      { "name": "", "type": "uint256" }
    ]
  },
  {
    "stateMutability": "nonpayable",
    "type": "function",
    "name": "claimEmission",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }]
  },
  {
    "stateMutability": "nonpayable",
    "type": "function",
    "name": "claimMinipool",
    "inputs": [
      { "name": "nodeAddress", "type": "address" },
      { "name": "nodeIndex", "type": "uint256" },
      { "name": "index", "type": "uint256" }
    ],
    "outputs": []
  },
  {
    "stateMutability": "nonpayable",
    "type": "function",
    "name": "initiateWithdrawal",
    "inputs": [{ "name": "stETHAmount", "type": "uint256" }],
    "outputs": [{ "name": "", "type": "uint256[]" }]
  },
  {
    "stateMutability": "nonpayable",
    "type": "function",
    "name": "finaliseWithdrawal",
    "inputs": [
      { "name": "_requestIds", "type": "uint256[]" },
      { "name": "_hints", "type": "uint256[]" }
    ],
    "outputs": []
  },
  {
    "stateMutability": "nonpayable",
    "type": "function",
    "name": "mintRocketEther",
    "inputs": [{ "name": "ethAmount", "type": "uint256" }],
    "outputs": []
  },
  {
    "stateMutability": "view",
    "type": "function",
    "name": "name",
    "inputs": [],
    "outputs": [{ "name": "", "type": "string" }]
  },
  {
    "stateMutability": "view",
    "type": "function",
    "name": "symbol",
    "inputs": [],
    "outputs": [{ "name": "", "type": "string" }]
  },
  {
    "stateMutability": "view",
    "type": "function",
    "name": "decimals",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint8" }]
  },
  {
    "stateMutability": "view",
    "type": "function",
    "name": "totalSupply",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }]
  },
  {
    "stateMutability": "view",
    "type": "function",
    "name": "balanceOf",
    "inputs": [{ "name": "arg0", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256" }]
  },
  {
    "stateMutability": "view",
    "type": "function",
    "name": "allowance",
    "inputs": [
      { "name": "arg0", "type": "address" },
      { "name": "arg1", "type": "address" }
    ],
    "outputs": [{ "name": "", "type": "uint256" }]
  },
  {
    "stateMutability": "view",
    "type": "function",
    "name": "stakedReth",
    "inputs": [{ "name": "arg0", "type": "address" }],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          { "name": "stake", "type": "uint256" },
          { "name": "rewardDebt", "type": "uint256" },
          { "name": "lastClaimBlock", "type": "uint256" }
        ]
      }
    ]
  },
  {
    "stateMutability": "view",
    "type": "function",
    "name": "totalStakedReth",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }]
  },
  {
    "stateMutability": "view",
    "type": "function",
    "name": "rewardMinipoolsFromIndex",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }]
  },
  {
    "stateMutability": "view",
    "type": "function",
    "name": "minipoolClaimed",
    "inputs": [{ "name": "arg0", "type": "address" }],
    "outputs": [{ "name": "", "type": "bool" }]
  }
]`