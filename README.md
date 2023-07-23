
# Lidont
Convert stETH to rETH or spin up Rocket Pool minipools and earn Lidont tokens.

# Contract functionality
Lidont is an [ERC-20](https://eips.ethereum.org/EIPS/eip-20) compliant token contract.
In addition to the standard ERC-20 functionality, it implements the following mechanisms.


# Locking Contract
## Lock stETH
`swap(uint256 stETHAmount, bool stake)`: deposit Lido Staked Ether (stETH) into the Lidont contract and receive Rocket Ether (rETH) in return, at the current Rocket Pool protocol price.
If `stake` is true, your rETH is immediately staked with the Lidont contract, otherwise it is transferred to you.

Fails if there is not enough rETH in the Lidont contract to transfer to you (when `stake` is false), or if you did not approve the Lidont contract for the transfer of at least `stETHAmount` stETH from your account.

## Claim rewards for a Rocket Pool minipool
`claimMinipool(address nodeAddress, uint256 nodeIndex, uint256 index)`: receive Lidont for creating a Rocket Pool minipool.

If the minipool was created after the Lidont contract was deployed and has entered Rocket Pool's `Staking` status, it is eligible for a one-time reward of 2.1 million Lidont tokens.
This can only be claimed by the registered Rocket Pool node account, or its Rocket Pool withdrawal address.
(The indices can be computed by the frontend.)


## _private: Withdraw stETH from Lido
`initiateWithdrawal(stETHAmount: uint256) → uint256[]`: request withdrawal of the Lidont contract's stETH from Lido, sending the stETH to Lido's withdrawal contract.

Fails if `stETHAmount` exceeds the Lidont contract's stETH balance, or is too large for a single Lido withdrawal (> 80000 stETH).

`finaliseWithdrawal(uint256[] requestIds, uint256[] hints)`: finalise the withdrawal with Lido, receiving ETH into the Lidont contract.

Fails if a withdrawal is not yet ready to finalise.

Anyone can call these functions and pay the gas to convert the Lidont contract's stETH into ETH.
Respecting Lido limitations, if `stETHAmount` (in atto-stETH) is larger than 1000 stETH, the request is broken up into (up to 80) requests of size 1000 stETH.
The array of requestIds from Lido is returned and also included in the emitted log `WithdrawalRequest(uint256 indexed stETHamount, uint256[] requestIds)`.

A maximum of 32 requestIds can be processed at a time by `finaliseWithdrawal`.
(The `requestIds` and `hints` can be computed by the frontend.)

