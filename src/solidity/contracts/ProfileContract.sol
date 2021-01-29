pragma solidity ^0.4.17;
pragma experimental ABIEncoderV2;

contract ProfileContract{

    enum ExchangePurpose{ AddFriend, AddDebt, DebtRotation }

    // WE SHOULD ASK THE USER WHAT IS THEIR NAME AND USE IT AS SOURCE_NAME

    struct ExchangeDetails {
        uint exchangeId;
        address source;
        string sourceName;
        address destination;
        string destinationName;
        string optionalDescription;
        uint creationDate;
    }

    struct Exchange{
        ExchangeDetails exchangeDetails;
        ExchangePurpose exchangePurpose;
        Transaction transaction;
        address[] approvers;
        bool isApproved;
    }

    struct Friend{
        address friendAddress;
        string friendName;
    }

    struct Transaction {
        address from;
        address to;
        uint amount;
        uint date;
    }

    uint exchangeNum;
    address owner;
    string ownerName;
    Friend[] private friendsArray;
    address[] private friends;
    Exchange[] private exchanges;
    address[] private contracts; // == [BinaryContract(s)]
    string[] private actionsLog;

    function ProfileContract(string memory name) public {
        owner = msg.sender;
        ownerName = name;
    }

    function getName() public view returns (string memory){
        return ownerName;
    }

    // /*
    // Status includes all the attributes each user has on its ProfileContract.
    // We are having this method so we can update the presented attributes in one API call.

    // //TODO: implement this method as soon as we implement the rest of the things.
    //  */
    // function getMyStatus() public restricted view returns (string[] memory myStatus){
    // }

    // // // ActionsLog section
    // // TODO implement this method as soon as we implement the rest of the things.
    // // function getActionsLog() public restricted view returns(string[] memory){
    // // }

    function removeAllExchanges() public{
        delete exchanges;
    }

    function removeExchange(uint index) public {
        if (index >= exchanges.length) return;

        // We run that for loop because the only way to delete
        // an item in an array is to pop its last index
        // so we organize the items accordingly
        for (uint i = index; i<exchanges.length-1; i++){
            exchanges[i] = exchanges[i+1];
        }

        // exchanges.pop();
        delete exchanges[exchanges.length - 1];
        exchanges.length--;
    }

    function getAllExchanges() external view returns (Exchange[] memory){
        return exchanges;
    }

    function getExchangeUniqueId() public returns (uint){
        exchangeNum += 1;
        return exchangeNum;
    }

    function addExchangeNotRestricted(address source, address destination, string memory destinationName, string memory optionalDescription, ExchangePurpose purpose, address[] memory approvers, bool isApproved, address sender, uint amount, address receiver) public{

        // if it runs from my ProfileContract
        if (source == address(0)) {
            source = address(this);
        } else if (destination == address(0)){
            // else - if it runs from other ProfileContract
            destination = address(this);
        }

        if (sender != address(0)){
            Transaction memory transaction = Transaction({
            from: sender,
            to: receiver,
            amount: amount,
            date: block.timestamp
        });
        }

        ExchangeDetails memory newExchangeDetails = ExchangeDetails({
                exchangeId: getExchangeUniqueId(),
                source: source,
                sourceName: ownerName,
                destination: destination,
                destinationName: destinationName,
                optionalDescription: optionalDescription,
                creationDate: block.timestamp
            });

        exchangeNum++;

        Exchange memory newExchange = Exchange({
            exchangeDetails: newExchangeDetails,
            exchangePurpose: purpose,
            transaction: transaction,
            approvers: approvers,
            isApproved: isApproved
        });

        exchanges.push(newExchange);
    }

    // I run for my own ProfileContract
    function addExchange(address source, address destination, string memory destinationName, string memory optionalDescription, ExchangePurpose purpose, address[] memory approvers, bool isApproved, address sender, uint amount, address receiver) public returns (Exchange memory) {

        // source == address(0), destination == givenDestination
        addExchangeNotRestricted(source, destination, destinationName, optionalDescription,purpose,approvers,isApproved, sender, amount, receiver);
    }

    // Friends functions

    // I run from other's ProfileContract
    function addFriendRequestNotRestricted(address source, string memory destinationName) public{
        // Note: Actor A calls Actor_B's_addFriendRequest method in order to add
        // their (Actor A's) friend request on Actor_B's exchangesList.
        // No actor runs this method for themselves.
        // addExchange automatically assigns source field as this contract address.
        // Note: the 'new address[](0)' means we send 0 approvers for a friend request.

        addExchangeNotRestricted(source, address(0), destinationName, "addFriendRequest", ExchangePurpose.AddFriend, new address[](0), false, address(0), 0, address(0));
    }

    // I run for my own ProfileContract
    function addFriendRequest(address destination, string memory destinationName) public{

        // addExchange(source=address(0), destination=givenDestination,...)
        addExchange(address(0), destination, destinationName, "addFriendRequest", ExchangePurpose.AddFriend, new address[](0), false, address(0), 0, address(0));
    }

    // I run for my own ProfileContract
    // We let the confirmer choose its friend's name
    function confirmFriendRequest(uint friendExchangeIndex, string memory friendName) public{
        Exchange memory exchangeToConfirm = exchanges[friendExchangeIndex];
        Friend memory newFriend = Friend({
            friendAddress: exchangeToConfirm.exchangeDetails.source,
            friendName: friendName
        });
        friendsArray.push(newFriend);
        // friends.push(exchangeToConfirm.exchangeDetails.source);
        removeExchange(friendExchangeIndex);
    }

    function setFriendName(string memory name, address friendAddress){
        //TODO
    }

    // I run from other's ProfileContract
    function confirmFriendRequestNotRestricted(uint friendExchangeIndex) public {
        Exchange memory exchangeToConfirm = exchanges[friendExchangeIndex];
        Friend memory newFriend = Friend({
            friendAddress: exchangeToConfirm.exchangeDetails.destination,
            friendName: exchangeToConfirm.exchangeDetails.destinationName
        });
        friendsArray.push(newFriend);
        // friends.push(exchangeToConfirm.exchangeDetails.destination);
        removeExchange(friendExchangeIndex);
    }

    // for testing only
    function removeAllFriends() public {
        delete friendsArray;
    }

    function getFriends() public view returns (Friend[] memory) {
        return friendsArray;
    }

    function getFriendName(address friendAddress) public returns (string memory name) {
        string memory friendsName = "not found";
        for (uint i=0; i<friendsArray.length; i++)
            if (friendsArray[i].friendAddress == friendAddress)
                friendsName = friendsArray[i].friendName;

        return friendsName;
    }

     // I run from other's ProfileContract
    function addDebtRequestNotRestricted(address source, address sender, uint amount, address receiver) public{
        // Note: Actor A calls Actor_B's_addDebtRequest method in order to add
        // their (Actor A's) Debt request on Actor_B's exchangesList.
        // No actor runs this method for themselves.
        // addExchange automatically assigns source field as this contract address.
        // Note: the 'new address[](0)' means we send 0 approvers for a Debt request.

        addExchangeNotRestricted(source, address(0),"", "addDebtRequest", ExchangePurpose.AddDebt, new address[](0), false, sender, amount, receiver);
    }

    // I run for my own ProfileContract
    function addDebtRequest(address destination, address sender, uint amount, address receiver) public{

        // addExchange(source=address(0), destination=givenDestination,...)
        addExchange(address(0), destination, "", "addDebtRequest", ExchangePurpose.AddDebt, new address[](0), false, sender, amount, receiver);
    }

    // I run for my own ProfileContract
    function confirmDebtRequest(uint debtExchangeIndex) public{
        // We first check on App.js if such a contract exist.
        // If it is not, we create one (using a solidity method written here)
        // If it is, we just addATransaction using the contract reference.
        // Then we continue to the following:

        // Exchange memory exchangeToConfirm = exchanges[debtExchangeIndex];
        removeExchange(debtExchangeIndex);

        // We do not need to push the new contract to contracts[] here as the createBinaryContract handles it
    }

    function getLastContract() public view returns (address){
        return contracts[contracts.length -1];
    }

    function getZeroAddress() public view returns (address){
        return address(0);
    }

    // I run from other's ProfileContract
    function confirmDebtRequestNotRestricted(uint debtExchangeIndex, address binContractAddress) public {

        // If we just deployed a binaryContract we send it's address (on App.js), else we send address(0)
        // To send an address(0) we can use the getZeroAddress I implemented here
        if (binContractAddress != address(0)){ // it means we just deployed a binContract
            contracts.push(binContractAddress);
        }
        // Exchange memory exchangeToConfirm = exchanges[debtExchangeIndex];
        removeExchange(debtExchangeIndex);
    }
    /////////////////////////////////////////////////////////////////////////////////////

    function createBinaryContract(address sender, uint amount, address receiver) public {
        address newBinaryContract = new BinaryContract(sender, amount, receiver);
        contracts.push(newBinaryContract);
    }

    function getContracts() public view returns (address[] memory){
        return contracts;
    }

    // For testing only!!!!!!!!!
    function removeContracts() public {
        delete contracts;
    }

    //  modifier restricted(){
    //     require(msg.sender == owner);
    //     _;
    // }

    //  modifier isAFriend(address person){
    //     bool isAFriendbool = false;
    //     for (uint i=0; i<friendsArray.length; i++) {
    //         if (friendsArray[i].address == person){
    //             isAFriendbool = true;
    //         }
    //     }
    //     require(isAFriendbool == true);
    //     _;
    // }
}

contract BinaryContract{

    struct Transaction {
        address from;
        address to;
        uint amount;
        uint date;
    }

    // We have that struct as it stores the current contract status (the "sum" of all the contract's transactions)
    // It saves power/money for the caller - every time a user adds a debt - it changes the ContractDebt as well
    struct ContractDebt{
        address debtor;
        address creditor;
        uint amountOwned;
    }

    uint creationDate;
    uint validityInDays;
    bool isValid = true;
    address playerOne;
    address playerTwo;

    ContractDebt currentDebt;

    Transaction[] binContractTransactionsLog;

    // E.g. BinaryContract(player1, 2, player2) == deploy a new contract, where player 1 owes 2 shekels to player 2
    function BinaryContract(address providedCreditor, uint amount, address providedDebtor) public{
        playerOne = providedDebtor;
        playerTwo = providedCreditor;

        addTransaction(providedCreditor, amount, providedDebtor);
    }

    function addTransaction (address sender, uint amount, address receiver) public {
        Transaction memory transaction = Transaction({
            from: sender,
            to: receiver,
            amount: amount,
            date: block.timestamp
        });

        binContractTransactionsLog.push(transaction);

        updateContractDebt(sender, amount, receiver);
    }

    function updateContractDebt (address sender, uint amount, address receiver) public {
        if(binContractTransactionsLog.length > 1){ // in the constructor we just pushed the only transaction
            if (currentDebt.debtor != sender){ // means the debtor now in a bigger debt
            currentDebt.amountOwned += amount;
            } else { // means the debtor is the sender
                if (amount > currentDebt.amountOwned){
                     updateDebtor(receiver);
                     updateCreditor(sender);
                     currentDebt.amountOwned =  amount - currentDebt.amountOwned;
                } else{
                    currentDebt.amountOwned -= amount;
                }
            }
        } else {
            currentDebt.debtor = receiver;
            currentDebt.creditor = sender;
            currentDebt.amountOwned = amount;
        }
    }

    function updateDebtor(address newDebtor) public {
        currentDebt.debtor = newDebtor;
    }

    function updateCreditor(address newCreditor) public {
        currentDebt.creditor = newCreditor;
    }

    function getCurrentDebtorAddress() public view returns(address){
        return currentDebt.debtor;
    }

    // not implemented yet
    //// function getCurrentDebtorName() public view returns(string memory){
    ////     //return currentDebt.debtor name
    //// }

    function getCurrentCreditorAddress() public view returns(address){
        return currentDebt.creditor;
    }

    // not implemented yet
    //// function getCurrentCreditorName() public view returns(string memory){
    ////     //return currentDebt.creditor name
    //// }

    function getCurrentDebtAmount() public view returns(uint){
        return currentDebt.amountOwned;
    }

    function getCurrentDebt() public view returns(ContractDebt){
        return currentDebt;
    }

    function getAllTransations() public view returns (Transaction[] memory){
        return binContractTransactionsLog;
    }

    modifier ifValid(){
        if (block.timestamp > creationDate + validityInDays * 1 days){
            isValid = false;
        }
        require(isValid);
        _;
    }
}