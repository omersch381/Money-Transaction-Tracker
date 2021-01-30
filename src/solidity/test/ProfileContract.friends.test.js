const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());
const { assertRequest, getAddress, RequestPurpose } = require('./Utils');

const compiledProfileContract = require('../build/ProfileContract.json');

let accounts;
let profileContractA;
let profileContractB;
let profileContractAName = "Omer";
let destinationName = "Dror";

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    profileContractA = await deployAProfileContract(profileContractAName);

    profileContractB = await deployAProfileContract(destinationName);
});

describe('ProfileContracts friends API methods tests', () => {

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

        // Note: the order matters!! leftToRight !== rightToLeft
        // making friends when A is the sender and B is the confirmer
        await sendFriendRequestsFromLeftToRight(profileContractA, profileContractB);
        await confirmFriendRequestsFromLeftToRight(profileContractA, profileContractB);

        let friendsOfA = await profileContractA.methods.getFriends().call();
        let friendsOfB = await profileContractB.methods.getFriends().call();

        assert.strictEqual(getAddress(profileContractB), friendsOfA[0].friendAddress, "B is not on A's friends list in index 0");
        assert.strictEqual(getAddress(profileContractA), friendsOfB[0].friendAddress, "A is not on B's friends list in index 0");
    });
});

describe('ProfileContracts friends scenario methods tests', () => {

    it('test friend confirmations, deletions and confirmations again', async () => {

        let times = 2;
        let sender, receiver;

        for (let i = 0; i < times; i++) {
            // Note: the order matters!! leftToRight !== rightToLeft
            // making friends when A is the sender and B is the confirmer, and then vice versa.

            if (i % 2 == 0) // first time
                sender, receiver = profileContractA, profileContractB;
            else
                sender, receiver = profileContractB, profileContractA;

            await sendFriendRequestsFromLeftToRight(profileContractA, profileContractB);
            await confirmFriendRequestsFromLeftToRight(profileContractA, profileContractB);

            let friendsOfA = await profileContractA.methods.getFriends().call();
            let friendsOfB = await profileContractB.methods.getFriends().call();

            assert.strictEqual(getAddress(profileContractB), friendsOfA[0].friendAddress, "B is not on A's friends list in index 0");
            assert.strictEqual(getAddress(profileContractA), friendsOfB[0].friendAddress, "A is not on B's friends list in index 0");
            assert.strictEqual(await getName(profileContractB), friendsOfA[0].friendName, "B is not on A's friends list in index 0");
            assert.strictEqual(await getName(profileContractA), friendsOfB[0].friendName, "B is not on A's friends list in index 0");

            // removing all their friends
            await profileContractA.methods.removeAllFriends()
                .send({ from: accounts[0], gas: "1000000" });
            await profileContractB.methods.removeAllFriends()
                .send({ from: accounts[0], gas: "1000000" });

            friendsOfA = await profileContractA.methods.getFriends().call();
            friendsOfB = await profileContractB.methods.getFriends().call();

            assert.strictEqual(friendsOfA.length, 0);
            assert.strictEqual(friendsOfB.length, 0);
        }
    });
});

function assertFriendRequest(requestWrapper, source, destination) {
    assertRequest(requestWrapper, source, destination, RequestPurpose['AddFriend']);
}

async function sendFriendRequestsFromLeftToRight(sourceProfileContract, destinationProfileContract) {
    destinationName = await destinationProfileContract.methods.getName().call();
    await sourceProfileContract.methods.addFriendRequest(
        getAddress(destinationProfileContract),
        destinationName,
    ).send({
        from: accounts[0],
        gas: "2000000"
    });

    await destinationProfileContract.methods.addFriendRequestNotRestricted(
        getAddress(sourceProfileContract),
        destinationName,
    ).send({
        from: accounts[0],
        gas: "2000000"
    });
}

async function getName(profileContract){
    return await profileContract.methods.getName().call();
}

async function confirmFriendRequestsFromLeftToRight(profileContractA, profileContractB) {
    // finding the friendRequest index of the request we just sent in B's pending friends list
    let friendRequestsOfA = await profileContractA.methods.getAllExchanges().call();
    let friendRequestIndexInFriendsOfA = -1;

    for (let index = 0; index < friendRequestsOfA.length; index++) {
        const friendRequest = friendRequestsOfA[index];

        if ( // if it is a friendRequest and the source is my friend
            friendRequest.exchangePurpose === RequestPurpose['AddFriend'] &&
            friendRequest.exchangeDetails.destination === getAddress(profileContractB)
        ) {
            friendRequestIndexInFriendsOfA = index;
            break;
        }
    }
    assert.notStrictEqual(-1, friendRequestIndexInFriendsOfA, "Could not find the friend request of the friend.");

    const friendRequest = friendRequestsOfA[friendRequestIndexInFriendsOfA];

    // confirming the friend request
    await profileContractA.methods.confirmFriendRequestNotRestricted(friendRequestIndexInFriendsOfA)
        .send({ from: accounts[0], gas: "1000000" });
    await profileContractB.methods.confirmFriendRequest(0, profileContractAName)
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
            gas: '5000000'
        });
}