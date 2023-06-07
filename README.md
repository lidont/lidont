# Lidont
Convert stETH to rETH or spin up Rocket Pool minipools and earn Lidont tokens.

# Contract functionality
Lidont is an [ERC-20](https://eips.ethereum.org/EIPS/eip-20) compliant token contract.
In addition to the standard ERC-20 functionality, it implements the following mechanisms.

## Swap stETH for (staked) rETH
`swap(uint256 stETHAmount, bool stake)`: deposit Lido Staked Ether (stETH) into the Lidont contract and receive Rocket Ether (rETH) in return, at the current Rocket Pool protocol price.
If `stake` is true, your rETH is immediately staked with the Lidont contract, otherwise it is transferred to you.

Fails if there is not enough rETH in the Lidont contract to transfer to you (when `stake` is false), or if you did not approve the Lidont contract for the transfer of at least `stETHAmount` stETH from your account.

## Stake rETH
`stake(uint256 rETHAmount)`: stake Rocket Ether with the Lidont contract.

Fails if you did not approve the Lidont contract for the transfer of at least `rETHAmount` rETH from your account.

`getStake(address who) -> uint256`: returns the current rETH stake for the account `who`.

## Unstake rETH
`unstake(uint256 rETHAmount)`: unstake Rocket Ether from the Lidont contract, returning it to your account.

Fails if the `rETHAmount` is larger than your current rETH stake.

## Claim rewards for staked rETH
`claimEmission() -> uint256`: receive Lidont tokens for your staked rETH.

Lidont accrues to staked rETH at the rate of 1 Lidont per staked rETH per block.

Returns the number of (atto-)Lidont tokens received, so can be static-called to view claimable rewards.

## Claim rewards for a Rocket Pool minipool
`claimMinipool(address nodeAddress, uint256 nodeIndex, uint256 index)`: receive Lidont for creating a Rocket Pool minipool.

If the minipool was created after the Lidont contract was deployed and has entered Rocket Pool's `Staking` status, it is eligible for a one-time reward of 2.1 million Lidont tokens.
This can only be claimed by the registered Rocket Pool node account, or its Rocket Pool withdrawal address.
(The indices can be computed by the frontend.)

## Withdraw stETH from Lido
`initiateWithdrawal()`: request withdrawal of the Lidont contract's entire stETH balance from Lido, sending its stETH to Lido's withdrawal contract.

`finaliseWithdrawal(uint256[] requestIds, uint256[] hints)`: finalise the withdrawal with Lido, receiving ETH into the Lidont contract.

Anyone can call these functions and pay the gas to convert the Lidont contract's stETH into ETH.
A maximum of 32 requestIds can be processed at a time by `finaliseWithdrawal`.
(The `requestIds` and `hints` can be computed by the frontend.)

Fails if a withdrawal is not yet ready to finalise.

## Mint rETH
`mintRocketEther(ethAmount: uint256)`: mint rETH with Rocket Pool directly, using the Lidont contract's ETH balance.

Anyone can call this function to pay gas to convert the Lidont contract's ETH to rETH.
This rETH is not staked by anyone - it is simply used as liquidity for future swaps.

Fails if `ethAmount` exceeds the Lidont contract's balance, or if there is not enough room in the Rocket Pool deposit pool.
