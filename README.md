# Lidont
Incentivise withdrawing stETH from Lido with Lidont reward tokens.

# Withdrawler Contract functionality

The withdrawler receives stETH deposits and sends the ETH withdrawn from Lido to the selected output pipe.

## Deposit stETH
`deposit(uint256 stETHAmount, address outputPipe)`: deposit Lido Staked Ether (stETH) to be unstaked from Lido and select `outputPipe` as the destination for the withdrawn ETH.

Fails if `outputPipe` is not a valid output pipe (see [Output Pipes](#output-pipes)).

Fails if the withdrawler is not approved for the transfer of at least `stETHAmount` stETH from the sender.

Fails if there are already too many (32) pending deposits that have not yet been unstaked.

## Initiate Lido withdrawal
`initiateWithdrawal(address[] depositors) → uint256[] requestIds`: request unstaking the stETH from Lido for each of the `depositors`.

The array of `requestIds` from Lido is returned and also included in the emitted log `WithdrawalRequest(uint256[] requestIds, address[] depositors, uint256[] requestAmounts)`.  

Fails if any of the `depositors` does not have a stETH deposit that is waiting to be unstaked.

## Finalise Lido withdrawal
`finaliseWithdrawal(address[] depositors, uint256[] hints) → uint256[] amounts`: finalise the Lido withdrawal for each of the `depositors`, receiving the sum of the `amounts` of ETH into the withdrawler.

The `hints` (computed by the frontend) are provided via static call by Lido given the `depositors`' `requestId`s.

Fails if any of the `depositors` does not have an open withdrawal `requestId`.

A maximum of 32 requests can be processed at a time.

## Claim output
`claim() → uint256`: claim pending withdrawn ETH, sending it via the chosen output pipe, for the next depositor.

Depositors' claims are processed in the order of their deposits.

Fails if there is no pending depositor, or if the next depositor's stETH has not yet been withdrawn and finalised.

Returns the amount of ETH sent, which is also recorded in the emitted log `Claim(address recipient, address outputPipe, uint256 amount)`.

# Output Pipes
These functions can only be called by the current `admin` account.

## Change the admin account
`changeAdmin(address newAdmin)`: change the admin account to `newAdmin`.

## Add/remove a valid output pipe
`toggleValidOutput(address output)`: toggle the validity of address `output` as an output pipe.

# Output Pipe Functionality
A valid output pipe should be a smart contract implementing the following functions:
  - `receive(address user) payable`: receives ether for `user`.
  - `receiveReward(address from, uint256 amount) nonpayable`: signals availability of `amount` Lidont rewards (which can be transferred from `from`).
