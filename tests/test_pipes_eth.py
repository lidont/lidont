from ape import reverts, Contract
from eth_abi.abi import encode
from eth_utils import keccak
import pytest
import time

ONE_DAY_SECONDS = 24 * 60 * 60
EMISSION_PER_BLOCK = 10 ** 9

def test_init_eth(ETH_pipe, lidont, accounts):
    assert ETH_pipe.temp() == 0
    assert ETH_pipe.dust() == 0
    assert ETH_pipe.bondValue() == 100000000
    assert ETH_pipe.totalStake() == 0

def test_stake_eth(withdrawler, deposit_ETH_pipe, accounts):
    assert withdrawler.deposits(accounts[0]).stETH == deposit_ETH_pipe["amount"]

def test_unstake_partial(lidont, withdrawler, start_emission, ETH_pipe_added, one_withdrawal_claimed, chain, accounts):
    stake_blocks = ONE_DAY_SECONDS // 12 + 128
    before_mine = chain.blocks.head.number
    chain.mine(stake_blocks)
    after_mine = chain.blocks.head.number
    assert after_mine - before_mine == stake_blocks
    
    setLastLogs = list(withdrawler.SetLastRewardBlock.range(withdrawler.creation_metadata.receipt.block_number, chain.blocks.head.number))
    assert setLastLogs[-1].bnum == ETH_pipe_added['toggle_valid_receipt'].block_number
    
    amount = one_withdrawal_claimed.return_value // 2
    receipt = ETH_pipe_added['pipe'].unstake(amount, sender=accounts[0])
    
    mint_logs = lidont.Mint.from_receipt(receipt)
    assert len(ETH_pipe_added['pipe'].Receive.from_receipt(receipt)) == 1
    assert len(mint_logs) == 1
    assert mint_logs[0].recipient == ETH_pipe_added['pipe'].address
    assert mint_logs[0].amount == (receipt.block_number - ETH_pipe_added['toggle_valid_receipt'].block_number) * EMISSION_PER_BLOCK

    logs = ETH_pipe_added['pipe'].Unstake.from_receipt(receipt)
    assert len(logs) == 1
    assert lidont.balanceOf(accounts[0]) in [4055100000000, 4057200000000]

def test_rewards_distribution(ETH_pipe, lidont, withdrawler, accounts, deposit_ETH_pipe, one_withdrawal_claimed):
    reward_amount = 800 * 10 ** 18
    lidont.mint(reward_amount, accounts[0].address, sender=withdrawler)
    lidont.transferFrom("0x0000000000000000000000000000000000000000", accounts[0], reward_amount, sender=accounts[0])
    
    # Approve and distribute rewards
    lidont.approve(ETH_pipe.address, reward_amount, sender=accounts[0])
    ETH_pipe.receiveReward(lidont.address, accounts[0].address, reward_amount, sender=accounts[0])
    
    totalBonds = ETH_pipe.totalStake() // 10 ** 9
    bondInc = reward_amount // totalBonds
    totalDistributed = bondInc * totalBonds
    
    assert ETH_pipe.bondValue() == 100000000 + bondInc
    assert ETH_pipe.dust() == reward_amount - totalDistributed

def test_rewards_dust_clearing(ETH_pipe, lidont, withdrawler, accounts):
    initial_dust = ETH_pipe.dust()
    assert initial_dust > 0
    
    totalBonds = ETH_pipe.totalStake() // 10 ** 9
    perfectReward = totalBonds * 2
    rewardsToClear = perfectReward - initial_dust
    
    lidont.mint(rewardsToClear, accounts[0].address, sender=withdrawler)
    lidont.transferFrom("0x0000000000000000000000000000000000000000", accounts[0], rewardsToClear, sender=accounts[0])
    lidont.approve(ETH_pipe.address, rewardsToClear, sender=accounts[0])
    ETH_pipe.receiveReward(lidont.address, accounts[0].address, rewardsToClear, sender=accounts[0])
    
    assert ETH_pipe.dust() == 0