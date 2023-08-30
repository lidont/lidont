export const abi = `
[{
  "name": "ChangeAdmin",
  "inputs": [{
      "name": "oldAdmin",
      "type": "address",
      "indexed": true
  }, {
      "name": "newAdmin",
      "type": "address",
      "indexed": true
  }],
  "anonymous": false,
  "type": "event"
}, {
  "name": "SetOutputValidity",
  "inputs": [{
      "name": "output",
      "type": "address",
      "indexed": true
  }, {
      "name": "valid",
      "type": "bool",
      "indexed": true
  }],
  "anonymous": false,
  "type": "event"
}, {
  "name": "ChangeEmission",
  "inputs": [{
      "name": "oldEmissionPerBlock",
      "type": "uint256",
      "indexed": true
  }, {
      "name": "newEmissionPerBlock",
      "type": "uint256",
      "indexed": true
  }],
  "anonymous": false,
  "type": "event"
}, {
  "name": "Deposit",
  "inputs": [{
      "name": "who",
      "type": "address",
      "indexed": true
  }, {
      "name": "amount",
      "type": "uint256",
      "indexed": true
  }],
  "anonymous": false,
  "type": "event"
}, {
  "name": "WithdrawalRequest",
  "inputs": [{
      "name": "requestIds",
      "type": "uint256[]",
      "indexed": false
  }, {
      "name": "depositors",
      "type": "address[]",
      "indexed": false
  }, {
      "name": "amounts",
      "type": "uint256[]",
      "indexed": false
  }],
  "anonymous": false,
  "type": "event"
}, {
  "name": "Claim",
  "inputs": [{
      "name": "who",
      "type": "address",
      "indexed": true
  }, {
      "name": "output",
      "type": "address",
      "indexed": true
  }, {
      "name": "amount",
      "type": "uint256",
      "indexed": true
  }],
  "anonymous": false,
  "type": "event"
}, {
  "stateMutability": "nonpayable",
  "type": "constructor",
  "inputs": [{
      "name": "stETHAddress",
      "type": "address"
  }, {
      "name": "unstETHAddress",
      "type": "address"
  }],
  "outputs": []
}, {
  "stateMutability": "nonpayable",
  "type": "function",
  "name": "changeAdmin",
  "inputs": [{
      "name": "newAdmin",
      "type": "address"
  }],
  "outputs": []
}, {
  "stateMutability": "nonpayable",
  "type": "function",
  "name": "setLidont",
  "inputs": [{
      "name": "lidontAddress",
      "type": "address"
  }],
  "outputs": []
}, {
  "stateMutability": "nonpayable",
  "type": "function",
  "name": "triggerEmission",
  "inputs": [{
      "name": "output",
      "type": "address"
  }],
  "outputs": []
}, {
  "stateMutability": "nonpayable",
  "type": "function",
  "name": "toggleValidOutput",
  "inputs": [{
      "name": "output",
      "type": "address"
  }],
  "outputs": []
}, {
  "stateMutability": "nonpayable",
  "type": "function",
  "name": "changeEmissionRate",
  "inputs": [{
      "name": "newEmissionPerBlock",
      "type": "uint256"
  }],
  "outputs": []
}, {
  "stateMutability": "nonpayable",
  "type": "function",
  "name": "deposit",
  "inputs": [{
      "name": "stETHAmount",
      "type": "uint256"
  }, {
      "name": "outputPipe",
      "type": "address"
  }],
  "outputs": []
}, {
  "stateMutability": "nonpayable",
  "type": "function",
  "name": "initiateWithdrawal",
  "inputs": [{
      "name": "depositors",
      "type": "address[]"
  }],
  "outputs": [{
      "name": "",
      "type": "uint256[]"
  }]
}, {
  "stateMutability": "nonpayable",
  "type": "function",
  "name": "finaliseWithdrawal",
  "inputs": [{
      "name": "depositors",
      "type": "address[]"
  }, {
      "name": "_hints",
      "type": "uint256[]"
  }],
  "outputs": [{
      "name": "",
      "type": "uint256[]"
  }]
}, {
  "stateMutability": "nonpayable",
  "type": "function",
  "name": "claim",
  "inputs": [],
  "outputs": [{
      "name": "",
      "type": "uint256"
  }]
}, {
  "stateMutability": "view",
  "type": "function",
  "name": "lidont",
  "inputs": [],
  "outputs": [{
      "name": "",
      "type": "address"
  }]
}, {
  "stateMutability": "view",
  "type": "function",
  "name": "deposits",
  "inputs": [{
      "name": "arg0",
      "type": "address"
  }],
  "outputs": [{
      "name": "",
      "type": "tuple",
      "components": [{
          "name": "stETH",
          "type": "uint256"
      }, {
          "name": "requestId",
          "type": "uint256"
      }, {
          "name": "ETH",
          "type": "uint256"
      }, {
          "name": "outputPipe",
          "type": "address"
      }]
  }]
}, {
  "stateMutability": "view",
  "type": "function",
  "name": "queue",
  "inputs": [{
      "name": "arg0",
      "type": "uint256"
  }],
  "outputs": [{
      "name": "",
      "type": "address"
  }]
}, {
  "stateMutability": "view",
  "type": "function",
  "name": "queueSize",
  "inputs": [],
  "outputs": [{
      "name": "",
      "type": "uint256"
  }]
}, {
  "stateMutability": "view",
  "type": "function",
  "name": "queueFront",
  "inputs": [],
  "outputs": [{
      "name": "",
      "type": "uint256"
  }]
}, {
  "stateMutability": "view",
  "type": "function",
  "name": "queueBack",
  "inputs": [],
  "outputs": [{
      "name": "",
      "type": "uint256"
  }]
}, {
  "stateMutability": "view",
  "type": "function",
  "name": "admin",
  "inputs": [],
  "outputs": [{
      "name": "",
      "type": "address"
  }]
}, {
  "stateMutability": "view",
  "type": "function",
  "name": "outputIndex",
  "inputs": [{
      "name": "arg0",
      "type": "address"
  }],
  "outputs": [{
      "name": "",
      "type": "uint256"
  }]
}, {
  "stateMutability": "view",
  "type": "function",
  "name": "outputPipes",
  "inputs": [{
      "name": "arg0",
      "type": "uint256"
  }],
  "outputs": [{
      "name": "",
      "type": "address"
  }]
}, {
  "stateMutability": "view",
  "type": "function",
  "name": "emissionPerBlock",
  "inputs": [],
  "outputs": [{
      "name": "",
      "type": "uint256"
  }]
}, {
  "stateMutability": "view",
  "type": "function",
  "name": "lastRewardBlock",
  "inputs": [{
      "name": "arg0",
      "type": "address"
  }],
  "outputs": [{
      "name": "",
      "type": "uint256"
  }]
}]
`;