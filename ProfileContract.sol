pragma solidity >=0.4.22 <0.7.0;
pragma experimental ABIEncoderV2;

import "./UserPreferences.sol";

contract ProfileContract{

    enum ExchangeType{ Request, Response }

    enum ExchangePurpose{ AddFriend, DebtAddition, DebtRotation }

    struct ExchangeDetails {
        address sender;
        string optionalDescription;
        ExchangeType exchangeType;
        uint creationDate;
    }

    struct Exchange{
        ExchangeDetails exchangeDetails;
        ExchangePurpose exchangePurpose;
        address[] approvers;
        bool isApproved;
    }
    
    Preferences preferences;
    mapping(address => string) friendsName;
    address owner;
    address[] private friends;
    Exchange[] private exchanges;
    address[] private groups;
    string[] private actionsLog;
    
    constructor() public {
        owner = msg.sender;
    }
    
    
    // ActionsLog section
    function getActionsLog() public restricted view returns(string[] memory){
    }


    // Groups section
    
    function joinGroup(address group) public restricted{
    }
    
    function leaveGroup() public restricted{
    }
    
    function createGroup() public restricted{
    }
    
    function getGroups() public restricted view returns (address[] memory){
    }
    

    // Exchanges section
    //      I think that "getExchange" method would be unnecessary
    
    function removeExchange(Exchange memory exchange) public restricted {
    }
    
    function getAllExchanges() public restricted view returns (Exchange[] memory){
    }


    // Friends functions
    
    function addFriendRequest(address friend) public restricted {
    }

    function confirmFriendRequest(address friend) public restricted {
    }

    function removeFriend(address friend) public restricted isAFriend(friend) {
    }

    function removeAllFriends() public restricted {
    }

    function getFriends() public view restricted returns (address[] memory) {
        return friends;
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
}