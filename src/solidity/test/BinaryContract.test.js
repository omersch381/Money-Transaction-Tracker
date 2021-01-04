const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const { compiledBinaryContract } = require('./Utils');

let accounts;
let binaryContract;
let binaryContractInitialDebt;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    binaryContractInitialDebt = "4";

    binaryContract = await new web3.eth.Contract(JSON.parse(compiledBinaryContract.interface))
        .deploy({
            data: compiledBinaryContract.bytecode,
            arguments: [accounts[0], binaryContractInitialDebt, accounts[1]]
        })
        .send({
            from: accounts[0],
            gas: '1000000'
        });
});

describe('BinaryContracts API method tests', () => {

    it('deploys a binaryContract', () => {
        assert.ok(binaryContract.options.address);
    });

    it('testing API GET methods', async () => {

        // Checking getter methods
        assert.strictEqual(accounts[1], await binaryContract.methods.getCurrentDebtorAddress().call());
        assert.strictEqual(accounts[0], await binaryContract.methods.getCurrentCreditorAddress().call());
        assert.strictEqual(binaryContractInitialDebt, await binaryContract.methods.getCurrentDebtAmount().call());

        await assertCurrentDebt(accounts[1], binaryContractInitialDebt, accounts[0]);

        let binContractTransactionsLog = await binaryContract.methods.getAllTransations().call();
        assert.strictEqual(1, binContractTransactionsLog.length);

        // we only have one transaction - the one that was created when we deployed the BinaryContract
        let contractTransaction = binContractTransactionsLog[0];
        assert.strictEqual(accounts[0], contractTransaction.from);
        assert.strictEqual(accounts[1], contractTransaction.to);
        assert.strictEqual(binaryContractInitialDebt, contractTransaction.amount);
        assert.ok(Date.now() > contractTransaction.date);
    });

    it('testing API UPDATE methods', async () => {

        await binaryContract.methods.updateDebtor(accounts[0]).send({
            from: accounts[0]
        })
        assert.strictEqual(accounts[0], await binaryContract.methods.getCurrentDebtorAddress().call());

        await binaryContract.methods.updateCreditor(accounts[1]).send({
            from: accounts[0]
        })
        assert.strictEqual(accounts[1], await binaryContract.methods.getCurrentCreditorAddress().call());


        await binaryContract.methods.updateContractDebt(accounts[0], binaryContractInitialDebt, accounts[1]).send({
            from: accounts[0],
        })
        await assertCurrentDebt(accounts[1], binaryContractInitialDebt, accounts[0]);

        // If we use updateContractDebt when the transactionsLog is empty, it just sets the currentContract values to
        // what the user sent. So after this stub addTransaction call, we could update the actual currentDebt.
        await addTransaction(accounts[0], 0, accounts[1]);

        await binaryContract.methods.updateContractDebt(accounts[0], binaryContractInitialDebt, accounts[1]).send({
            from: accounts[0],
        })

        await assertCurrentDebt(accounts[1], 2 * binaryContractInitialDebt, accounts[0]);
    });


    it('testing addTransaction method', async () => {

        // means that accounts[1] owes binaryContractInitialDebt to accounts[0]
        await assertCurrentDebt(accounts[1], binaryContractInitialDebt, accounts[0]);

        // send binaryContractInitialDebt from accounts[0] to accounts[1]
        await addTransaction(accounts[0], binaryContractInitialDebt, accounts[1]);

        await assertCurrentDebt(accounts[1], 2 * binaryContractInitialDebt, accounts[0]);

        await addTransaction(accounts[1], 3 * binaryContractInitialDebt, accounts[0]);

        // now accounts[0] owes binaryContractInitialDebt to accounts[1]
        await assertCurrentDebt(accounts[0], binaryContractInitialDebt, accounts[1]);

        await addTransaction(accounts[0], binaryContractInitialDebt, accounts[1]);

        // the debt/loan is settled
        await assertCurrentDebt(accounts[0], 0, accounts[1]);
    });
});

async function addTransaction(sender, amountToSend, receiver) {
    let amountToSendAsAString = String(amountToSend);
    await binaryContract.methods.addTransaction(sender, amountToSendAsAString, receiver).send({
        from: accounts[0],
        gas: "1000000"
    });
}

async function assertCurrentDebt(debtor, amount, creditor) {
    let amountAsAString = String(amount);
    let currentDebt = await binaryContract.methods.getCurrentDebt().call();
    assert.strictEqual(debtor, currentDebt.debtor);
    assert.strictEqual(creditor, currentDebt.creditor);
    assert.strictEqual(amountAsAString, currentDebt.amountOwned);
}