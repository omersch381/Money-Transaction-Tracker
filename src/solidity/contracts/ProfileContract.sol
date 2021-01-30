pragma solidity ^0.4.17;
pragma experimental ABIEncoderV2;

contract ProfileContract{

    enum ExchangePurpose{ AddFriend, AddDebt, DebtRotation }

    // MediatorAgreed is when the request was sent but neither the Creditor or the Debtor have agreed (yet)
    // ReceiverAgreed is when both the Meditor and the Creditor have agreed (without the Debtor yet)
    // SenderAgreed is when both the Meditor and the Debtor have agreed (without the Creditor yet)
    // Done is when all of them have agreed -> Note: it doesn't necessarilly mean that the rotation took place!
    enum DebtRotationStatus{ MediatorAgreed, ReceiverAgreed, SenderAgreed, Done }

    struct ExchangeDetails {
        uint exchangeId;
        address source;
        string sourceName;
        address destination;
        string destinationName;
        uint creationDate;
    }

    struct Exchange{
        ExchangeDetails exchangeDetails;
        ExchangePurpose exchangePurpose;
        Transaction transaction;
        DebtRotation debtRotation;
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

     struct DebtRotation {
        address debtor;
        address mediator;
        address creditor;
        DebtRotationStatus status;
        uint amount;
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

    function addExchangeNotRestricted(address source, address destination, string memory destinationName, ExchangePurpose purpose, address sender, uint amount, address receiver, address destination2, DebtRotationStatus status) public{

        // if it runs from my ProfileContract
        if (source == address(0)) {
            source = address(this);
        } else if (destination == address(0)){
            // else - if it runs from other ProfileContract
            destination = address(this);
        }

        if (sender != address(0)){ // Debt request handling
            Transaction memory transaction = Transaction({
            from: sender,
            to: receiver,
            amount: amount,
            date: block.timestamp
        });
        }

        if (destination2 != address(0)) { // Debt Rotation handling
            DebtRotation memory debtRotationRequest = DebtRotation({
                debtor: destination,
                mediator: source,
                creditor: destination2,
                status: status,
                amount: amount
            });
        }

        ExchangeDetails memory newExchangeDetails = ExchangeDetails({
                exchangeId: getExchangeUniqueId(),
                source: source,
                sourceName: ownerName,
                destination: destination,
                destinationName: destinationName,
                creationDate: block.timestamp
            });

        exchangeNum++;

        Exchange memory newExchange = Exchange({
            exchangeDetails: newExchangeDetails,
            exchangePurpose: purpose,
            transaction: transaction,
            debtRotation: debtRotationRequest
        });

        exchanges.push(newExchange);
    }

    // I run for my own ProfileContract
    function addExchange(address source, address destination, string memory destinationName, ExchangePurpose purpose, address sender, uint amount, address receiver, address destination2, DebtRotationStatus status) public returns (Exchange memory) {

        // source == address(0), destination == givenDestination
        addExchangeNotRestricted(source, destination, destinationName,purpose, sender, amount, receiver, destination2, status);
    }

    // Friends functions

    // I run from other's ProfileContract
    function addFriendRequestNotRestricted(address source, string memory destinationName) public{
        // Note: Actor A calls Actor_B's_addFriendRequest method in order to add
        // their (Actor A's) friend request on Actor_B's exchangesList.
        // No actor runs this method for themselves.
        // addExchange automatically assigns source field as this contract address.

        addExchangeNotRestricted(source, address(0), destinationName, ExchangePurpose.AddFriend, address(0), 0, address(0), address(0), DebtRotationStatus.Done);
    }

    // I run for my own ProfileContract
    function addFriendRequest(address destination, string memory destinationName) public{

        // addExchange(source=address(0), destination=givenDestination,...)
        addExchange(address(0), destination, destinationName, ExchangePurpose.AddFriend, address(0), 0, address(0), address(0), DebtRotationStatus.Done);
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

        addExchangeNotRestricted(source, address(0),"", ExchangePurpose.AddDebt, sender, amount, receiver, address(0),DebtRotationStatus.Done);
    }

    // I run for my own ProfileContract
    function addDebtRequest(address destination, address sender, uint amount, address receiver) public{

        // addExchange(source=address(0), destination=givenDestination,...)
        addExchange(address(0), destination, "", ExchangePurpose.AddDebt, sender, amount, receiver, address(0), DebtRotationStatus.Done);
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

    function removeContract(uint index) public {
        if (index >= contracts.length) return;

        // We run that for loop because the only way to delete
        // an item in an array is to pop its last index
        // so we organize the items accordingly
        for (uint i = index; i < contracts.length - 1; i++){
            contracts[i] = contracts[i+1];
        }

        delete contracts[contracts.length - 1];
        contracts.length--;
    }

     // I run from other's ProfileContract
    function addDebtRotationRequestNotRestricted(address mediator, address creditor, address debtor,  uint amount, uint statusAsUint, uint lastDebtRotationRequestIndex) public{
        // enum DebtRotationStatus{ MediatorAgreed, ReceiverAgreed, SenderAgreed, Done }
        DebtRotationStatus currentRequestStatus;
        
        if (statusAsUint == 0){ // I.e. that is the first debt rotation request (from the Mediator)
            currentRequestStatus = DebtRotationStatus.MediatorAgreed;
        }
        else { // Means that there is a "lastDebtRequest" i.e. either the Creditor or the Debtor agrees
            Exchange lastExchange = exchanges[lastDebtRotationRequestIndex]; // we receive lastDebtRotationRequestIndex from the client
            DebtRotationStatus lastRequestStatus = lastExchange.debtRotation.status;
            
            // We check how to proceed with the request:
                // If the creditor is agreeing now and the last status was that the debtor agreed (in the last request),
                // then it means that they are both agreeing now and we consider that request as Done.
            
                // If the creditor is agreeing now and last status was that ONLY the mediator agreed (i.e. the request
                // was just sent by the mediator), so the new status is now ReceiverAgreed.
                
            // It is the same behavior for the debtor.
            
            if (statusAsUint == 1){ // I.e. the creditor is currently agreeing
                if (lastRequestStatus == DebtRotationStatus.SenderAgreed) // which means both have agreed
                    currentRequestStatus = DebtRotationStatus.Done;
                else if (lastRequestStatus == DebtRotationStatus.MediatorAgreed) // only the creditor has agreed so far
                    currentRequestStatus = DebtRotationStatus.ReceiverAgreed;
                else
                    require(false); // if not any of them -> throw an exception.

            } else if (statusAsUint == 2){ //I.e. the debtor is agreeing
                if (lastRequestStatus == DebtRotationStatus.ReceiverAgreed) // which means both have agreed
                    currentRequestStatus = DebtRotationStatus.Done;
                else if (lastRequestStatus == DebtRotationStatus.MediatorAgreed){ // only the debtor has agreed so far
                    currentRequestStatus = DebtRotationStatus.SenderAgreed;
                }
                else
                    require(false); // if not any of them -> throw an exception.
            } else if (statusAsUint == 3)
                currentRequestStatus = DebtRotationStatus.Done;
            else
                require(false); // if not any of them -> throw an exception.
            
        removeExchange(lastDebtRotationRequestIndex);
        }
        addExchangeNotRestricted(mediator, debtor,"", ExchangePurpose.DebtRotation, address(0), amount, address(0), creditor, currentRequestStatus);
    }

    // // I run for my own ProfileContract
    // function addDebtRotationRequest(address mediator, address debtor, address creditor, uint amount, uint statusAsUint, uint lastDebtRotationRequestIndex) public{
    //     // // enum DebtRotationStatus{ MediatorAgreed, ReceiverAgreed, SenderAgreed, Done }
    //     // DebtRotationStatus status;
    //     // if (statusAsUint == 0) // MediatorAgreed
    //     //     status = DebtRotationStatus.MediatorAgreed;
    //     // else if (statusAsUint == 1) // ReceiverAgreed
    //     //     status = DebtRotationStatus.ReceiverAgreed;
    //     // else if (statusAsUint == 2) // SenderAgreed
    //     //     status = DebtRotationStatus.SenderAgreed;
    //     // else if (statusAsUint == 3) // Done
    //     //     status = DebtRotationStatus.Done;
    //     // else
    //     //     require(false); // If not any of them, throw an exception
    //     // // addExchange(source=address(0), destination=givenDestination,...)
    //     // addExchange(address(0), debtor, "", ExchangePurpose.AddDebt, false, address(0), amount, address(0), creditor, status);
        
    //     // addDebtRotationRequestNotRestricted(mediator, debtor, creditor, amount, statusAsUint, lastDebtRotationRequestIndex);
    // }

    // I run for my own ProfileContract
    function confirmDebtRotationRequest(uint debtExchangeIndex) public{
        removeExchange(debtExchangeIndex);
    }

    // I run from other's ProfileContract
    function confirmDebtRotationRequestNotRestricted(uint debtExchangeIndex, address binContractAddress) public {

        // If we just deployed a binaryContract we send it's address (on App.js), else we send address(0)
        // To send an address(0) we can use the getZeroAddress I implemented here
        
        if (binContractAddress != address(0)){ // it means we just deployed a binContract
            contracts.push(binContractAddress);
        }
        removeExchange(debtExchangeIndex);
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

    function addTransaction (address sender, uint amount, address receiver) public ifValid {
        Transaction memory transaction = Transaction({
            from: sender,
            to: receiver,
            amount: amount,
            date: block.timestamp
        });

        binContractTransactionsLog.push(transaction);

        updateContractDebt(sender, amount, receiver);
    }

    function updateContractDebt (address sender, uint amount, address receiver) public ifValid {
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

    function decreaseDebt(uint amountToDecrease) public ifValid {
        addTransaction (currentDebt.debtor, amountToDecrease, currentDebt.creditor);
        
        if (currentDebt.amountOwned == 0)
               finishContract();
    }

    function updateDebtor(address newDebtor) public ifValid {
        currentDebt.debtor = newDebtor;
    }

    function updateCreditor(address newCreditor) public ifValid {
        currentDebt.creditor = newCreditor;
    }

    function getCurrentDebtorAddress() public view ifValid returns(address){
        return currentDebt.debtor;
    }

    // not implemented yet
    //// function getCurrentDebtorName() public view returns(string memory){
    ////     //return currentDebt.debtor name
    //// }

    function getCurrentCreditorAddress() public view ifValid returns(address){
        return currentDebt.creditor;
    }

    // not implemented yet
    //// function getCurrentCreditorName() public view returns(string memory){
    ////     //return currentDebt.creditor name
    //// }

    function getCurrentDebtAmount() public view ifValid returns(uint){
        return currentDebt.amountOwned;
    }

    function getCurrentDebt() public view ifValid returns(ContractDebt){
        return currentDebt;
    }

    function getAllTransations() public view ifValid returns (Transaction[] memory){
        return binContractTransactionsLog;
    }

    function finishContract() public ifValid{
        isValid = false;
    }

    modifier ifValid(){
        require(isValid);
        _;
    }
}