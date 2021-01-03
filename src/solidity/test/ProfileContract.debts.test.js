const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());
const { assertRequest, getAddress, RequestPurpose } = require('./Utils');

const compiledProfileContract = require('../build/ProfileContract.json');

let accounts;
let profileContractA;
let profileContractB;
let binaryContractA;
let binaryContractB;
let amountToPass = "6";

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    profileContractA = await deployAProfileContract();

    profileContractB = await deployAProfileContract();
});

describe('ProfileContracts API method tests', () => {

    it('test add debt requests', async () => {
        await sendDebtRequestsFromLeftToRight(profileContractA, profileContractB);

        let exchangesOfA = await profileContractA.methods.getAllExchanges().call();
        let exchangesOfB = await profileContractB.methods.getAllExchanges().call();

        assertDebtRequest(exchangesOfA, getAddress(profileContractA), getAddress(profileContractB), getAddress(profileContractA), getAddress(profileContractB), amountToPass);
        assertDebtRequest(exchangesOfB, getAddress(profileContractA), getAddress(profileContractB), getAddress(profileContractA), getAddress(profileContractB), amountToPass);
    });

    // it('test friend confirmations', async () => {

    //     // Note: the order matters!! leftToRight !== rightToLeft
    //     await sendFriendRequestsFromLeftToRight(profileContractA, profileContractB);
    //     await confirmFriendRequestsFromLeftToRight(profileContractA, profileContractB);

    //     let friendsOfA = await profileContractA.methods.getFriends().call();
    //     let friendsOfB = await profileContractB.methods.getFriends().call();
    //     assert.strictEqual(getAddress(profileContractB), friendsOfA[0], "B is not on A's friends list in index 0");
    //     assert.strictEqual(getAddress(profileContractA), friendsOfB[0], "A is not on B's friends list in index 0");
    // });

    // it('test friend confirmations', async () => {

    //     // Note: the order matters!! leftToRight !== rightToLeft
    //     // making friends when A is the sender and B is the confirmer
    //     await sendFriendRequestsFromLeftToRight(profileContractA, profileContractB);
    //     await confirmFriendRequestsFromLeftToRight(profileContractA, profileContractB);

    //     let friendsOfA = await profileContractA.methods.getFriends().call();
    //     let friendsOfB = await profileContractB.methods.getFriends().call();
    //     assert.strictEqual(getAddress(profileContractB), friendsOfA[0], "B is not on A's friends list in index 0");
    //     assert.strictEqual(getAddress(profileContractA), friendsOfB[0], "A is not on B's friends list in index 0");
    // });
});

// describe('ProfileContracts Scenario methods tests', () => {

//     it('test friend confirmations, deletions and confirmations again', async () => {

//         let times = 2;

//         for (let i = 0; i < times; i++) {
//             // Note: the order matters!! leftToRight !== rightToLeft
//             // making friends when A is the sender and B is the confirmer
//             await sendFriendRequestsFromLeftToRight(profileContractA, profileContractB);
//             await confirmFriendRequestsFromLeftToRight(profileContractA, profileContractB);

//             // making friends when B is the sender and A is the confirmer
//             await sendFriendRequestsFromLeftToRight(profileContractB, profileContractA);
//             await confirmFriendRequestsFromLeftToRight(profileContractB, profileContractA);

//             // asserting that both of them have completed the 2 requests successfully
//             let friendsOfA = await profileContractA.methods.getFriends().call();
//             let friendsOfB = await profileContractB.methods.getFriends().call();

//             assert.strictEqual(getAddress(profileContractB), friendsOfA[0], "B is not on A's friends list in index 0");
//             assert.strictEqual(getAddress(profileContractB), friendsOfA[1], "B is not on A's friends list in index 1");

//             assert.strictEqual(getAddress(profileContractA), friendsOfB[0], "A is not on B's friends list in index 0");
//             assert.strictEqual(getAddress(profileContractA), friendsOfB[1], "A is not on B's friends list in index 1");

//             // removing all their friends
//             await profileContractA.methods.removeAllFriends()
//                 .send({ from: accounts[0], gas: "1000000" });
//             await profileContractB.methods.removeAllFriends()
//                 .send({ from: accounts[0], gas: "1000000" });

//             friendsOfA = await profileContractA.methods.getFriends().call();
//             friendsOfB = await profileContractB.methods.getFriends().call();

//             assert.strictEqual(friendsOfA.length, 0);
//             assert.strictEqual(friendsOfB.length, 0);
//         }
//     });
// });

// async function confirmFriendRequestsFromLeftToRight(profileContractA, profileContractB) {
//     // finding the friendRequest index of the request we just sent in B's pending friends list
//     let friendRequestsOfB = await profileContractB.methods.getAllExchanges().call();
//     let friendRequestIndexInFriendsOfB = -1;

//     for (let index = 0; index < friendRequestsOfB.length; index++) {
//         const friendRequest = friendRequestsOfB[index];

//         if ( // if it is a friendRequest and the source is my friend
//             friendRequest.exchangePurpose === RequestPurpose['AddFriend'] &&
//             friendRequest.exchangeDetails.source === getAddress(profileContractA)
//         ) {
//             friendRequestIndexInFriendsOfB = index;
//             break;
//         }
//     }
//     assert.notStrictEqual(-1, friendRequestIndexInFriendsOfB, "Could not find the friend request of the friend.");

//     // confirming the friend request
//     await profileContractA.methods.confirmFriendRequest(0,)
//         .send({ from: accounts[0], gas: "1000000" });
//     await profileContractB.methods.confirmFriendRequestNotRestricted(friendRequestIndexInFriendsOfB)
//         .send({ from: accounts[0], gas: "1000000" });
// }

function assertDebtRequest(requestWrapper, source, destination, transactionFrom, transactionTo, transactionAmount) {
    assertRequest(requestWrapper, source, destination, "addDebtRequest", "0", RequestPurpose['AddDebt'], transactionFrom, transactionTo, transactionAmount);
}
async function sendDebtRequestsFromLeftToRight(profileContractA, profileContractB){
    await profileContractA.methods.addDebtRequest(getAddress(profileContractB), getAddress(profileContractA), amountToPass, getAddress(profileContractB))
        .send({ from: accounts[0], gas: "1000000" });
    await profileContractB.methods.addDebtRequestNotRestricted(getAddress(profileContractA), getAddress(profileContractA), amountToPass, getAddress(profileContractB))
        .send({ from: accounts[0], gas: "1000000" });
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