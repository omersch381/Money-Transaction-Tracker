const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const compiledProfileContract = require('../build/ProfileContract.json');
const RequestPurpose = {
    AddFriend: "0",
    AddDebt: "1",
    DebtRotation: "2"
};

let accounts;
let profileContractA;
let profileContractB;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    profileContractA = await deployAProfileContract();

    profileContractB = await deployAProfileContract();
});

describe('ProfileContracts API method tests', () => {

    it('deploys 2 profileContracts', () => {
        assert.ok(profileContractA.options.address, "Could not deploy profileContractA's contract");
        assert.ok(profileContractB.options.address, "Could not deploy profileContractB's contract");
    });

    it('test friend requests', async () => {

        // Sends a friend request from profileContractA -> profileContractB
        // Note: this is not an associative operation!!! The order matters!
        await sendFriendRequestsFromLeftToRight(profileContractA, profileContractB);
        let exchangesOfA = await profileContractA.methods.getAllExchanges().call();
        let exchangesOfB = await profileContractB.methods.getAllExchanges().call();

        assertFriendRequest(exchangesOfA, getAddress(profileContractA), getAddress(profileContractB));
        assertFriendRequest(exchangesOfB, getAddress(profileContractA), getAddress(profileContractB));
    });

    it('test friend confirmations', async () => {

        await sendFriendRequestsFromLeftToRight(profileContractA, profileContractB);
        let friendRequestsOfB = await profileContractB.methods.getAllExchanges().call();
        let friendRequestIndex = -1;

        for (let index = 0; index < friendRequestsOfB.length; index++) {
            const friendRequest = friendRequestsOfB[index];

            if ( // if it is a friendRequest and the source is my friend
                friendRequest.exchangePurpose === RequestPurpose['AddFriend'] &&
                friendRequest.exchangeDetails.source === getAddress(profileContractA)
            ) {
                friendRequestIndex = index;
                break;
            }
        }
        assert.notStrictEqual(-1, friendRequestIndex, "Could not find the friend request of the friend.");

        await profileContractA.methods.confirmFriendRequest(0,)
            .send({ from: accounts[0], gas: "1000000" });
        await profileContractB.methods.confirmFriendRequestNotRestricted(friendRequestIndex)
            .send({ from: accounts[0], gas: "1000000" });

        let friendsOfA = await profileContractA.methods.getFriends().call();
        let friendsOfB = await profileContractB.methods.getFriends().call();
        assert.strictEqual(getAddress(profileContractB), friendsOfA[0], "B is not on A's friends list in index 0");
        assert.strictEqual(getAddress(profileContractA), friendsOfB[0], "A is not on B's friends list in index 0");
    });
});

function assertFriendRequest(requestWrapper, source, destination) {
    assertRequest(requestWrapper, source, destination, "addFriendRequest", "0", RequestPurpose['AddFriend']);
}

function assertRequest(requestWrapper, source, destination, optionalDescription, requestType, requestPurpose, transactionFrom, transactionTo, transactionAmount) {
    let request = requestWrapper[0];
    let requestDetails = request.exchangeDetails;
    assert.ok(requestDetails.exchangeId > 0, "A wrong requestId was assigned to the request.");
    assert.strictEqual(source, requestDetails.source, "A wrong source was assigned to the request.");
    assert.strictEqual(destination, requestDetails.destination, "A wrong destination was assigned to the request.");
    assert.strictEqual(optionalDescription, requestDetails.optionalDescription, "A wrong optionalDescription was assigned to the request.");
    assert.strictEqual(requestType, requestDetails.exchangeType, "A wrong requestType was assigned to the request.");
    assert.ok(Date.now() > requestDetails.creationDate, "A wrong creationDate was assigned to the request.");

    assert.strictEqual(requestPurpose, request.exchangePurpose, "A wrong requestPurpose was assigned to the request.");
    assert.strictEqual(false, request.isApproved, "A wrong isApproved was assigned to the request.");
    if (transactionFrom != null) {
        assert.strictEqual(transactionFrom, request.transaction.from, "A wrong transactionFrom was assigned to the request.");
        assert.strictEqual(transactionTo, request.transaction.to, "A wrong transactionTo was assigned to the request.");
        assert.strictEqual(transactionAmount, request.transaction.amount, "A wrong transactionAmount was assigned to the request.");
        assert.ok(Date.now() > request.transaction.date, "A wrong transactionDate was assigned to the request.");
    }
}

async function sendFriendRequestsFromLeftToRight(profileContractA, profileContractB) {
    await profileContractA.methods.addFriendRequest(
        getAddress(profileContractB),
    ).send({
        from: accounts[0],
        gas: "1000000"
    });

    await profileContractB.methods.addFriendRequestNotRestricted(
        getAddress(profileContractA),
    ).send({
        from: accounts[0],
        gas: "1000000"
    });
}

async function deployAProfileContract() {
    return await new web3.eth.Contract(JSON.parse(compiledProfileContract.interface))
        .deploy({
            data: compiledProfileContract.bytecode,
        })
        .send({
            from: accounts[0],
            gas: '3000000'
        });
}

function getAddress(profileContract) {
    return profileContract.options.address;
}