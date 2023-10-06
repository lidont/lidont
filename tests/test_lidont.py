from ape import reverts, Contract
from eth_abi.abi import encode
from eth_utils import keccak
import pytest

addresses = dict(mainnet =
                 dict(rocketStorageAddress = '0x1d8f8f00cfa6758d7bE78336684788Fb0ee0Fa46',
                      stETHAddress         = '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
                      unstETHAddress       = '0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1',
                      hashConsensus        = '0xD624B08C83bAECF0807Dd2c6880C3154a5F0B288',
                      accountingOracle     = '0x852deD011285fe67063a08005c71a85690503Cee',
                      withdrawalVault      = '0xB9D7934878B5FB9610B3fE8A5e441e8fad7E293f',
                      elRewardsVault       = '0x388C818CA8B9251b393131C08a736A67ccB19297',
                      burner               = '0xD15a672319Cf0352560eE76d9e89eAB0889046D3',
                      sanityChecker        = '0x9305c1Dbfe22c12c66339184C0025d7006f0f1cC',
                      ),
                 goerli =
                 dict(rocketStorageAddress = '0xd8Cd47263414aFEca62d6e2a3917d6600abDceB3',
                      stETHAddress         = '0x1643E812aE58766192Cf7D2Cf9567dF2C37e9B7F',
                      unstETHAddress       = '0xCF117961421cA9e546cD7f50bC73abCdB3039533',
                      )
                 )

ONE_DAY_SECONDS = 24 * 60 * 60

@pytest.fixture(scope="session")
def addr(networks):
    network = networks.provider.network.name.removesuffix('-fork')
    return addresses[network]

@pytest.fixture(scope="session")
def stETH(addr):
    return Contract(addr['stETHAddress'])

@pytest.fixture(scope="session")
def unstETH(addr):
    return Contract(addr['unstETHAddress'])

EMISSION_PER_BLOCK = 10 ** 9

@pytest.fixture(scope="session")
def withdrawler(project, addr, accounts):
    withdrawler = project.withdrawler.deploy(
            addr['stETHAddress'], addr['unstETHAddress'], sender=accounts[0])
    return withdrawler

@pytest.fixture(scope="session")
def start_emission(withdrawler, accounts):
    return withdrawler.changeEmissionRate(EMISSION_PER_BLOCK, sender=accounts[0])

@pytest.fixture(scope="session")
def lidont(project, accounts, withdrawler):
    lidont = project.lidont.deploy(withdrawler.address, sender=accounts[0])
    withdrawler.setLidont(lidont.address, sender=accounts[0])
    return lidont

@pytest.fixture(scope="session")
def ETH_pipe(project, lidont, accounts):
    return project._get_attr('ETH-pipe').deploy(lidont.address, sender=accounts[0])

@pytest.fixture(scope="session")
def rETH_pipe(project, lidont, accounts, addr):
    return project._get_attr('rETH-pipe').deploy(lidont.address, addr["rocketStorageAddress"], sender=accounts[0])


def test_lidont_symbol_decimals(lidont):
    assert lidont.symbol() == 'LIDONT'
    assert lidont.decimals() == 18

def test_cannot_deposit_no_pipe(withdrawler, accounts):
    import secrets
    arbitraryPipe = f'0x{secrets.token_hex(20)}'
    assert withdrawler.outputIndex(arbitraryPipe) == 0
    with reverts("invalid pipe"):
        withdrawler.deposit(100, arbitraryPipe, sender=accounts[0])

def test_toggle_pipe_makes_valid(withdrawler, ETH_pipe, accounts):
    assert withdrawler.outputIndex(ETH_pipe.address) == 0
    withdrawler.toggleValidOutput(ETH_pipe.address, sender=accounts[0])
    assert withdrawler.outputIndex(ETH_pipe.address) == 1

@pytest.fixture(scope="function")
def ETH_pipe_added(withdrawler, ETH_pipe, accounts):
    receipt = withdrawler.toggleValidOutput(ETH_pipe.address, sender=accounts[0])
    return {'pipe': ETH_pipe, 'toggle_valid_receipt': receipt}

@pytest.fixture(scope="function")
def rETH_pipe_added(withdrawler, rETH_pipe, accounts):
    withdrawler.toggleValidOutput(rETH_pipe.address, sender=accounts[0])
    return rETH_pipe

def test_cannot_deposit_no_amount(withdrawler, ETH_pipe_added, accounts):
    with reverts("deposit too small"):
        withdrawler.deposit(0, ETH_pipe_added['pipe'].address, sender=accounts[0])

@pytest.fixture(scope="function")
def have_stETH(stETH, accounts):
    return stETH.submit(accounts[0], value='6.9 ETH', sender=accounts[0])

def test_cannot_deposit_not_approved(withdrawler, have_stETH, ETH_pipe_added, accounts):
    with reverts("ALLOWANCE_EXCEEDED"):
        withdrawler.deposit(100, ETH_pipe_added['pipe'].address, sender=accounts[0])

def test_cannot_deposit_no_balance(withdrawler, stETH, ETH_pipe_added, accounts):
    assert stETH.balanceOf(accounts[0]) == 0
    assert stETH.approve(withdrawler.address, 100, sender=accounts[0])
    with reverts("balance"):
        withdrawler.deposit(100, ETH_pipe_added['pipe'].address, sender=accounts[0])

@pytest.fixture(scope="function")
def deposit_ETH_pipe(accounts, withdrawler, have_stETH, stETH, ETH_pipe_added):
    amount = 42 * 10 ** 17
    assert stETH.approve(withdrawler.address, amount, sender=accounts[0])
    withdrawler.deposit(amount, ETH_pipe_added['pipe'].address, sender=accounts[0])
    return {"amount": amount}

def test_deposit_pipe_ETH(withdrawler, deposit_ETH_pipe, accounts):
    assert withdrawler.deposits(accounts[0]).stETH == deposit_ETH_pipe["amount"]

def test_deposit_pipe_rETH(withdrawler, addr, stETH, have_stETH, rETH_pipe_added, accounts):
    amount = 42 * 10 ** 9
    assert stETH.approve(withdrawler.address, amount, sender=accounts[0])
    withdrawler.deposit('42 gwei', rETH_pipe_added.address, sender=accounts[0])
    assert withdrawler.deposits(accounts[0]).stETH == amount

def test_cannot_deposit_different_pipe_after_deposit(withdrawler, addr, accounts, stETH, have_stETH, rETH_pipe_added, deposit_ETH_pipe):
    amount = 42 * 10 ** 9
    assert stETH.approve(withdrawler.address, amount, sender=accounts[0])
    with reverts("pending deposit"):
        withdrawler.deposit('42 gwei', rETH_pipe_added.address, sender=accounts[0])

@pytest.fixture(scope="function")
def one_withdrawal_initiated(withdrawler, deposit_ETH_pipe, accounts):
    queueSize = withdrawler.queueSize()
    assert queueSize == 1
    assert withdrawler.queue(0) == accounts[0].address
    receipt = withdrawler.initiateWithdrawal([accounts[0]], sender=accounts[0])
    requestIds = receipt.return_value
    return requestIds

def test_initiateWithdrawal(one_withdrawal_initiated):
    assert len(one_withdrawal_initiated) == 1

@pytest.fixture(scope="function")
def one_withdrawal_finalized(withdrawler, addr, stETH, unstETH, one_withdrawal_initiated, chain, accounts):
    requestId = one_withdrawal_initiated[0]

    HashConsensusContract = Contract(addr['hashConsensus'])
    AccountingOracleContract = Contract(addr['accountingOracle'])
    WithdrawalVaultContract = Contract(addr['withdrawalVault'])
    ELRewardsVaultContract = Contract(addr['elRewardsVault'])
    BurnerContract = Contract(addr['burner'])
    CheckerContract = Contract(addr['sanityChecker'])

    SLOTS_PER_EPOCH, SECONDS_PER_SLOT, GENESIS_TIME = HashConsensusContract.getChainConfig()
    EPOCHS_PER_FRAME = HashConsensusContract.getFrameConfig()[1]
    MAX_REQUESTS_PER_CALL = 1000
    SHARE_RATE_PRECISION = 10 ** 27

    attempts = 0
    while unstETH.getLastFinalizedRequestId() < requestId:
        # stake more ETH with Lido to "increase buffered ETH in the protocol"
        stETH.submit(accounts[2], value='1024 ETH', sender=accounts[2])
        chain.mine(256)
        stETH.submit(accounts[3], value='1024 ETH', sender=accounts[3])
        chain.mine(256, None, ONE_DAY_SECONDS)
        stETH.submit(accounts[4], value='1024 ETH', sender=accounts[4])
        chain.mine(256, None, 2 * ONE_DAY_SECONDS)

        refSlot = HashConsensusContract.getCurrentFrame()[0]
        frame_start_with_offset = GENESIS_TIME + (refSlot + SLOTS_PER_EPOCH * EPOCHS_PER_FRAME + 1) * SECONDS_PER_SLOT
        chain.mine(1, frame_start_with_offset)
        refSlot = HashConsensusContract.getCurrentFrame()[0]

        members = HashConsensusContract.getFastLaneMembers()[0]
        submitter = members[0]
        _, beaconValidators, beaconBalance = stETH.getBeaconStat()
        shares1, shares2 = BurnerContract.getSharesRequestedToBurn()
        reportTime = GENESIS_TIME + refSlot * SECONDS_PER_SLOT
        withdrawalVaultBalance = WithdrawalVaultContract.balance
        elRewardsVaultBalance = ELRewardsVaultContract.balance
        postCLBalance = beaconBalance + 10 ** 19 # do we need to add the 10 ETH to this?
        postTotalPooledEther, postTotalShares, withdrawals, elRewards = stETH.call_view_method(
                'handleOracleReport',
                reportTime,
                ONE_DAY_SECONDS,
                beaconValidators,
                postCLBalance,
                withdrawalVaultBalance,
                elRewardsVaultBalance,
                0,
                [],
                0,
                sender=AccountingOracleContract,
            )
        simulatedShareRate = postTotalPooledEther * SHARE_RATE_PRECISION // postTotalShares
        _, _, _, _, _, _, _, requestTimestampMargin, _ = CheckerContract.getOracleReportLimits()
        bufferedEther = stETH.getBufferedEther()
        unfinalizedStETH = unstETH.unfinalizedStETH()
        reservedBuffer = min(bufferedEther, unfinalizedStETH)
        availableETH = withdrawals + elRewards + reservedBuffer
        maxTimestamp = chain.blocks.head.timestamp - requestTimestampMargin
        assert availableETH
        batchesState = unstETH.calculateFinalizationBatches(
                simulatedShareRate, maxTimestamp, MAX_REQUESTS_PER_CALL,
                (availableETH, False, [0 for _ in range(36)], 0)
            )
        while not batchesState[1]:
            batchesState = unstETH.calculateFinalizationBatches(
                    simulatedShareRate, maxTimestamp, MAX_REQUESTS_PER_CALL, batchesState
                )
        withdrawalFinalizationBatches = list(filter(lambda value: value > 0, batchesState[2]))
        preTotalPooledEther = stETH.getTotalPooledEther()
        is_bunker = preTotalPooledEther > postTotalPooledEther
        consensusVersion = AccountingOracleContract.getConsensusVersion()
        reportData = (
                consensusVersion,
                refSlot,
                beaconValidators, # numValidators
                postCLBalance // 10 ** 9, # clBalanceGwei
                [], # stakingModuleIdsWithNewlyExitedValidators
                [], # numExitedValidatorsByStakingModule
                withdrawalVaultBalance,
                elRewardsVaultBalance,
                shares1 + shares2, # sharesRequestedToBurn
                withdrawalFinalizationBatches,
                simulatedShareRate,
                is_bunker,
                0, # extraDataFormat EMPTY1
                b'', # extraDataHash
                0, # extraDataItemsCount
            )
        reportHash = keccak(encode(
                ['(uint256,uint256,uint256,uint256,uint256[],uint256[]'
                 ',uint256,uint256,uint256,uint256[],uint256,bool,uint256,bytes32,uint256)'],
                [reportData]))
        for member in members:
            HashConsensusContract.submitReport(refSlot, reportHash, consensusVersion, sender=accounts[member])
        accounts[0].transfer(submitter, '10 ether')
        AccountingOracleContract.submitReportData(
                reportData,
                AccountingOracleContract.getContractVersion(),
                sender=submitter
            )

        attempts += 1
        assert attempts < 5

    hints = unstETH.findCheckpointHints([requestId], 1, unstETH.getLastCheckpointIndex())
    receipt = withdrawler.finaliseWithdrawal([accounts[0]], hints, sender=accounts[0])
    claimAmounts = receipt.return_value
    return claimAmounts

@pytest.fixture(scope="function")
def one_withdrawal_claimed(one_withdrawal_finalized, withdrawler, accounts):
    assert len(one_withdrawal_finalized) == 1
    return withdrawler.claim(sender=accounts[0])

def test_claim(one_withdrawal_claimed, ETH_pipe_added, deposit_ETH_pipe, accounts):
    assert one_withdrawal_claimed.return_value == deposit_ETH_pipe["amount"]
    assert ETH_pipe_added['pipe'].stakes(accounts[0]).amount == one_withdrawal_claimed.return_value
    logs = ETH_pipe_added['pipe'].Stake.from_receipt(one_withdrawal_claimed)
    assert len(logs) == 1
    assert logs[0].user == accounts[0]
    assert logs[0].amount == one_withdrawal_claimed.return_value

def test_unstake_partial(lidont, withdrawler, start_emission, ETH_pipe_added, one_withdrawal_claimed, chain, accounts):
    stake_blocks = ONE_DAY_SECONDS // 12 + 128
    before_mine = chain.blocks.head.number
    chain.mine(stake_blocks)
    after_mine = chain.blocks.head.number
    assert after_mine - before_mine == stake_blocks
    setLastLogs = list(withdrawler.SetLastRewardBlock.range(withdrawler.receipt.block_number, chain.blocks.head.number))
    assert setLastLogs[-1].bnum == start_emission.block_number
    assert len(setLastLogs) == 2
    emission_receipt = withdrawler.triggerEmission(ETH_pipe_added.address, sender=accounts[1]) # TODO: should this be automatic in some contract?
    mint_logs = lidont.Mint.from_receipt(emission_receipt)
    assert len(ETH_pipe_added.Receive.from_receipt(emission_receipt)) == 1
    assert len(mint_logs) == 1
    assert mint_logs[0].recipient == ETH_pipe_added.address
    assert mint_logs[0].amount == (emission_receipt.block_number - start_emission.block_number) * EMISSION_PER_BLOCK
    amount = one_withdrawal_claimed.return_value // 2
    receipt = ETH_pipe_added.unstake(amount, sender=accounts[0])
    logs = ETH_pipe_added.Unstake.from_receipt(receipt)
    assert len(logs) == 1
    assert lidont.balanceOf(accounts[0]) == 39 # TODO: calculate correctly
