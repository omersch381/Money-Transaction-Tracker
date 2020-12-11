import React, { Component } from "react";
import "./App.css";
import web3 from "./web3";
import profileAbi from "./profile";

const address = "0x42F443c1bb0F7386870E736193e8cdB5b5fA1a4D";

const profile = new web3.eth.Contract(profileAbi, address);

class Test extends Component {
  //   state = {
  //     manager: "",
  //     players: [],
  //     balance: "",
  //     value: "",
  //     message: "",
  //   };

  state = {
    friendsAddress: "",
  };

  async componentDidMount() {
    // const manager = await lottery.methods.manager().call();
    // const players = await lottery.methods.getPlayers().call();
    // const balance = await web3.eth.getBalance(lottery.options.address);

    let ethereum = window.ethereum;
    if (typeof ethereum !== "undefined") {
      await ethereum.enable();
    }

    // this.setState({ manager, players, balance });
  }

  onSubmit = async (event) => {
    event.preventDefault();

    const accounts = await web3.eth.getAccounts();

    console.log("here");
    // const exchangeUniqueID = await profile.methods
    // await profile.methods
    //   .addFriendRequest("0x9668fde882D136BCBd549860a68a5e17fddD83d3")
    //   .send({ from: accounts[0], gas: 1000000 });
    const answer = await profile.methods.getAllExchanges().call();

    console.log(answer[0].exchangeDetails);
    // console.log(exchangeUniqueID);
  };

  onSubmitTest = async (event) => {
    event.preventDefault();

    const accounts = await web3.eth.getAccounts();

    const friendsProfile = new web3.eth.Contract(
      profileAbi,
      this.state.friendsAddress
    );
    await friendsProfile.methods
      .addFriendRequestNotRestricted(address)
      .send({ from: accounts[0], gas: 1000000 });

    await profile.methods
      .addFriendRequest(this.state.friendsAddress)
      .send({ from: accounts[0], gas: 1000000 });

    console.log("here passed requests");
    const exchanges = await friendsProfile.methods.getAllExchanges().call();
    console.log("here got his exchange");
    const ourExchanges = await profile.methods.getAllExchanges().call();
    console.log("here got our exchange");
    console.log(ourExchanges);
    console.log(exchanges);
  };

  handleChange = (event) => {
    event.preventDefault();
    this.setState({ friendsAddress: event.target.value });
  };
  //   onSubmit = async (event) => {
  //     event.preventDefault();

  //     const accounts = await web3.eth.getAccounts();

  //     this.setState({ message: "Waiting on transaction success..." });

  //     await lottery.methods.enter().send({
  //       from: accounts[0],
  //       value: web3.utils.toWei(this.state.value, "ether"),
  //     });

  //     this.setState({ message: "you have been entered!" });
  //   };

  //   onClick = async () => {
  //     const accounts = await web3.eth.getAccounts();

  //     this.setState({ message: "Waiting on transaction success..." });

  //     await lottery.methods.pickWinner().send({
  //       from: accounts[0],
  //     });

  //     this.setState({ message: "A winner has been picked!" });
  //   };

  render() {
    return (
      <div>
        <h2>Lottery Contract</h2>
        <p>
          {/* This contract is managed by {this.state.manager}. There are currently{" "}
          {this.state.players.length} people entered, competing to win{" "}
          {web3.utils.fromWei(this.state.balance, "ether")} ether. */}
        </p>

        <hr />

        <form onSubmit={this.onSubmit}>
          <h4>Want to try your luck?</h4>

          <div>
            <label>Amount of ether to enter</label>
            {/* <input
              value={this.state.value}
              onChange={(event) => this.setState({ value: event.target.value })}
            /> */}
          </div>
          <button>Enter</button>
        </form>
        <hr />

        <h4>Ready to pick a winner?</h4>
        {/* <button onClick={this.onClick}>Pick a winner!</button> */}

        <hr />
        {/* <h1>{this.state.message}</h1> */}
        <form onSubmit={this.onSubmitTest}>
          <label>
            Add friend address:
            <input
              type="text"
              value={this.state.friendsAddress}
              onChange={this.handleChange}
              name="name"
            />
          </label>
          <input type="submit" value="Submit" />
        </form>
      </div>
    );
  }
}

export default Test;
