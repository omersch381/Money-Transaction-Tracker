pragma solidity >=0.4.22 <0.7.0;
pragma experimental ABIEncoderV2;

// import "./UserPreferences.sol";

contract ProfileContract{

    enum ExchangeType{ Request, Response }

    enum ExchangePurpose{ AddFriend, DebtAddition, DebtRotation }

    struct ExchangeDetails {
        address sender;
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
    mapping(address => string) friendsName;
    address owner;
    address[] private friends;
    Exchange[] private exchanges;
    address[] private contracts; // == [GroupsContract(s), BinaryContract(s)]
    // string[] private actionsLog;

    constructor() public {
        owner = msg.sender;
    }

    /*
    Status includes all the attributes each user has on its ProfileContract.
    We are having this method so we can update the presented attributes in one API call.

    //TODO: implement this method as soon as we implement the rest of the things.
     */
    function getMyStatus() public restricted view returns (string[] memory myStatus){
    }

    // // ActionsLog section
    // TODO implement this method as soon as we implement the rest of the things.
    // function getActionsLog() public restricted view returns(string[] memory){
    // }

    // // Groups section
    // function createGroup() public restricted{
    // }

    // function getGroups() public restricted view returns (address[] memory){
    // }

    // Exchanges section
    function removeExchange(uint index) public restricted {
        if (index >= exchanges.length) return;

        // We run that for loop because the only way to delete
        // an item in an array is to pop its last index
        // so we organize the items accordingly
        for (uint i = index; i<exchanges.length-1; i++){
            exchanges[i] = exchanges[i+1];
        }

        exchanges.pop();
    }

    function getAllExchanges() public restricted view returns (Exchange[] memory){
        return exchanges;
    }

    function addExchangeNotRestricted(string memory optionalDescription, ExchangeType exType, ExchangePurpose purpose, address[] memory approvers, bool isApproved) public returns (Exchange memory) {

        ExchangeDetails memory newExchangeDetails = ExchangeDetails({
                sender: msg.sender,
                optionalDescription: optionalDescription,
                exchangeType: exType,
                creationDate: block.timestamp
            });

        Exchange memory newExchange = Exchange({
            exchangeDetails: newExchangeDetails,
            exchangePurpose: purpose,
            approvers: approvers,
            isApproved: isApproved
        });

        exchanges.push(newExchange);

        return newExchange;
    }

    function addExchange(string memory optionalDescription, ExchangeType exType, ExchangePurpose purpose, address[] memory approvers, bool isApproved) public restricted returns (Exchange memory) {
        return addExchangeNotRestricted(optionalDescription,exType,purpose,approvers,isApproved);
    }

    // Friends functions
    function addFriendRequest(address friend) public restricted {
    }

    function confirmFriendRequest(address friend) public restricted {
    }

    function removeFriend(address friend) public restricted isAFriend(friend) {
    }

    // for testing only
    function removeAllFriends() public restricted {
    }

    function getFriends() public view restricted returns (Friend[] memory friends) {
        // will return { 0x123456: "Dror" }
    }

    function getFriendName(address friend) public view restricted returns (string memory name) {
        return "TODO";
    }

     modifier restricted(){
        require(msg.sender == owner);
        _;
    }

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

     function testAddExchange() public {
         //TODO Omer: write assert statements for this test
        string memory optionalDescription = "hey description";
        ExchangeType exType = ExchangeType.Request;
        ExchangePurpose purpose = ExchangePurpose.DebtAddition;
        address[] memory addresses = new address[](1);
        addresses[0] = msg.sender;
        bool isApproved = false;
        ExchangeDetails memory newExchangeDetails = ExchangeDetails(msg.sender,optionalDescription,exType,block.timestamp); // block.timestamp returns unix timestamp
        Exchange memory newExchange = Exchange(newExchangeDetails, purpose,addresses,isApproved);
        exchanges.push(newExchange);
    }

}