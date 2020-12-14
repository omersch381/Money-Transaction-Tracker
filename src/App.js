import React, { Component } from "react";
import "./App.css";
import web3 from "./web3";
import profileAbi from "./profile";

const address = "0x88DB069e5c8009918e01F1bb78D4821DCD740454";

// For testing purposes only!
const friendsProfileAddress = "0x0d5EBeBdeF7AE42e65EF9AEa69c86Fb2D376f6e3";

const profile = new web3.eth.Contract(profileAbi, address);

class Test extends Component {

  state = {
    friendsAddress: "",
    friendRequestIndex: "",
  };

  async componentDidMount() {
    let ethereum = window.ethereum;
    if (typeof ethereum !== "undefined") {
      await ethereum.enable();
    }
  }
  //////////////////////////////////////////////////////////////////////////////////////
  // Remove Exchanges list for both our exchanges and friend exchanges
  onRemoveExchangesList = async (event) => {
    event.preventDefault();

    // Getting accounts list
    const accounts = await web3.eth.getAccounts();

    // Getting a reference to a friendsProfile
    const friendsProfile = new web3.eth.Contract(
      profileAbi,
      this.state.friendsAddress
    );

    // Sending friend requests
    await friendsProfile.methods
      .removeAllExchanges()
      .send({ from: accounts[0], gas: 1000000 });

    let friendsExchanges = await friendsProfile.methods.getAllExchanges().call();

    // Sending profile requests
    await profile.methods
      .removeAllExchanges()
      .send({ from: accounts[0], gas: 1000000 });

    const ourExchanges = await profile.methods.getAllExchanges().call();

    console.log(ourExchanges);
    console.log(friendsExchanges);
  };

  //////////////////////////////////////////////////////////////////////////////////////

  // Add a friend exchange for both our exchanges and friend exchanges
  onSubmitAddFriendRequest = async (event) => {
    event.preventDefault();

    // Getting accounts list
    const accounts = await web3.eth.getAccounts();

    // Getting a reference to a friendsProfile
    const friendsProfile = new web3.eth.Contract(
      profileAbi,
      this.state.friendsAddress
    );

    // Sending friend requests
    await friendsProfile.methods
      .addFriendRequestNotRestricted(address)
      .send({ from: accounts[0], gas: 1000000 });

    let friendsExchanges = await friendsProfile.methods.getAllExchanges().call();

    // Sending profile requests
    await profile.methods
      .addFriendRequest(this.state.friendsAddress)
      .send({ from: accounts[0], gas: 1000000 });

    const ourExchanges = await profile.methods.getAllExchanges().call();

    console.log(ourExchanges);
    console.log(friendsExchanges);
  };


  //////////////////////////////////////////////////////////////////////////////////////

  // Confirm a friend exchange for both our exchanges and friend exchanges
  onConfirmFriendRequest = async (event) => {
    event.preventDefault();

    // Getting accounts list
    const accounts = await web3.eth.getAccounts();

    // Getting a reference to a friendsProfile
    const friendsProfile = new web3.eth.Contract(
      profileAbi,
      this.state.friendsAddress
    );

    // Handling our exchanges:
    await profile.methods
      .confirmFriendRequest(this.state.friendRequestIndex) // The user presses a V button so we get the index from the user
      .send({ from: accounts[0], gas: 1000000 });

    // for testing
    const ourExchanges = await profile.methods.getAllExchanges().call();
    console.log("Making sure our exchangesList is empty:")
    console.log(ourExchanges);

    const ourfriends = await profile.methods.getFriends().call();
    console.log("Making sure friendsList is not empty:")
    console.log(ourfriends);

    //Handling friend's exchanges:
    let friendExchanges = await friendsProfile.methods.getAllExchanges().call();

    for (let index = 0; index < friendExchanges.length; index++) {
      const friendExchange = friendExchanges[index];

      // I print it for testing
      console.log("Exchange purpose is:");
      console.log(friendExchange.exchangePurpose);
      console.log("Exchange source is:");
      console.log(friendExchange.exchangeDetails.source); // my friend's source
      //TODO: Switch "0" with something clearer, "0" represents addFriendRequest Enum
      if (friendExchange.exchangePurpose === "0" && friendExchange.exchangeDetails.source === this.state.friendsAddress) {
        console.log("success with matching a friend's request");
        await friendsProfile.methods
          .confirmFriendRequestNotRestricted(index)
          .send({ from: accounts[0], gas: 1000000 });
      } else {
        console.log(index + "is not a match");
      }
    }
    // testing
    friendExchanges = await friendsProfile.methods.getAllExchanges().call();
    console.log("friends current exchanges:(supposed to be empty)");
    console.log(friendExchanges);
    console.log("friends current friendsList:(supposed to be not empty)");
    const friendsCurrentFriendsList = await friendsProfile.methods.getFriends().call();
    console.log(friendsCurrentFriendsList);
  };
  //////////////////////////////////////////////////////////////////////////////////////

  // Testing setExchanges
  onSetExchanges = async (event) => {
    event.preventDefault();

    // Getting accounts list
    const accounts = await web3.eth.getAccounts();

    // let myExchanges = await profile.methods.getAllExchanges().call();

    // // Removing all my exchanges (friends and general ones)
    // await profile.methods
    //   .removeAllExchanges()
    //   .send({ from: accounts[0], gas: 1000000 });
    // await profile.methods
    //   .removeAllFriends()
    //   .send({ from: accounts[0], gas: 1000000 });

    // myExchanges = await profile.methods.getAllExchanges().call();

    console.log("My Exchanges:");
    console.log(await profile.methods.getAllExchanges().call());
    console.log("My Friends:");
    console.log(await profile.methods.getFriends().call());

    // let twoTimesMyExchanges = myExchanges.concat(myExchanges);
    // console.log(twoTimesMyExchanges);


    // // Sending friend requests
    // await friendsProfile.methods
    //   .removeAllExchanges()
    //   .send({ from: accounts[0], gas: 1000000 });

    // let friendsExchanges = await friendsProfile.methods.getAllExchanges().call();

    // // Sending profile requests
    // await profile.methods
    //   .removeAllExchanges()
    //   .send({ from: accounts[0], gas: 1000000 });

    // const ourExchanges = await profile.methods.getAllExchanges().call();

    // console.log(ourExchanges);
    // console.log(friendsExchanges);
  };


  handleChangeFriendAddress = (event) => {
    event.preventDefault();
    this.setState({ friendsAddress: event.target.value });
  };

  handleChangeFriendRequestIndex = (event) => {
    event.preventDefault();
    this.setState({ friendRequestIndex: event.target.value });
  };

  render() {
    return (
      <div>
        <h2>Lottery Contract</h2>
        <hr />

        <form onSubmit={this.onSubmitAddFriendRequest}>
          <label>
            Add friend address:
            <input
              type="text"
              value={this.state.friendsAddress}
              onChange={this.handleChangeFriendAddress}
              name="name"
            />
          </label>
          <input type="submit" value="Submit" />
        </form>

        <form onSubmit={this.onRemoveExchangesList}>
          <label>
            Remove Exchanges list:
            <input
              type="text"
              value={this.state.friendsAddress}
              onChange={this.handleChangeFriendAddress}
              name="name"
            />
          </label>
          <input type="submit" value="Remove" />
        </form>

        <form onSubmit={this.onConfirmFriendRequest}>
          <label>
            Confirm a friend request: Enter the friend's address in the left input and the index of the request in the right one
            <input
              type="text"
              value={this.state.friendsAddress}
              onChange={this.handleChangeFriendAddress}
              name="name"
            />
            <input
              type="text"
              value={this.state.friendRequestIndex}
              onChange={this.handleChangeFriendRequestIndex}
              name="name"
            />
          </label>
          <input type="submit" value="Confirm" />
        </form>

        <form onSubmit={this.onSetExchanges}>
          <label>
            Test setExchanges
            {/* <input
              type="text"
              value={this.state.friendRequestIndex}
              onChange={this.handleChangeFriendRequestIndex}
              name="name"
            /> */}
          </label>
          <input type="submit" value="Test it!" />
        </form>

      </div>
    );
  }
}

export default Test;
