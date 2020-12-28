import React, { Component } from "react";
import "./App.css";
import web3 from "./web3";
import profileAbi from "./profile";

const playerOne = "0x9D53022395b63A897E5a958881267D4Bd5482a87";

// For testing purposes only!
const playerTwo = "0x5c4cDD31D05325BDe3799237b742F79F8540FEC5";

const compiledBinaryContract = require("./solidity/build/BinaryContract.json");

const profile = new web3.eth.Contract(profileAbi, playerOne);

class Test extends Component {
  state = {
    friendsAddress: "",
    friendRequestIndex: "",
    playerOne: "",
    providedAmount: "",
    playerTwo: "",
    validityInDays: "",
    message: "",
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
      this.state.playerTwo
    );

    makeBatchRequest([ // remove both of the exchanges in a batch request.
      profile.methods.removeAllExchanges().send,
      friendsProfile.methods.removeAllExchanges().send,
    ])
    function makeBatchRequest(calls) {
      let batch = new web3.BatchRequest();

      // let promises = calls.map(call => {
      calls.map(call => {
        return new Promise((res, rej) => {
          let req = call.request({ from: accounts[0], gas: "2000000" }, (err, data) => {
            if (err) rej(err);
            else res(data)
          });
          batch.add(req)
        })
      })
      batch.execute()
    }

    console.log(await profile.methods.getAllExchanges().call());
    console.log(await friendsProfile.methods.getAllExchanges().call());
  };

  //////////////////////////////////////////////////////////////////////////////////////
  // Remove Contracts list for both our contracts and friend contracts
  onRemoveContractsList = async (event) => {
    event.preventDefault();

    // Getting accounts list
    const accounts = await web3.eth.getAccounts();

    // Getting a reference to a friendsProfile
    const friendsProfile = new web3.eth.Contract(
      profileAbi,
      this.state.playerTwo
    );

    makeBatchRequest([ // remove both of the exchanges in a batch request.
      profile.methods.removeContracts().send,
      friendsProfile.methods.removeContracts().send,
    ])
    function makeBatchRequest(calls) {
      let batch = new web3.BatchRequest();

      // let promises = calls.map(call => {
      calls.map(call => {
        return new Promise((res, rej) => {
          let req = call.request({ from: accounts[0], gas: "2000000" }, (err, data) => {
            if (err) rej(err);
            else res(data)
          });
          batch.add(req)
        })
      })
      batch.execute()
    }

    console.log(await profile.methods.getContracts().call());
    console.log(await friendsProfile.methods.getContracts().call());
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
      .addFriendRequestNotRestricted(playerOne)
      .send({ from: accounts[0], gas: 1000000 });

    let friendsExchanges = await friendsProfile.methods
      .getAllExchanges()
      .call();

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
    console.log("Making sure our exchangesList is empty:");
    console.log(ourExchanges);

    const ourfriends = await profile.methods.getFriends().call();
    console.log("Making sure friendsList is not empty:");
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
      if (
        friendExchange.exchangePurpose === "0" &&
        friendExchange.exchangeDetails.source === this.state.friendsAddress
      ) {
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
    const friendsCurrentFriendsList = await friendsProfile.methods
      .getFriends()
      .call();
    console.log(friendsCurrentFriendsList);
  };
  //////////////////////////////////////////////////////////////////////////////////////

  // TODO: make the addRequest contain also the parameters (a user should see to which debt s/he confirms)

  // Add a debt request for both our exchanges and target exchanges
  onSubmitAddDebtRequest = async (event) => {
    event.preventDefault();

    // Getting accounts list
    const accounts = await web3.eth.getAccounts();

    // Getting a reference to a friendsProfile
    const friendsProfile = new web3.eth.Contract(
      profileAbi,
      this.state.playerTwo
    );

    makeBatchRequest([ // add both of the exchanges in a batch request.
      profile.methods.addDebtRequest(this.state.playerTwo, this.state.playerOne, this.state.providedAmount, this.state.playerTwo).send,
      friendsProfile.methods.addDebtRequestNotRestricted(this.state.playerOne, this.state.playerOne, this.state.providedAmount, this.state.playerTwo).send,
    ])
    function makeBatchRequest(calls) {
      let batch = new web3.BatchRequest();

      // let promises = calls.map(call => {
      calls.map(call => {
        return new Promise((res, rej) => {
          let req = call.request({ from: accounts[0], gas: "1000000" }, (err, data) => {
            if (err) rej(err);
            else res(data)
          });
          batch.add(req)
        })
      })
      batch.execute()
    }

    console.log(await profile.methods.getAllExchanges().call());
    console.log(await friendsProfile.methods.getAllExchanges().call());
  };

  //////////////////////////////////////////////////////////////////////////////////////

  // Confirm a debt request for both our exchanges and target exchanges
  onSubmitConfirmDebtRequest = async (event) => {
    event.preventDefault();

    // Getting accounts list
    const accounts = await web3.eth.getAccounts();

    // Setting playerOne/Two and amount from the request details:
    let myExchanges = await profile.methods.getAllExchanges().call();
    let choosenRequest = myExchanges[0]; // TODO: NOTE!! this is for testing only! In the project the user will pick the correct one
    // console.log(choosenRequest.transaction);
    this.setState({ playerTwo: choosenRequest.transaction.from });
    this.setState({ playerOne: choosenRequest.transaction.to });
    this.setState({ providedAmount: choosenRequest.transaction.amount });

    let myContracts = await profile.methods.getContracts().call();

    let existdContractAddress; // if a contract was deployed, it will be null, and deployedContractAddress will have
    // the addrees and vice versa.
    let deployedContractAddress; // If the contract doesn't exist, == newContractAddress, else == playerOne(0)
    let contractExists = false;
    for (var i = 0; i < myContracts.length; i++) {
      let currentBinaryContract = await new web3.eth.Contract(
        JSON.parse(compiledBinaryContract.interface),
        existdContractAddress = myContracts[i]
      );

      let currentDebtOfCurrentBinaryContract = await currentBinaryContract.methods.getCurrentDebt().call();
      let accountsOfTransaction = [this.state.playerOne, this.state.playerTwo];

      // console.log("current debt of current binary contract:");
      // console.log(currentDebtOfCurrentBinaryContract);

      // console.log("accountsOfTransaction");
      // console.log(accountsOfTransaction);

      // console.log("is currentDebtOfCurrentBinaryContract[0] in accountsOfTransaction?");
      // console.log(currentDebtOfCurrentBinaryContract[0]);
      // console.log(accountsOfTransaction.includes(String(currentDebtOfCurrentBinaryContract[0])));

      // console.log("is currentDebtOfCurrentBinaryContract[2] in accountsOfTransaction?");
      // console.log(currentDebtOfCurrentBinaryContract[2] in accountsOfTransaction);

      // currentDebtOfCurrentBinaryContract[0] == playerOne, [2] == playerTwo. Note: [1] == providedAmount
      if (accountsOfTransaction.includes(String(currentDebtOfCurrentBinaryContract[0])) && accountsOfTransaction.includes(String(currentDebtOfCurrentBinaryContract[2]))) {
        // it means that the contract already exist

        await currentBinaryContract.methods
          .addTransaction(
            this.state.playerOne,
            this.state.providedAmount,
            this.state.playerTwo,
          )
          .send({
            from: accounts[0],
            gas: "2000000",
          });

        contractExists = true;

        // we assign a zeroAddress to deployedContractAddress as it was not deployed (it was already existed)
        // TODO Omer: change move the method from ProfileContract to BinaryContract!!
        deployedContractAddress = await profile.methods.getZeroAddress().call();
        break;
      }
    } // end of for loop

    if (!contractExists) {
      // deploy a binaryContract
      await profile.methods
        .createBinaryContract(
          this.state.playerOne,
          this.state.providedAmount,
          this.state.playerTwo,
        )
        .send({
          from: accounts[0],
          gas: "4000000",
        });

      console.log("Binary contract was created successfully!");

      deployedContractAddress = await profile.methods.getLastContract().call();

      // ** it will not be necessary after the making the BinaryCcontract's constructor call AddTransaction ** //
      // const addresses = await profile.methods.getContracts().call();
      // let binaryContractAddress = addresses[addresses.length - 1];
      // let binaryContract = await new web3.eth.Contract(
      //   JSON.parse(compiledBinaryContract.interface),
      //   binaryContractAddress
      // );

      // await binaryContract.methods
      //   .addTransaction(
      //     playerOne,
      //     6,
      //     playerOne,
      //   )
      //   .send({
      //     from: accounts[0],
      //     gas: "2000000",
      //   });
    }

    let addressToUse;

    if (contractExists) {
      addressToUse = existdContractAddress;
    } else {
      addressToUse = deployedContractAddress;
    }

    let currentBinaryContract = await new web3.eth.Contract(
      JSON.parse(compiledBinaryContract.interface),
      addressToUse
    );

    // console.log(deployedContractAddress);

    console.log("Our currentDebt:");
    console.log(await currentBinaryContract.methods.getCurrentDebt().call());

    let friendsProfile = new web3.eth.Contract(
      profileAbi,
      this.state.playerTwo
    );

    makeBatchRequest([ // remove both of the exchanges in a batch request.

      // We call this method in order to remove our exchange on the profile (solidity)
      // TODO: when implementing it with the actual frontend, we should send the actual index instead of "0"
      profile.methods.confirmDebtRequest(0).send,

      // We call this method in order to remove friend's exchange (solidity method)
      // TODO: when implementing it with the actual frontend, we should send the actual index instead of "0"
      friendsProfile.methods.confirmDebtRequestNotRestricted(0, deployedContractAddress).send,
    ])
    function makeBatchRequest(calls) {
      let batch = new web3.BatchRequest();

      // let promises = calls.map(call => {
      calls.map(call => {
        return new Promise((res, rej) => {
          let req = call.request({ from: accounts[0], gas: "2000000" }, (err, data) => {
            if (err) rej(err);
            else res(data)
          });
          batch.add(req)
        })
      })
      batch.execute()
    }

    // await friendsProfile.methods
    //   .confirmDebtRequestNotRestricted(0, deployedContractAddress)
    //   .send({
    //     from: accounts[0],
    //     gas: "4000000",
    //   });

    // await profile.methods
    //   .confirmDebtRequest(0)
    //   .send({
    //     from: accounts[0],
    //     gas: "4000000",
    //   });




    // // Getting a reference to a friendsProfile
    // const friendsProfile = new web3.eth.Contract(
    //   profileAbi,
    //   this.state.playerTwo
    // );

    // // Sending friend requests
    // await friendsProfile.methods
    //   .addDebtRequestNotRestricted(playerOne)
    //   .send({ from: accounts[0], gas: 1000000 });

    // console.log("debt request was successfully added at friend's profile");

    // // let friendsExchanges = await friendsProfile.methods
    // //   .getAllExchanges()
    // //   .call();

    // // Sending profile requests
    // await profile.methods
    //   .addDebtRequest(this.state.playerOne)
    //   .send({ from: accounts[0], gas: 1000000 });

    // // const ourExchanges = await profile.methods.getAllExchanges().call();

    // // console.log(ourExchanges);
    // // console.log(friendsExchanges);
    // console.log(await profile.methods.getAllExchanges().call());
    // console.log(await friendsProfile.methods.getAllExchanges().call());
  };

  //////////////////////////////////////////////////////////////////////////////////////
  // Testing deploying a contract
  onDeployingAContract = async (event) => {
    event.preventDefault();

    // Getting accounts list
    const accounts = await web3.eth.getAccounts();

    // In case we would like to deploy the contract
    await profile.methods
      .createBinaryContract(
        playerOne,
        4,
        playerOne
      )
      .send({
        from: accounts[0],
        gas: "4000000",
      });

    console.log("Binary contract was created successfully!");

    const addresses = await profile.methods.getContracts().call();
    let binaryContractAddress = addresses[addresses.length - 1];
    let binaryContract = await new web3.eth.Contract(
      JSON.parse(compiledBinaryContract.interface),
      binaryContractAddress
    );

    await binaryContract.methods
      .addTransaction(
        playerOne,
        6,
        playerOne,
        // 6
      )
      .send({
        from: accounts[0],
        gas: "2000000",
      });

    await binaryContract.methods
      .addTransaction(
        playerOne,
        8,
        playerOne,
        // 6
      )
      .send({
        from: accounts[0],
        gas: "2000000",
      });

    console.log("Getting the current debt:");
    console.log(await binaryContract.methods.getCurrentDebt().call());
  };

  //////////////////////////////////////////////////////////////////////////////////////

  // Getting my contracts
  onCheckMyContracts = async (event) => {
    event.preventDefault();

    // Getting accounts list
    const accounts = await web3.eth.getAccounts();

    console.log("your contracts are:");
    console.log(await profile.methods.getContracts().call());
  }

  //////////////////////////////////////////////////////////////////////////////////////

  // Getting my exchanges
  onCheckMyExchanges = async (event) => {
    event.preventDefault();

    // Getting accounts list
    const accounts = await web3.eth.getAccounts();

    console.log("your exchanges are:");
    console.log(await profile.methods.getAllExchanges().call());
  }

  ///////////////////////////////////////////////////////////////////////////////////


  handleChangeFriendAddress = (event) => {
    event.preventDefault();
    this.setState({ friendsAddress: event.target.value });
  };

  handleChangeFriendRequestIndex = (event) => {
    event.preventDefault();
    this.setState({ friendRequestIndex: event.target.value });
  };
  handleChangePlayerOne = (event) => {
    event.preventDefault();
    this.setState({ playerOne: event.target.value });
  };
  handleChangeProvidedAmount = (event) => {
    event.preventDefault();
    this.setState({ providedAmount: event.target.value });
  };
  handleChangePlayerTwo = (event) => {
    event.preventDefault();
    this.setState({ playerTwo: event.target.value });
  };
  // handleChangeValidityInDays = (event) => {
  //   event.preventDefault();
  //   this.setState({ validityInDays: event.target.value });
  // };

  render() {
    return (
      <div>
        <h2>Lottery Contract</h2>
        <hr />

        <form onSubmit={this.onSubmitAddDebtRequest}>
          <label>
            playerOne-amount-playerTwo-0
             <input
              type="text"
              value={this.state.playerOne}
              onChange={this.handleChangePlayerOne}
              name="name"
            />
            <input
              type="text"
              value={this.state.providedAmount}
              onChange={this.handleChangeProvidedAmount}
              name="name"
            />
            <input
              type="text"
              value={this.state.playerTwo}
              onChange={this.handleChangePlayerTwo}
              name="name"
            />
            {/* <input
              type="text"
              value={this.state.validityInDays}
              onChange={this.handleChangeValidityInDays}
              name="name"
            /> */}
          </label>
          <input type="submit" value="Send a Debt Request!" />
          {/* <h1>{this.state.message}</h1> */}
        </form>

        <form onSubmit={this.onCheckMyContracts}>
          <label>
            Click here to check your contracts!
          </label>
          <input type="submit" value="Check your contracts!" />
        </form>

        <form onSubmit={this.onCheckMyExchanges}>
          <label>
            Click here to check your Exchanges!
          </label>
          <input type="submit" value="Check your Exchanges!" />
        </form>

        <form onSubmit={this.onRemoveExchangesList}>
          <label>
            Click here to remove your Exchanges!
          </label>
          <input type="submit" value="Remove your Exchanges!" />
        </form>

        <form onSubmit={this.onRemoveContractsList}>
          <label>
            Click here to remove your Contracts!
          </label>
          <input type="submit" value="Remove your Contracts!" />
        </form>

        <form onSubmit={this.onSubmitConfirmDebtRequest}>
          <label>
            playerOne-amount-playerTwo
             <input
              type="text"
              value={this.state.playerOne}
              onChange={this.handleChangePlayerOne}
              name="name"
            />
            <input
              type="text"
              value={this.state.providedAmount}
              onChange={this.handleChangeProvidedAmount}
              name="name"
            />
            <input
              type="text"
              value={this.state.playerTwo}
              onChange={this.handleChangePlayerTwo}
              name="name"
            />
          </label>
          <input type="submit" value="Confirm a Debt Request!" />
        </form>
      </div>
    );
  }
}

export default Test;
