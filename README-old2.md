# Lidont
Incentivise withdrawing stETH from Lido with Lidont reward tokens.

# Contract functionality
Lidont is an [ERC-20](https://eips.ethereum.org/EIPS/eip-20) compliant token contract.
In addition to the standard ERC-20 functionality, it implements the following mechanisms.

## Deposit stETH
`deposit(uint256 stETHAmount)`: deposit Lido Staked Ether (stETH) into the Lidont contract to be withdrawn from Lido, and mint Lidont rewards that become claimable when your withdrawn ether becomes available.

Fails if the Lidont contract is not approved for the transfer of at least `stETHAmount` stETH from your account.

## Claim output
`claim(address output) → (uint256 etherAmount, uint256 lidontAmount)`: claim pending withdrawn ETH and LIDONT rewards, sending them both to the output pipe at address `output`. The Lidont tokens are sent only if there would be no pending ether left to be claimed by the caller after this call. Returns the amount of ether and Lidont claimed, so that this can be previewed via static call.

Fails if `output` is not the address of a valid output pipe (see [Output Pipes](#output-pipes)), or if it is not possible to claim any ether (either because there is no ether in the Lidont contract, or there is no pending ether to be claimed by the caller).

# Processing Lido Withdrawals
Anyone can call these functions and pay the gas to convert the Lidont contract's stETH into ETH.

## Initiate Lido withdrawal
`initiateWithdrawal(stETHAmount: uint256) → uint256[]`: request withdrawal of the Lidont contract's stETH from Lido, sending the stETH to Lido's withdrawal contract.

Fails if `stETHAmount` exceeds the Lidont contract's stETH balance, or is too large for a single Lido withdrawal (> 80000 stETH).

Respecting Lido limitations, if `stETHAmount` (in atto-stETH) is larger than 1000 stETH, the request is broken up into (up to 80) requests of size 1000 stETH.
The array of requestIds from Lido is returned and also included in the emitted log `WithdrawalRequest(uint256 indexed stETHamount, uint256[] requestIds)`.

## Finalise Lido withdrawal
`finaliseWithdrawal(uint256[] requestIds, uint256[] hints)`: finalise the withdrawal with Lido, receiving ETH into the Lidont contract.

Fails if a withdrawal is not yet ready to finalise.

A maximum of 32 requestIds can be processed at a time by `finaliseWithdrawal`.
(The `requestIds` and `hints` can be computed by the frontend.)

# Output Pipes
These functions can only be called by the current `admin` account.

## Change the admin account
`changeAdmin(address newAdmin)`: change the admin account to `newAdmin`.

## Add/remove a valid output pipe
`setValidOutput(address output, bool valid)`: set the validity of address `output` as an output pipe, according to whether `valid` is true (valid) or false (invalid). A valid output pipe should be a smart contract implementing a function `receive(address user, uint256 lidontAmount) payable` that receives ether and Lidont rewards for `user` and processes them. The `receive` function can expect `lidontAmount` of Lidont to be approved for transfer from the null address during its call.
