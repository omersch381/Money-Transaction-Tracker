pragma solidity ^0.4.17;
pragma experimental ABIEncoderV2;

// import "./UserPreferences.sol";

contract ProfileContract{

    enum ExchangeType{ Request, Response }

    enum ExchangePurpose{ AddFriend, DebtAddition, DebtRotation }

    struct ExchangeDetails {
        uint exchangeId;
        address source;
        address destination;
        string optionalDescription;
        ExchangeType exchangeType;
        uint creationDate;
    }

    // TODO: decide if we should remove the exchanges after they are done
    struct Exchange{
        ExchangeDetails exchangeDetails;
        ExchangePurpose exchangePurpose;
        address[] approvers;
        bool isApproved;
    }

    struct Friend{
        address friendAddress;
        string friendName;
    }

    // Preferences preferences;
    uint exchangeNum;
    mapping(address => string) friendsName;
    address owner;
    address[] private friends;
    Exchange[] private exchanges;
    address[] private contracts; // == [GroupsContract(s), BinaryContract(s)]
    string[] private actionsLog;

    function ProfileContract() public {
        owner = msg.sender;
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

    // // // Groups section
    // // function createGroup() public restricted{
    // // }

    // // function getGroups() public restricted view returns (address[] memory){
    // // }

    // // Exchanges section
    function getExchangeIndexFromExchangeId(uint exchangeId) public view returns (uint){
        //TODO
    }

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

    function getExchangeFromExchangeId(uint exchangeId) public view returns (Exchange memory){
        //TODO
    }

    function getAllExchanges() public view returns (Exchange[] memory){
        return exchanges;
    }

    function getExchangeUniqueId() public returns (uint){
        exchangeNum += 1;
        return exchangeNum;
    }

    function addExchangeNotRestricted(address source, address destination, string memory optionalDescription, ExchangeType exType, ExchangePurpose purpose, address[] memory approvers, bool isApproved) public{

        // if it runs from my ProfileContract
        if (source == address(0)) {
            source = address(this);
        } else if (destination == address(0)){
            // else - if it runs from other ProfileContract
            destination = address(this);
        }

        //TODO: check if we need the second if statement above

        ExchangeDetails memory newExchangeDetails = ExchangeDetails({
                exchangeId: getExchangeUniqueId(),
                source: source,
                destination: destination,
                optionalDescription: optionalDescription,
                exchangeType: exType,
                creationDate: block.timestamp
            });

        exchangeNum++;

        Exchange memory newExchange = Exchange({
            exchangeDetails: newExchangeDetails,
            exchangePurpose: purpose,
            approvers: approvers,
            isApproved: isApproved
        });

        exchanges.push(newExchange);

        // return newExchange;
    }

    // function setExchanges(Exchange[] memory providedExchanges) public {
    //     exchanges = providedExchanges;
    // }

    // I run for my own ProfileContract
    function addExchange(address source, address destination, string memory optionalDescription, ExchangeType exType, ExchangePurpose purpose, address[] memory approvers, bool isApproved) public returns (Exchange memory) {

        // source == address(0), destination == givenDestination
        addExchangeNotRestricted(source, destination, optionalDescription,exType,purpose,approvers,isApproved);
    }

    // Friends functions

    // I run from other's ProfileContract
    function addFriendRequestNotRestricted(address source) public{
        // Note: Actor A calls Actor_B's_addFriendRequest method in order to add
        // their (Actor A's) friend request on Actor_B's exchangesList.
        // No actor runs this method for themselves.
        // addExchange automatically assigns source field as this contract address.
        // Note: the 'new address[](0)' means we send 0 approvers for a friend request.

        addExchangeNotRestricted(source, address(0), "addFriendRequest", ExchangeType.Request, ExchangePurpose.AddFriend, new address[](0), false);
    }

    // I run for my own ProfileContract
    function addFriendRequest(address destination) public{

        // addExchange(source=address(0), destination=givenDestination,...)
        addExchange(address(0), destination, "addFriendRequest", ExchangeType.Request, ExchangePurpose.AddFriend, new address[](0), false);
    }

    // I run for my own ProfileContract
    function confirmFriendRequest(uint friendExchangeIndex) public{
        Exchange memory exchangeToConfirm = exchanges[friendExchangeIndex];
        friends.push(exchangeToConfirm.exchangeDetails.destination);
        removeExchange(friendExchangeIndex);
    }

    // I run from other's ProfileContract
    function confirmFriendRequestNotRestricted(uint friendExchangeIndex) public {
        Exchange memory exchangeToConfirm = exchanges[friendExchangeIndex];
        friends.push(exchangeToConfirm.exchangeDetails.source);
        removeExchange(friendExchangeIndex);
    }

    // function removeFriend(address friend) public restricted isAFriend(friend) {
    // }

    // for testing only
    function removeAllFriends() public {
        delete friends;
    }

    function getFriends() public view returns (address[] memory) {
        return friends;
    }

    // function getFriendName(address friend) public view restricted returns (string memory name) {
    //     return "TODO";
    // }

    //  modifier restricted(){
    //     require(msg.sender == owner);
    //     _;
    // }

     modifier isAFriend(address person){
        bool isAFriendbool = false;
        for (uint i=0; i<friends.length; i++) {
            if (friends[i] == person){
                isAFriendbool = true;
            }
        }
        require(isAFriendbool == true);
        _;
    }

     /*
    Unittests

    When we want to test functionality, we can (should) leave the testing code in
    this section so we could use this code when we deploy the contracts
    and write some tests on Mocha.
    Also, we don't know any other functional testing tools (on Solidity solely).
    */

    //  function testAddExchange(address receiverAddress) public {
    //      //TODO Omer: write assert statements for this test
    //     string memory optionalDescription = "hey description";
    //     ExchangeType exType = ExchangeType.Request;
    //     ExchangePurpose purpose = ExchangePurpose.DebtAddition;
    //     address[] memory addresses = new address[](1);
    //     addresses[0] = address(this);
    //     bool isApproved = false;
    //     ExchangeDetails memory newExchangeDetails = ExchangeDetails(receiverAddress, address(this), optionalDescription, exType, block.timestamp); // block.timestamp returns unix timestamp
    //     Exchange memory newExchange = Exchange(newExchangeDetails, purpose,addresses,isApproved);
    //     exchanges.push(newExchange);
    // }

    // function testAddFriendRequest() public {

    //     // it might be impossible, because when the user clicks on "addFriendRequest"
    //     // 2 things are supposed to happen:
    //     //      The user's ProfileContract adds a pending request
    //     //      The target's ProfileContract adds a pending request
    //     //
    //     // from both of the things to test, only the first one can be automated.

    //     // sender adds a friend request from source ProfileContract at the called ProfileContract exchanges list
    //     Exchange memory addedExchange = addFriendRequest();

    //     ExchangeDetails memory xd = addedExchange.exchangeDetails;
    //     // assert(xd.source == address(this));
    //     // assert(xd.destination == address(this));
    //     string memory optionalDescription = xd.optionalDescription;
    //     assert(keccak256(abi.encodePacked(optionalDescription)) == keccak256(abi.encodePacked("addFriendRequest")));
    //     assert(ExchangeType.Request == xd.exchangeType);
    //     assert(xd.creationDate > 0);

    //     assert(addedExchange.exchangePurpose == ExchangePurpose.AddFriend);
    // }
}