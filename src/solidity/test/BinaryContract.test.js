const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const compiledBinaryContract = require('../build/BinaryContract.json');

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
        assert.strictEqual(accounts[1], await binaryContract.methods.getCurrentDebtorAddress().call());
        assert.strictEqual(accounts[0], await binaryContract.methods.getCurrentCreditorAddress().call());
        assert.strictEqual(binaryContractInitialDebt, await binaryContract.methods.getCurrentDebtAmount().call());

        let currentContractDebt = await binaryContract.methods.getCurrentDebt().call();
        assert.strictEqual(accounts[1], currentContractDebt.debtor);
        assert.strictEqual(accounts[0], currentContractDebt.creditor);
        assert.strictEqual(binaryContractInitialDebt, currentContractDebt.amountOwned);

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
        let currentContractDebt = await binaryContract.methods.getCurrentDebt().call();
        assert.strictEqual(accounts[1], currentContractDebt.debtor);
        assert.strictEqual(accounts[0], currentContractDebt.creditor);
        assert.strictEqual(binaryContractInitialDebt, currentContractDebt.amountOwned);

        // If we use updateContractDebt when the transactionsLog is empty, it just sets the currentContract values to
        // what the user sent. So after this stub addTransaction call, we could update the actual currentDebt.
        await binaryContract.methods.addTransaction(accounts[0], "0", accounts[1]).send({
            from: accounts[0],
            gas: "1000000"
        })

        await binaryContract.methods.updateContractDebt(accounts[0], binaryContractInitialDebt, accounts[1]).send({
            from: accounts[0],
        })

        currentContractDebt = await binaryContract.methods.getCurrentDebt().call();
        assert.strictEqual(accounts[1], currentContractDebt.debtor);
        assert.strictEqual(accounts[0], currentContractDebt.creditor);
        assert.strictEqual(String(2 * binaryContractInitialDebt), currentContractDebt.amountOwned);
    });


    it('testing addTransaction method', async () => {
        let currentContractDebt = await binaryContract.methods.getCurrentDebt().call();
        assertCurrentDebt(currentContractDebt, accounts[1], binaryContractInitialDebt, accounts[0]);

        await binaryContract.methods.addTransaction(accounts[0], binaryContractInitialDebt, accounts[1]).call();
    });

    function assertCurrentDebt(currentDebt, debtor, amount, creditor) {
        assert.strictEqual(debtor, currentDebt.debtor);
        assert.strictEqual(creditor, currentDebt.creditor);
        assert.strictEqual(amount, currentDebt.amountOwned);
    }
});