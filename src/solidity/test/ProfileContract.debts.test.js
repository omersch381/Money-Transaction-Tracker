const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());
const { assertRequest, getAddress, RequestPurpose, compiledBinaryContract } = require('./Utils');

const compiledProfileContract = require('../build/ProfileContract.json');

let accounts;
let profileContractA;
let profileContractB;
let profileContractAName = "Omer";
let profileContractBName = "Dror";
let amountToPass = "6";

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    profileContractA = await deployAProfileContract(profileContractAName);

    profileContractB = await deployAProfileContract(profileContractBName);
});

describe('ProfileContracts debts API methods tests', () => {

    it('test add debt requests', async () => {
        await sendDebtRequestsFromLeftToRight(profileContractA, amountToPass, profileContractB);

        let requestsOfA = await profileContractA.methods.getAllExchanges().call();
        let requestsOfB = await profileContractB.methods.getAllExchanges().call();

        assertDebtRequest(requestsOfA, getAddress(profileContractA), getAddress(profileContractB), getAddress(profileContractA), getAddress(profileContractB), amountToPass);
        assertDebtRequest(requestsOfB, getAddress(profileContractA), getAddress(profileContractB), getAddress(profileContractA), getAddress(profileContractB), amountToPass);
    });

    it('test add debt confirmations', async () => {

        // Note: the order matters!! leftToRight !== rightToLeft
        // On the first time we call these methods, a BinaryContract will be deployed because it doesn't already exist.
        await sendDebtRequestsFromLeftToRight(profileContractA, amountToPass, profileContractB);
        await confirmDebtRequestFromLeftToRight(profileContractA, amountToPass, profileContractB);

        let lastDeployedContractAddress = await profileContractA.methods.getLastContract().call();
        let lastDeployedContract = await getContractReferenceInstance(compiledBinaryContract, lastDeployedContractAddress);
        assert.ok(lastDeployedContract.options.address, "A BinaryContract could not be deployed!!!");
        await assertBinaryCurrentDebt(lastDeployedContract, getAddress(profileContractB), amountToPass, getAddress(profileContractA));

        // For the second time, a transaction will be added (and there won't be another binaryContract deployment)
        await sendDebtRequestsFromLeftToRight(profileContractA, amountToPass, profileContractB);
        await confirmDebtRequestFromLeftToRight(profileContractA, amountToPass, profileContractB);

        // it is the same  lastDeployedContractAddress as for the first debt request which was sent.
        assert.strictEqual(lastDeployedContractAddress, await profileContractA.methods.getLastContract().call(), "Another BinaryContract was deployed instead of using the last one!!");
        await assertBinaryCurrentDebt(lastDeployedContract, getAddress(profileContractB), 2 * amountToPass, getAddress(profileContractA));
    });
});

describe('ProfileContracts debts scenario methods tests', () => {
    it('test add debts back and forth between 2 profiles', async () => {

        // This test tests that 2 profiles can confirm 3 debts among them and have the correct currentDebt of the contract.
        await confirmDebtFromLeftToRight(profileContractA, amountToPass, profileContractB);
        let lastDeployedContract = await getContractReferenceInstance(compiledBinaryContract, await profileContractA.methods.getLastContract().call());
        await assertBinaryCurrentDebt(lastDeployedContract, getAddress(profileContractB), amountToPass, getAddress(profileContractA));

        await confirmDebtFromLeftToRight(profileContractB, 4 * amountToPass, profileContractA);
        lastDeployedContract = await getContractReferenceInstance(compiledBinaryContract, await profileContractA.methods.getLastContract().call());
        await assertBinaryCurrentDebt(lastDeployedContract, getAddress(profileContractA), 3 * amountToPass, getAddress(profileContractB));

        await confirmDebtFromLeftToRight(profileContractA, 3 * amountToPass, profileContractB);
        lastDeployedContract = await getContractReferenceInstance(compiledBinaryContract, await profileContractA.methods.getLastContract().call());
        await assertBinaryCurrentDebt(lastDeployedContract, getAddress(profileContractA), 0, getAddress(profileContractB));
    }).timeout(5000);
});

async function confirmDebtFromLeftToRight(profileContractA, amountToPass, profileContractB) {
    await sendDebtRequestsFromLeftToRight(profileContractA, amountToPass, profileContractB);
    await confirmDebtRequestFromLeftToRight(profileContractA, amountToPass, profileContractB);
}

async function confirmDebtRequestFromLeftToRight(profileContractA, amountToPass, profileContractB) {
    assert.ok(await doesADebtRequestBetweenLeftToRightExist(profileContractA, profileContractB), "There are no debt requests to confirm!!");
    let contractExisted = await doesABinaryContractBetweenLeftToRightExist(profileContractA, profileContractB);

    if (contractExisted) {
        let profileAContractsAddresses = await profileContractA.methods.getContracts().call();
        let existedBinaryContract = await getContractReferenceInstance(compiledBinaryContract, profileAContractsAddresses[0]); // we know it is on index 0 because it is testing env
        await addTransaction(existedBinaryContract, profileContractA, amountToPass, profileContractB);
    } else
        await deployABinaryContract(profileContractA, profileContractA, amountToPass, profileContractB);

    // we assign a zeroAddress if the contract already existed. Otherwise, the deployed contract address
    let newContractAddress = contractExisted ? await profileContractA.methods.getZeroAddress().call() : await profileContractA.methods.getLastContract().call();
    let numOfExchanges = (await profileContractA.methods.getAllExchanges().call()).length;

    profileContractA.methods.confirmDebtRequest(0) // We know that it is 0 index only because it is testing env
        .send({ from: accounts[0], gas: "2000000" });

    profileContractB.methods.confirmDebtRequestNotRestricted(0, newContractAddress) // We know that it is 0 index only because it is testing env
        .send({ from: accounts[0], gas: "2000000" });

    // we have to wait until the send methods really takes action in the blockchain and in the smart contracts
    await waitUntilRequestTakesAction(numOfExchanges);
}

async function waitUntilRequestTakesAction(number) {
    let waitingSize = 20;

    for (let numOfCurrentRequests = 0; numOfCurrentRequests < waitingSize; numOfCurrentRequests++)
        if ((await profileContractA.methods.getAllExchanges().call()).length < number)
            return;
}

async function doesADebtRequestBetweenLeftToRightExist(profileContractA, profileContractB) {
    let profileARequests = await profileContractA.methods.getAllExchanges().call();

    if (profileARequests.length == 0)
        return false;

    for (let index = 0; index < profileARequests.length; index++) {
        let request = profileARequests[index];
        if (request.transaction.to === getAddress(profileContractB))
            return true;
        else
            return false;
    }
}

async function doesABinaryContractBetweenLeftToRightExist(profileContractA, profileContractB) {
    let profileAContractAddresses = await profileContractA.methods.getContracts().call();

    for (var i = 0; i < profileAContractAddresses.length; i++) {
        let currentBinaryContract = await getContractReferenceInstance(compiledBinaryContract, profileAContractAddresses[i]);

        let currentDebtOfCurrentBinaryContract = await currentBinaryContract.methods.getCurrentDebt().call();

        let accountsOfTransaction = [getAddress(profileContractA), getAddress(profileContractB)];

        if (accountsOfTransaction.includes(String(currentDebtOfCurrentBinaryContract.debtor)) && accountsOfTransaction.includes(String(currentDebtOfCurrentBinaryContract.creditor))) {
            // it means that the contract already exist

            return true;
        }
    }
    return false;
}

async function getContractReferenceInstance(compiledContract, address) {
    return new web3.eth.Contract(
        JSON.parse(compiledContract.interface),
        address
    );
}

function assertDebtRequest(requestWrapper, source, destination, transactionFrom, transactionTo, transactionAmount) {
    assertRequest(requestWrapper, source, destination, RequestPurpose['AddDebt'], transactionFrom, transactionTo, transactionAmount);
}

async function sendDebtRequestsFromLeftToRight(profileContractA, amountToPass, profileContractB) {
    await profileContractA.methods.addDebtRequest(getAddress(profileContractB), getAddress(profileContractA), amountToPass, getAddress(profileContractB))
        .send({ from: accounts[0], gas: "1000000" });
    await profileContractB.methods.addDebtRequestNotRestricted(getAddress(profileContractA), getAddress(profileContractA), amountToPass, getAddress(profileContractB))
        .send({ from: accounts[0], gas: "1000000" });
}

async function deployAProfileContract(profileContractName) {
    return await new web3.eth.Contract(JSON.parse(compiledProfileContract.interface))
        .deploy({
            data: compiledProfileContract.bytecode,
            arguments: [profileContractName],
        })
        .send({
            from: accounts[0],
            gas: '4000000'
        });
}

async function deployABinaryContract(profileContract, senderAddress, amountToPass, receiverAddress) {
    await profileContract.methods
        .createBinaryContract(
            getAddress(senderAddress),
            amountToPass,
            getAddress(receiverAddress)
        )
        .send({
            from: accounts[0],
            gas: "4000000",
        });
}

async function addTransaction(binaryContract, profileContractA, amountToPass, profileContractB) {
    await binaryContract.methods
        .addTransaction(
            getAddress(profileContractA),
            amountToPass,
            getAddress(profileContractB)
        )
        .send({
            from: accounts[0],
            gas: "2000000",
        });
}

async function assertBinaryCurrentDebt(binaryContract, debtor, amount, creditor) {
    let amountAsAString = String(amount);
    let currentDebt = await binaryContract.methods.getCurrentDebt().call();
    assert.strictEqual(debtor, currentDebt.debtor);
    assert.strictEqual(creditor, currentDebt.creditor);
    assert.strictEqual(amountAsAString, currentDebt.amountOwned);
}