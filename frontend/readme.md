# Lidont Frontend - micro dApp frontend

This Frontend uses vanilla js
 - web components
 - single-file css
 - subscription based state store
 - only ethers.js as external dependency


## Usage

##### Need to have installed: node.js & npm

```npm install```

serve: ```npm run serve```



## notes

Some notes on Lido withdrawals (and doing them via Lidont) as I understand things:

1.To withdraw ETH for stETH with Lido, there are three steps:

2.Send your stETH to the unstETH contract and obtain an unstETH NFT (which has a unique withdrawal request id)

3.Wait for your NFT to be "fulfilled" by Lido, i.e., they made enough funds available for it


Send your NFT to the unstETH contract and get ETH back

1.With Lidont we do the same:
The Lidont contract trades stETH for an unstETH NFT via the initiateWithdrawal function, which anyone can call

2.The pending request ids held by Lidont contract can be seen in its NFT holdings, and anyone can check when they become fulfilled off-chain by querying Lido

3.The Lidont contract trades unstETH NFTs for ETH via the finaliseWithdrawal function, which anyone can call.




Lidont will emit the WithdrawalRequest(ids, amount) event log when it mints unstETH NFTs, with a list of request ids and the total amount of stETH those NFTs represent. (These can also be found in the unstETH's getWithdrawalRequests function which returns all requests by address of requester.)

finaliseWithdrawals needs to know the request ids that are being claimed, and also some "hints" to help Lido's withdrawal contract find the requests. The hints can be obtained off-chain via unstETH's findCheckpointHints function that takes a list of request ids and returns the corresponding hints.