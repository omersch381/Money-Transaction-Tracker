const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());
const { assertRequest, getAddress, RequestPurpose, compiledBinaryContract } = require('./Utils');

const compiledProfileContract = require('../build/ProfileContract.json');
const { exception } = require('console');
const { maxHeaderSize } = require('http');

var debtRotationStatus = {
    MediatorAgreed: "0",
    ReceiverAgreed: "1",
    SenderAgreed: 2,
    Done: "3"
};

var debtRequestType = {
    debtRequest: "0",
    debtRotationRequest: "1"
}

let accounts;
let profileContractSender;
let profileContractMediator;
let profileContractReceiver;
let profileContractSenderName = "Omer";
let profileContractMediatorName = "Dror";
let profileContractReceiverName = "Michael";
let amountToRotate = "6";

const noLastDebtRotationRequestIndex = 777  // I had to choose a uint which will be positive and not an index as solc 0.4.17 
// makes lots of problems with types


/***********************************************************************************************/
/********************************** Testing Part ***********************************************/
/***********************************************************************************************/

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    profileContractSender = await deployAProfileContract(profileContractSenderName);

    profileContractMediator = await deployAProfileContract(profileContractMediatorName);

    profileContractReceiver = await deployAProfileContract(profileContractReceiverName);
});

describe('ProfileContracts debt rotation API methods tests', () => {

    it('test debt rotation requests API', async () => {

        /**
         * Tests the valid debt rotation API request.
         * 
         * This test tests that if actors send valid API debt rotation requests, the expected result (debtRotationStatus.Done)
         * arrives.
         * 
         * It first confirms 2 debts with the same amount:
         *      Debtor -> Mediator
         *      Mediator -> Creditor
         * 
         * Afterwards it tests 2 flows:
         *      Mediator sends a debt rotation request, then Debtor agrees, then Creditor.
         *      Mediator sends a debt rotation request, then Creditor agrees, then Debtor.
         * 
         * In both flows the final status is supposed to be debtRotationStatus.Done.
        */

        // Mediator now owes money to sender. I.e. Mediator == "Debtor", Sender == "Creditor". 
        await confirmDebtFromLeftToRight(profileContractSender, amountToRotate, profileContractMediator);

        // Receiver now owes money to Mediator. I.e. Receiver == "Debtor", Mediator == "Creditor". 
        await confirmDebtFromLeftToRight(profileContractMediator, amountToRotate, profileContractReceiver);

        let requestsOfMediator, requestsOfSender, requestsOfReceiver;
        let profilesOfActors = [profileContractSender, profileContractMediator, profileContractReceiver];
        let requestsOfActors = [requestsOfSender, requestsOfMediator, requestsOfReceiver];
        let numOfScenarios = 2;

        for (let i = 0; i < numOfScenarios; i++) {

            await sendDebtRotationRequestsFromLeftToRight(profileContractMediator, profileContractMediator, profileContractSender, profileContractReceiver, amountToRotate);
            for (let i = 0; i < requestsOfActors.length; i++) {
                requestsOfActors[i] = await profilesOfActors[i].methods.getAllExchanges().call();
                assertDebtRotationRequest(requestsOfActors[i], getAddress(profileContractMediator), getAddress(profileContractSender), getAddress(profileContractReceiver), debtRotationStatus.MediatorAgreed, amountToRotate);
            }

            switch (i % numOfScenarios) {
                case 0: // If first loop -> first sender (of the money) agrees and then receiver
                    firstActorToAgree = profileContractSender;
                    secondActorToAgree = profileContractReceiver;
                    expectedStatus = debtRotationStatus.SenderAgreed;
                    break;
                case 1: // If second loop -> first creditor agrees and then debtor
                    firstActorToAgree = profileContractReceiver;
                    secondActorToAgree = profileContractSender;
                    expectedStatus = debtRotationStatus.ReceiverAgreed;
                    break;
                default:
                    return;
            }

            await sendDebtRotationRequestsFromLeftToRight(firstActorToAgree, profileContractMediator, profileContractSender, profileContractReceiver, amountToRotate);
            for (let i = 0; i < requestsOfActors.length; i++) {
                requestsOfActors[i] = await profilesOfActors[i].methods.getAllExchanges().call();
                assertDebtRotationRequest(requestsOfActors[i], getAddress(profileContractMediator), getAddress(profileContractSender), getAddress(profileContractReceiver), expectedStatus, amountToRotate);
            }

            await sendDebtRotationRequestsFromLeftToRight(secondActorToAgree, profileContractMediator, profileContractSender, profileContractReceiver, amountToRotate);
            for (let i = 0; i < requestsOfActors.length; i++) {
                requestsOfActors[i] = await profilesOfActors[i].methods.getAllExchanges().call();
                assertDebtRotationRequest(requestsOfActors[i], getAddress(profileContractMediator), getAddress(profileContractSender), getAddress(profileContractReceiver), debtRotationStatus.Done, amountToRotate);
            }

            for (let i = 0; i < profilesOfActors.length; i++)
                await profilesOfActors[i].methods.removeAllExchanges().send({ from: accounts[0], gas: "1000000" });

        }
    }).timeout(10000);

    it('test debt rotation confirmation API', async () => {
        /**
         * Tests that a valid debt rotation request can be executed successfully.
         * 
         * This test makes sure that when there are 3 debt requests in requests list
         * of Debtor, Mediator and Receiver and each request has status of debtRotationStatus.Done, 
         * the debt can be rotated successfully.
         * 
         * I.e. if the same amount of money would have been transferred between Debtor -> Mediator -> Creditor,
         * then after a debt rotation there will be only one binary contract: Debtor <- Creditor.
         * 
         * It first confirms a debt, sends requests between all sides, saves the amounts of the contracts and then
         * rotates them and decreases them according to the new situation (if there is no debt, the contract is removed).
        */

        await confirmDebtFromLeftToRight(profileContractSender, amountToRotate, profileContractMediator);
        await confirmDebtFromLeftToRight(profileContractMediator, amountToRotate, profileContractReceiver);

        await sendDebtRotationRequestsFromLeftToRight(profileContractMediator, profileContractMediator, profileContractSender, profileContractReceiver, amountToRotate);
        await sendDebtRotationRequestsFromLeftToRight(profileContractSender, profileContractMediator, profileContractSender, profileContractReceiver, amountToRotate);
        await sendDebtRotationRequestsFromLeftToRight(profileContractReceiver, profileContractMediator, profileContractSender, profileContractReceiver, amountToRotate);

        let binaryContractBeforeItWasDecreasedBetweenSenderAndMediator = await getBinaryContractBetween(profileContractSender, profileContractMediator);
        assert.ok(binaryContractBeforeItWasDecreasedBetweenSenderAndMediator,
            'There is no BinaryContract between Sender %s and Mediator %s',
            await profileContractSender.methods.getName().call(),
            await profileContractMediator.methods.getName().call());
        let amountBetweenSenderAndMediator = await binaryContractBeforeItWasDecreasedBetweenSenderAndMediator.methods.getCurrentDebtAmount().call();

        let binaryContractBeforeItWasDecreasedBetweenMediatorAndReceiver = await getBinaryContractBetween(profileContractMediator, profileContractReceiver);
        assert.ok(binaryContractBeforeItWasDecreasedBetweenMediatorAndReceiver,
            'There is no BinaryContract between Sender %s and Mediator %s',
            await profileContractSender.methods.getName().call(),
            await profileContractMediator.methods.getName().call());
        let amountBetweenMediatorAndReceiver = await binaryContractBeforeItWasDecreasedBetweenMediatorAndReceiver.methods.getCurrentDebtAmount().call();

        await confirmDebtRotationRequestsBetween(profileContractMediator, profileContractSender, profileContractReceiver);
        await assertDebtWasRotated(profileContractMediator, profileContractSender, profileContractReceiver, binaryContractBeforeItWasDecreasedBetweenSenderAndMediator, amountBetweenSenderAndMediator, binaryContractBeforeItWasDecreasedBetweenMediatorAndReceiver, amountBetweenMediatorAndReceiver);

    }).timeout(10000);

    it('test debt rotation scenarios', async () => {

        /**
         * Tests debt rotation in different scenarios.
         * 
         * This test tests debt rotation in 3 different scenarios:
         * 
         *      Debt rotation with amountToRotate = amountOwned - 1 
         *          We expect no binaryContracts to be deployed, and the existed ones to add a transaction
         *          with amount of "amountOwned - 1" against the original sender.
         *      
         *      Debt rotation with amountToRotate = amountOwned + 1 (we just rotate another "amount = 2"))
         *          We expect the function to return error, as we can't rotate a bigger debt than the existing one between 
         *          all sides.     
         * 
         *      Debt rotation with amountToRotate = amountOwned (we just rotate another "amount = 1")
         *          We expect a binary contract to be deployed between sender and receiver, with the same amount of money
         *          they were both involved with the mediator. Also we expect the contracts between Mediator and both Creditor 
         *          and Debtor to be removed.
         * 
         *      Debt rotation when there are no BinaryContracts
         *          We expect the function to return error, as we can't rotate a debt which does not exist.
         * 
         * The test runs all the scenarios one by one in a sequential order.
         * 
        */

        let amountToRotateForThisTest = 10;

        // Debt amount = 0
        await confirmDebtFromLeftToRight(profileContractSender, amountToRotateForThisTest, profileContractMediator);
        await confirmDebtFromLeftToRight(profileContractMediator, amountToRotateForThisTest, profileContractReceiver);
        // Debt amount = 10

        await sendDebtRotationRequestsFromLeftToRight(profileContractMediator, profileContractMediator, profileContractSender, profileContractReceiver, amountToRotateForThisTest - 1);
        await sendDebtRotationRequestsFromLeftToRight(profileContractSender, profileContractMediator, profileContractSender, profileContractReceiver, amountToRotateForThisTest - 1);
        await sendDebtRotationRequestsFromLeftToRight(profileContractReceiver, profileContractMediator, profileContractSender, profileContractReceiver, amountToRotateForThisTest - 1);

        await confirmDebtRotationRequestsBetween(profileContractMediator, profileContractSender, profileContractReceiver);
        // Debt amount = 1

        // Making sure an attempt to rotate a debt which is higher than the actual debt of either the
        // Sender <-> Mediator or Mediator <-> Receiver fails
        try {
            await sendDebtRotationRequestsFromLeftToRight(profileContractMediator, profileContractMediator, profileContractSender, profileContractReceiver, 2);
            assert(false, 'something is wrong with this test\'s amount, it should be failed at this point');
        } catch (error) {
        }

        await sendDebtRotationRequestsFromLeftToRight(profileContractMediator, profileContractMediator, profileContractSender, profileContractReceiver, 1);
        await sendDebtRotationRequestsFromLeftToRight(profileContractSender, profileContractMediator, profileContractSender, profileContractReceiver, 1);
        await sendDebtRotationRequestsFromLeftToRight(profileContractReceiver, profileContractMediator, profileContractSender, profileContractReceiver, 1);

        await confirmDebtRotationRequestsBetween(profileContractMediator, profileContractSender, profileContractReceiver);
        // Debt amount = 0

        // assert Mediator's contracts are gone - later we make sure all the amount was rotated to Sender and receiver
        let contractsOfMediator = await profileContractMediator.methods.getContracts().call();
        let contractsOfSender = await profileContractSender.methods.getContracts().call();
        let contractsOfReceiver = await profileContractReceiver.methods.getContracts().call();

        assert.strictEqual(0, contractsOfMediator.length, 'Mediator\'s contracts are supposed to be removed!!');
        assert.strictEqual(1, contractsOfSender.length, 'Sender is supposed to have 1 contract!!');
        assert.strictEqual(1, contractsOfReceiver.length, 'Receiver is supposed to have 1 contract!!');

        // Making sure an attempt to rotate a debt when there is no debt fails
        try {
            await sendDebtRotationRequestsFromLeftToRight(profileContractMediator, profileContractMediator, profileContractSender, profileContractReceiver, 1);
            assert(false, 'something is wrong with this test\'s amount, it should be failed at this point');
        } catch (error) {
        }

        let deployedContract = await getBinaryContractBetween(profileContractSender, profileContractReceiver);
        assert.ok(deployedContract, 'There is no BinaryContract between Sender %s and Receiver %s',
            await profileContractSender.methods.getName().call(),
            await profileContractReceiver.methods.getName().call());
        let rotatedAmount = await deployedContract.methods.getCurrentDebtAmount().call();
        assert.strictEqual(String(amountToRotateForThisTest), rotatedAmount);

    }).timeout(15000);

    it('test debt rotation options per profileContract', async () => {
        /**
         * Tests that debt rotation contacts options works properly.
        */

        // Generating actors
        let debtors = [await deployAProfileContract('debtorA'),
        await deployAProfileContract('debtorB'), await deployAProfileContract('debtorC'),
        await deployAProfileContract('debtorD'), await deployAProfileContract('debtorE')];

        let mediator = await deployAProfileContract('mediator');

        let creditors = [await deployAProfileContract('creditorA'),
        await deployAProfileContract('creditorB'), await deployAProfileContract('creditorC'),
        await deployAProfileContract('creditorD'), await deployAProfileContract('creditorE')];

        // Creating debts
        for (const [i, debtor] of debtors.entries()) {
            await confirmDebtFromLeftToRight(debtor, 2 * i, mediator);
        };

        for (const [i, creditor] of creditors.entries()) {
            await confirmDebtFromLeftToRight(mediator, 2 * i, creditor);
        };

        let mediatorDebtRotationOptions = await getDebtRotationOptionsFor(mediator);

        assert.strictEqual(8, getDebtRotationOption(mediatorDebtRotationOptions, getAddress(debtors[4]), getAddress(creditors[4])));
        assert.strictEqual(6, getDebtRotationOption(mediatorDebtRotationOptions, getAddress(debtors[3]), getAddress(creditors[3])));

    }).timeout(10000);
});

/***********************************************************************************************/
/********************************** Assert Methods *********************************************/
/***********************************************************************************************/

function assertDebtRotationRequest(requestsOfProfile, mediatorAddress, creditorAddress, debtorAddress, statusOfRequest, amountToRotate) {
    // creditorAddress == senderAddress, debtorAddress == receiverAddress

    // Using what's relevant from the general assertRequest
    assertRequest(requestsOfProfile, mediatorAddress, debtorAddress, RequestPurpose['DebtRotation'], null, null, null);
    let request = requestsOfProfile[0];
    let debtRotation = request.debtRotation;

    assert.strictEqual(creditorAddress, debtRotation.creditor, "Invalid creditor address was sent to assertDebtRotationRequest");
    assert.strictEqual(statusOfRequest.toString(), debtRotation.status, "Invalid status was sent to assertDebtRotationRequest");
    assert.strictEqual(amountToRotate, debtRotation.amount, "Invalid (not a match) amountToRotate was sent to assertDebtRotationRequest");

    assert.strictEqual(1, requestsOfProfile.length);
}

async function assertDebtWasRotated(profileContractMediator, profileContractSender, profileContractReceiver, binaryContractBeforeItWasDecreasedBetweenSenderAndMediator, amountBetweenSenderAndMediator, binaryContractBeforeItWasDecreasedBetweenMediatorAndReceiver, amountBetweenMediatorAndReceiver) {
    /**
     * Asserts that a debt was rotated successfully.
     * 
     * This function:
     *      Makes sure all debt rotation requests were removed
     *      Asserts the new BinaryContract is valid
     *      Asserts that the other two binary contracts (Sender -> Mediator & Mediator -> Receiver)
     *                                                     were decreased according to the request. 
    */

    let requestsOfMediator = await profileContractMediator.methods.getAllExchanges().call();
    let requestsOfSender = await profileContractSender.methods.getAllExchanges().call();
    let requestsOfReceiver = await profileContractReceiver.methods.getAllExchanges().call();

    [requestsOfMediator, requestsOfSender, requestsOfReceiver].forEach(requestsOfProfile => {
        assert.strictEqual(requestsOfProfile.length, 0);
    });

    let senderLastBinaryContractAddress = await profileContractSender.methods.getLastContract().call();
    let lastBinaryContract = getContractReferenceInstance(compiledBinaryContract, senderLastBinaryContractAddress);
    let amountToRotate = await lastBinaryContract.methods.getCurrentDebtAmount().call();
    await assertBinaryCurrentDebt(lastBinaryContract, getAddress(profileContractReceiver), amountToRotate, getAddress(profileContractSender));

    await assertContractWasDecreased(amountBetweenSenderAndMediator, binaryContractBeforeItWasDecreasedBetweenSenderAndMediator, amountToRotate);

    await assertContractWasDecreased(amountBetweenMediatorAndReceiver, binaryContractBeforeItWasDecreasedBetweenMediatorAndReceiver, amountToRotate);
}

async function assertBinaryCurrentDebt(binaryContract, debtor, amount, creditor) {
    /**
     * CurrentDebt includes debtor, amount and creditor.
     * This function asserts a given binaryContract's currentDebt has the provided ones.
    */

    let amountAsAString = String(amount);
    let currentDebt = await binaryContract.methods.getCurrentDebt().call();
    assert.strictEqual(debtor, currentDebt.debtor);
    assert.strictEqual(creditor, currentDebt.creditor);
    assert.strictEqual(amountAsAString, currentDebt.amountOwned);
}

async function assertContractWasDecreased(amountBeforeDecrease, lastBinaryContract, amountWhichWasRotated) {

    /**
     * Asserts that a binary contract's debt was decreased.
     * 
     * This function makes sure that a certain amount was decreased from a binary contract.
     * 
     * We first check that the contract is invalid in case all it's amount was rotated (an exception will be caught).
     * 
     * If some amount was left, we make sure that it is the expected amount.
    */

    if (amountBeforeDecrease == amountWhichWasRotated) {// Then the current debtAmount is 0, i.e. the contract is invalid.
        try {
            await lastBinaryContract.methods.getCurrentDebt().call();
        } catch (error) {
            let exceptionCause = 'c: VM Exception while processing transaction: revert';
            assert.ok(String(error).includes(exceptionCause)); // assert.throws didn't work
            return;
        }
    }

    let expectedDecreasedAmount = Math.abs(parseInt(amountBeforeDecrease) - parseInt(amountWhichWasRotated));
    let actualDecreasedAmount = await lastBinaryContract.methods.getCurrentDebtAmount().call();
    assert.strictEqual(expectedDecreasedAmount.toString(), actualDecreasedAmount, 'Actual decreased amount in the last binary contract did not match to the expected!');

    // We only check for the amount because we already check all the logic of the binary contract transaction 
    // in the BinaryContract.test.js
}

/***********************************************************************************************/
/********************************** Debt Rotation Part *****************************************/
/***********************************************************************************************/

async function sendDebtRotationRequestsFromLeftToRight(debtRotationRequestSender, profileContractMediator, profileContractSender, profileContractReceiver, providedAmountToPass) {
    /**
     * This method sends the debt rotation request.
     * 
     * It first makes sure that a binary contract exists between the Debtor -> Mediator, and that a binary contract exists 
     * between Mediator -> Creditor as well.
     * 
     * Then it sets the expected status.
     * If the request sender is the Mediator, then the expected status would be:
     *      debtRotationStatus.MediatorAgreed (if there were no debt rotation requests before).
     *      An exception will be thrown if the status is already debtRotationStatus.Done. In that case, 
     *      the mediator should confirm the debt rotation instead of sending another request.
     * 
     * If the request sender is the Creditor/Debtor, then the expected status would be:
     *      debtRotationStatus.CreditorAgreed / DebtorAgreed accordingly, if there were
     *      no other requets before.
     *      debtRotationStatus.Done if Debtor/Creditor accordingly has agreed before.
     * 
     * For all the cases, it finds the last debt rotation index and sends it so it could be removed
     * from their requests list.
     * 
     */

    assert.ok(await doesABinaryContractBetweenLeftToRightExist(profileContractMediator, profileContractSender), "There is no Binary contract between Debtor and Mediator");
    assert.ok(await doesABinaryContractBetweenLeftToRightExist(profileContractMediator, profileContractReceiver), "There is no Binary contract between Mediator and Creditor");

    let lastDebtRotationRequestIndex;
    let status;
    let senderLastRequests = await debtRotationRequestSender.methods.getAllExchanges().call();
    let requestSenderAddress = getAddress(debtRotationRequestSender);
    let creditorAddress = getAddress(profileContractSender);
    let mediatorAddress = getAddress(profileContractMediator);
    let debtorAddress = getAddress(profileContractReceiver);
    let amountToPass = await handleAmountToRotate(profileContractMediator, profileContractSender, profileContractReceiver, providedAmountToPass, debtRotationRequestSender);

    switch (requestSenderAddress) {
        case mediatorAddress:
            if (senderLastRequests.length == 0) // It is the stage where the mediator is only sending the first request 
                status = debtRotationStatus.MediatorAgreed;
            else
                // Throw an exception. For this version, Mediator cannot affect the request after it was sent.
                // If they would like to confirm it, they should use a different method.
                assert(false, "Mediators cannot send a debt rotation request twice.");
            break;
        case creditorAddress:
            status = debtRotationStatus.SenderAgreed;
            break;
        case debtorAddress:
            status = debtRotationStatus.ReceiverAgreed;
            break;
        default:
            assert(false, "Invalid sender in debt rotation request."); // Throw an exception
    }

    lastDebtRotationRequestIndex = findDebtIndex(senderLastRequests, creditorAddress, mediatorAddress, debtorAddress, debtRequestType.debtRotationRequest);

    if (status == debtRotationStatus.MediatorAgreed) {
        assert(undefined == lastDebtRotationRequestIndex, "lastDebtRotationRequestIndex has to be undefined if Mediator sends a debt rotation request");
        lastDebtRotationRequestIndex = noLastDebtRotationRequestIndex;
    }

    await profileContractMediator.methods.addDebtRotationRequestNotRestricted(getAddress(profileContractMediator), getAddress(profileContractSender), getAddress(profileContractReceiver), amountToPass, status, lastDebtRotationRequestIndex)
        .send({ from: accounts[0], gas: "1000000" });
    await profileContractSender.methods.addDebtRotationRequestNotRestricted(getAddress(profileContractMediator), getAddress(profileContractSender), getAddress(profileContractReceiver), amountToPass, status, lastDebtRotationRequestIndex)
        .send({ from: accounts[0], gas: "1000000" });
    await profileContractReceiver.methods.addDebtRotationRequestNotRestricted(getAddress(profileContractMediator), getAddress(profileContractSender), getAddress(profileContractReceiver), amountToPass, status, lastDebtRotationRequestIndex)
        .send({ from: accounts[0], gas: "1000000" });
}

async function handleAmountToRotate(profileContractMediator, profileContractSender, profileContractReceiver, providedAmountToRotate, senderProfileContract) {
    /**
     * Returns the amountToRotate for the required request sender.
     * 
     * This function first asserts that the amount to rotate is greater or equals
     * than the debt amount the sides already have (they cannot rotate bigger amount),
     * and then returns the correct amount to each request sender.
     * The amount that will be returned to both profileContractSender and 
     * profileContractReceiver will be the same initial amount profileContractMediator set.
    */

    let senderMediatorBinaryContract = await getBinaryContractBetween(profileContractSender, profileContractMediator);
    assert.ok(senderMediatorBinaryContract,
        'There is no BinaryContract between Sender %s and Mediator %s',
        await profileContractSender.methods.getName().call(),
        await profileContractMediator.methods.getName().call());

    let mediatorReceiverBinaryContract = await getBinaryContractBetween(profileContractMediator, profileContractReceiver);
    assert.ok(mediatorReceiverBinaryContract,
        'There is no BinaryContract between Mediator %s and Receiver %s',
        await profileContractMediator.methods.getName().call(),
        await profileContractReceiver.methods.getName().call());

    let amountBetweenSenderAndMediator = await senderMediatorBinaryContract.methods.getCurrentDebtAmount().call();
    let amountBetweenMediatorAndReceiver = await mediatorReceiverBinaryContract.methods.getCurrentDebtAmount().call();

    assert(amountBetweenSenderAndMediator >= providedAmountToRotate, 'The provided amountToRotate was not greater or equal to the amount between Sender and Mediator');
    assert(amountBetweenMediatorAndReceiver >= providedAmountToRotate, 'The provided amountToRotate was not greater or equal to the amount between Mediator and Receiver');

    if (getAddress(profileContractMediator) == getAddress(senderProfileContract))
        return providedAmountToRotate;
    else {
        let requestsOfMediator = await profileContractMediator.methods.getAllExchanges().call();
        let mediatorDebtRotationRequestIndex = findDebtIndex(requestsOfMediator, getAddress(profileContractSender), getAddress(profileContractMediator), getAddress(profileContractReceiver), debtRequestType.debtRotationRequest);
        assert.notStrictEqual(undefined, mediatorDebtRotationRequestIndex, 'No debt rotation request was found');
        return requestsOfMediator[mediatorDebtRotationRequestIndex].debtRotation.amount;
    }
}

async function confirmDebtRotationRequestsBetween(profileContractMediator, profileContractSender, profileContractReceiver) {
    /**
     * Confirms debt rotation request between provided sides.
     * 
     * This function confirms a debt rotation request between 3 provided sides.
     * It:
     *      Asserts that each side has a pending debt rotation request
     *      Finds the amount to rotate
     *      Rotates it (deploys a new binaryContract / adds a transaction) between Sender and Receiver
     *      Decreases a debt between Debtor -> Mediator and Mediator -> Creditor
    */

    await assertThereIsADebtRotationRequestBetweenAllSides(profileContractSender, profileContractMediator, profileContractReceiver);

    let requestsOfMediator = await profileContractMediator.methods.getAllExchanges().call();
    let debtRotationRequestIndex = findDebtIndex(requestsOfMediator, getAddress(profileContractSender), getAddress(profileContractMediator), getAddress(profileContractReceiver), debtRequestType.debtRotationRequest);
    assert.notStrictEqual(undefined, debtRotationRequestIndex, 'No debt rotation request was found');
    let amountToRotate = requestsOfMediator[debtRotationRequestIndex].debtRotation.amount;

    await rotateADebtBetweenSenderAndReceiver(profileContractSender, profileContractReceiver, profileContractMediator);

    await decreaseDebtBetweenLeftToRight(profileContractSender, amountToRotate, profileContractMediator);

    await decreaseDebtBetweenLeftToRight(profileContractMediator, amountToRotate, profileContractReceiver);
}

async function assertThereIsADebtRotationRequestBetweenAllSides(profileContractSender, profileContractMediator, profileContractReceiver) {
    assert(await doesADebtRotationRequestBetweenLeftToRightExist(profileContractSender, profileContractMediator), "A debt rotation request does not exist between sender %s and mediator %s", getAddress(profileContractSender), getAddress(profileContractMediator));
    assert(await doesADebtRotationRequestBetweenLeftToRightExist(profileContractMediator, profileContractReceiver), "A debt rotation request does not exist between mediator %s and receiver %s", getAddress(profileContractMediator), getAddress(profileContractReceiver));
    assert(await doesADebtRotationRequestBetweenLeftToRightExist(profileContractSender, profileContractReceiver), "A debt rotation request does not exist between sender %s and receiver %s", getAddress(profileContractSender), getAddress(profileContractReceiver));
}

async function doesADebtRotationRequestBetweenLeftToRightExist(profileContractA, profileContractB) {
    let profileARequests = await profileContractA.methods.getAllExchanges().call();

    for (let index = 0; index < profileARequests.length; index++) {

        let requestsOfA = profileARequests[index];
        let actorsOfDebtRotationRequest = [requestsOfA.debtRotation.debtor, requestsOfA.debtRotation.mediator, requestsOfA.debtRotation.creditor]
        if (actorsOfDebtRotationRequest.includes(getAddress(profileContractB)))
            return true;
    }
    return false;
}

async function rotateADebtBetweenSenderAndReceiver(profileContractSender, profileContractReceiver, profileContractMediator) {

    /**
     * Rotates a debt from Mediator to Sender and Receiver / Debtor and Creditor.
     * 
     * This function gets the amount to rotate, rotates the debts (it might deploy a new binaryContract
     * or add a transaction to an existed one), and then removes the request from requests lists
     * of all sides (Creditor and Debtor in the confirmDebtRotationRequestFromLeftToRight function).
    */

    let requestsOfSender = await profileContractSender.methods.getAllExchanges().call();
    let senderDebtRotationRequestIndex = findDebtIndex(requestsOfSender, getAddress(profileContractSender), getAddress(profileContractMediator), getAddress(profileContractReceiver), debtRequestType.debtRotationRequest);
    assert.notStrictEqual(undefined, senderDebtRotationRequestIndex, 'No debt rotation request was found');
    let amountToRotate = requestsOfSender[senderDebtRotationRequestIndex].debtRotation.amount;
    assert(amountToRotate > 0, 'amountToRotate might be undefined or smaller or equal to 0');

    await confirmDebtRotationRequestFromLeftToRight(profileContractSender, profileContractMediator, profileContractReceiver, amountToRotate);
    // Remove the exchange from Mediator
    let requestsOfMediator = await profileContractMediator.methods.getAllExchanges().call();
    let mediatorDebtRotationRequestIndex = findDebtIndex(requestsOfMediator, getAddress(profileContractSender), getAddress(profileContractMediator), getAddress(profileContractReceiver), debtRequestType.debtRotationRequest);
    assert.notStrictEqual(undefined, mediatorDebtRotationRequestIndex, 'No debt rotation request was found');
    let indexIsANumber = !isNaN(mediatorDebtRotationRequestIndex);
    assert(indexIsANumber, 'No debt rotation requests were found in Mediator\'s requests!!');
    await profileContractMediator.methods.confirmDebtRotationRequest(mediatorDebtRotationRequestIndex).send({ from: accounts[0], gas: "2000000" });
}

async function confirmDebtRotationRequestFromLeftToRight(profileContractSender, profileContractMediator, profileContractReceiver, amountToRotate) {
    await confirmDebtRequestFromLeftToRight(profileContractSender, amountToRotate, profileContractReceiver, debtRequestType.debtRotationRequest, profileContractMediator);
}

async function decreaseDebtBetweenLeftToRight(profileContractA, amountToRotate, profileContractB) {

    /**
     * Decreases a debt and removes the contract if it becomes invalid.
     * 
     * This function decreases the debt amount between 2 sides (A and B).
     * If the amount left is 0, the contract will become invalid and will be
     * removed from both of the sides (an exception will be caught when the contract
     * will be called).
    */

    let binaryContractBetweenAToB = await getBinaryContractBetween(profileContractA, profileContractB);
    assert.ok(binaryContractBetweenAToB,
        'There is no BinaryContract between profileA %s and profileB %s',
        await profileContractSender.methods.getName().call(),
        await profileContractReceiver.methods.getName().call());

    await binaryContractBetweenAToB.methods.decreaseDebt(amountToRotate).send({ from: accounts[0], gas: "1000000" });
    try { // If we get an error (i.e. the contract is invalid - because the debt is 0), so delete it from both profiles
        await binaryContractBetweenAToB.methods.getAllTransations().call();
    }
    catch (error) {
        let exceptionCause = 'c: VM Exception while processing transaction: revert';
        assert.ok(String(error).includes(exceptionCause)); // assert that contract is invalid and it is not just any error
        await removeInvalidContractFrom([profileContractA, profileContractB], getAddress(binaryContractBetweenAToB));
    }
}

async function removeInvalidContractFrom(listOfProfiles, contractToRemoveAddress) {
    /**
     * Removes a contract from each profileContract in the list.
    */

    for (const currentProfile of listOfProfiles) {

        let currentProfileContracts = await currentProfile.methods.getContracts().call();
        for (let index = 0; index < currentProfileContracts.length; index++) {

            currentProfileContractAddress = currentProfileContracts[index];
            if (currentProfileContractAddress == contractToRemoveAddress)
                await currentProfile.methods.removeContract(index).send({ from: accounts[0], gas: "1000000" });
        }
    }
}

async function getDebtRotationOptionsFor(profileContractMediator) {
    /**
     * Gets the debt rotation options for a profileContract.
     * 
     * Returns the options as a list of "CurrentDebt".
     * I.e. 
     * [
            {
                debtor: '0x9d28e2B6659B2FC72F31E62f918C773812627229',
                creditor: '0xEd1Ed07Cd39D2a6a39411d84f742C176E97b2996',
                amount: 6
            },{
                debtor: '0x172acf27f7Ddf08CE196810CbcEcd6879f0f614B',
                creditor: '0x575BBE81508e73f37b18120D469E4B1Db4De41e2',
                amount: 8
            },
        ]

        That list means the Mediator owes 6 to first Creditor and first Debtor owes 6 to Mediator.
        Same for the second one, but with 8.
    */

    let debtsOfMediator = [];
    let creditsOfMediator = [];

    let binaryContractAddresses = await profileContractMediator.methods.getContracts().call();
    assert(binaryContractAddresses.length > 0, 'Mediator did not have any binary contract');
    for (const contractAddress of binaryContractAddresses) {
        const contract = getContractReferenceInstance(compiledBinaryContract, contractAddress);
        let currentDebt = await contract.methods.getCurrentDebt().call();
        if (currentDebt.debtor !== getAddress(profileContractMediator)) // Mediator is the creditor
            creditsOfMediator.push(currentDebt); // people who owe money to the Mediator
        else
            debtsOfMediator.push(currentDebt); // people who the Mediator owes money to
    }

    rv = [];
    for (const currentDebtForMediator of creditsOfMediator) // for each person who owes money to Mediator
        for (const currentDebtAgainstMediator of debtsOfMediator) // for each person who the Mediator owes money to 
            rv.push(
                {
                    debtor: currentDebtForMediator.debtor,
                    creditor: currentDebtAgainstMediator.creditor,
                    amount: Math.min(currentDebtForMediator.amountOwned, currentDebtAgainstMediator.amountOwned),
                }
            );

    return rv;
}

function getDebtRotationOption(arrayOfOptions, senderAddress, receiverAddress) {
    /**
     * Gets the debt rotation amount between senderAddress, and receiverAddress.
    */

    return arrayOfOptions.filter(({ debtor, creditor }) =>
        creditor == senderAddress && debtor == receiverAddress
    )[0].amount;
}

function compare(a, b) {
    if (a.amount < b.amount) return 1;
    if (b.amount < a.amount) return -1;
    return 0;
}

function getXBiggestDebtRotationOptions(arrayOfOptions, X) {
    return arrayOfOptions.sort(compare).slice(0, X);
}

/***********************************************************************************************/
/********************************** Helper Methods - non debt ROTATION specific ****************/
/***********************************************************************************************/

async function doesABinaryContractBetweenLeftToRightExist(profileContractA, profileContractB) {
    let profileAContractAddresses = await profileContractA.methods.getContracts().call();

    for (var i = 0; i < profileAContractAddresses.length; i++) {
        let currentBinaryContract = getContractReferenceInstance(compiledBinaryContract, profileAContractAddresses[i]);
        let currentDebtOfCurrentBinaryContract = await currentBinaryContract.methods.getCurrentDebt().call();
        let accountsOfTransaction = [getAddress(profileContractA), getAddress(profileContractB)];

        if (accountsOfTransaction.includes(String(currentDebtOfCurrentBinaryContract.debtor)) && accountsOfTransaction.includes(String(currentDebtOfCurrentBinaryContract.creditor))) {
            // it means that the contract already exist
            return true;
        }
    }
    return false;
}

function findDebtIndex(senderRequestsWrapper, moneySenderAddress, mediatorAddress, moneyReceiverAddress, providedDebtRequestType) {
    /**
     * Finds the debt (request/rotationRequest) index in a given list of requets.
    */

    for (let index = 0; index < senderRequestsWrapper.length; index++) {
        let currentRequestActors;
        let currentSenderRequest = senderRequestsWrapper[index];

        switch (providedDebtRequestType) {
            case debtRequestType.debtRequest: // debt request
                currentRequestActors = [currentSenderRequest.transaction.to, currentSenderRequest.transaction.from];
                var transactionFromMatches = currentRequestActors.includes(moneySenderAddress);
                var transactionToMatches = currentRequestActors.includes(moneyReceiverAddress);
                assert.strictEqual(undefined, mediatorAddress, "A mediator address should not be sent in debtRequest scenario");
                if (transactionFromMatches && transactionToMatches)
                    return index;
                break;

            case debtRequestType.debtRotationRequest: // debt rotation request
                currentRequestActors = [currentSenderRequest.debtRotation.creditor, currentSenderRequest.debtRotation.mediator, currentSenderRequest.debtRotation.debtor];
                var debtorMatches = currentRequestActors.includes(moneySenderAddress);
                var mediatorMatches = currentRequestActors.includes(mediatorAddress);
                var creditorMatches = currentRequestActors.includes(moneyReceiverAddress);
                if (debtorMatches && mediatorMatches && creditorMatches)
                    return index;
                break;

            default:
                assert(false, "A wrong debtRequestType was sent as a parameter"); // throw an exception
        }
    }
}

async function getBinaryContractBetween(profileContractA, profileContractB) {
    /**
     * This function gets a BinaryContract between 2 profileContracts.
     * If there is no such BinaryContract, it returns undefined.
    */

    let contractsOfA = await profileContractA.methods.getContracts().call();
    for (const binaryContractAddress of contractsOfA) {
        let binaryContract = getContractReferenceInstance(compiledBinaryContract, binaryContractAddress);

        let currentDebtor = await binaryContract.methods.getCurrentDebtorAddress().call();
        let currentCreditor = await binaryContract.methods.getCurrentCreditorAddress().call();

        let isCurrentDebtorPlayerAAndCurrentCreditorPlayerB = currentDebtor == getAddress(profileContractA) && currentCreditor == getAddress(profileContractB);
        let isCurrentDebtorPlayerBAndCurrentCreditorPlayerA = currentDebtor == getAddress(profileContractB) && currentCreditor == getAddress(profileContractA);

        if (isCurrentDebtorPlayerAAndCurrentCreditorPlayerB || isCurrentDebtorPlayerBAndCurrentCreditorPlayerA)
            return binaryContract
    };
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

async function deployABinaryContract(senderProfileContract, amountToPass, receiverProfileContract) {
    await senderProfileContract.methods
        .createBinaryContract(
            getAddress(senderProfileContract),
            amountToPass,
            getAddress(receiverProfileContract)
        )
        .send({
            from: accounts[0],
            gas: "4000000",
        });
}

async function confirmDebtFromLeftToRight(profileContractA, amountToPass, profileContractB) {
    /**
     * Confirms a debt between 2 sides (Note: not a debt rotation).
    */

    await sendDebtRequestsFromLeftToRight(profileContractA, amountToPass, profileContractB);
    await confirmDebtRequestFromLeftToRight(profileContractA, amountToPass, profileContractB, debtRequestType.debtRequest, undefined);
}

async function sendDebtRequestsFromLeftToRight(profileContractA, amountToPass, profileContractB) {
    await profileContractA.methods.addDebtRequest(getAddress(profileContractB), getAddress(profileContractA), amountToPass, getAddress(profileContractB))
        .send({ from: accounts[0], gas: "1000000" });
    await profileContractB.methods.addDebtRequestNotRestricted(getAddress(profileContractA), getAddress(profileContractA), amountToPass, getAddress(profileContractB))
        .send({ from: accounts[0], gas: "1000000" });
}

async function confirmDebtRequestFromLeftToRight(profileContractA, amountToPass, profileContractB, providedDebtRequestType, profileContractMediator) {

    /**
     * Confirms a debt request / debt rotation request between provided sides.
     * 
     * This function deploys a new contract / adds a transaction between A and B in debt request scenario,
     *                                 or Sender & Recevier / Creditor & Debtor in debt rotation scenario,
     * and then removes the request.
     */

    let contractExisted = await doesABinaryContractBetweenLeftToRightExist(profileContractA, profileContractB);

    if (contractExisted) {
        let existedBinaryContract = await getBinaryContractBetween(profileContractA, profileContractB);
        await addTransaction(existedBinaryContract, profileContractA, amountToPass, profileContractB);
    } else
        await deployABinaryContract(profileContractA, amountToPass, profileContractB);

    // we assign a zeroAddress if the contract already existed. Otherwise, the deployed contract address
    let newContractAddress = contractExisted ? await profileContractA.methods.getZeroAddress().call() : await profileContractA.methods.getLastContract().call();
    let requestsOfA = await profileContractA.methods.getAllExchanges().call();
    let requestsOfB = await profileContractB.methods.getAllExchanges().call();

    switch (providedDebtRequestType) {

        case debtRequestType.debtRequest: // debt request case
            let debtRequestIndex = findDebtIndex(requestsOfA, getAddress(profileContractA), undefined, getAddress(profileContractB), debtRequestType.debtRequest);
            assert.notStrictEqual(undefined, debtRequestIndex, 'No debt rotation request was found');
            profileContractA.methods.confirmDebtRequest(debtRequestIndex) // We know that it is 0 index only because it is testing env
                .send({ from: accounts[0], gas: "2000000" });

            debtRequestIndex = findDebtIndex(requestsOfB, getAddress(profileContractA), undefined, getAddress(profileContractB), debtRequestType.debtRequest);
            assert.notStrictEqual(undefined, debtRequestIndex, 'No debt rotation request was found');
            profileContractB.methods.confirmDebtRequestNotRestricted(debtRequestIndex, newContractAddress) // We know that it is 0 index only because it is testing env
                .send({ from: accounts[0], gas: "2000000" });
            break;

        case debtRequestType.debtRotationRequest: // debt rotation request case
            let debtRotationRequestIndex = findDebtIndex(requestsOfA, getAddress(profileContractA), getAddress(profileContractMediator), getAddress(profileContractB), debtRequestType.debtRotationRequest);
            assert.notStrictEqual(undefined, debtRotationRequestIndex, 'No debt rotation request was found');
            profileContractA.methods.confirmDebtRotationRequest(debtRotationRequestIndex) // We know that it is 0 index only because it is testing env
                .send({ from: accounts[0], gas: "2000000" });

            debtRotationRequestIndex = findDebtIndex(requestsOfB, getAddress(profileContractA), getAddress(profileContractMediator), getAddress(profileContractB), debtRequestType.debtRotationRequest);
            assert.notStrictEqual(undefined, debtRotationRequestIndex, 'No debt rotation request was found');
            profileContractB.methods.confirmDebtRotationRequestNotRestricted(0, newContractAddress) // We know that it is 0 index only because it is testing env
                .send({ from: accounts[0], gas: "2000000" });
            break;
        default:
            assert(false, "A wrong debtRequestType was sent as a parameter"); // throw an exception
            break;
    }
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

function getContractReferenceInstance(compiledContract, address) {
    /**
     * Creates an instace of a contract (it receives an address and ABI and returns an instance).
    */

    return new web3.eth.Contract(
        JSON.parse(compiledContract.interface),
        address
    );
}