pragma solidity >=0.4.22 <0.7.0;

import "./Utils";

contract Group {

    enum GroupType { Democratic, Dictatorship }

    enum VoteType { Accepted, Declined, Default }

    // All the transactions will be added in a binary way to TransactionsLog
    // E.g. Omer owes Dror and Michael and Ariel 25 shekels each:
    //      Omer -> Dror 25
    //      Omer -> Michael 25
    //      Omer -> Ariel 25
    // When the contract is over, TransactionsLog creates binary contracts with debts
    // for each relevant user
    struct Transaction {
        address from;
        address to;
        uint amount;
        uint date;
        // bool wasPaid;
    }
    
    struct GroupVote {
        Vote[] groupVote; // omer - yes, Dror no, ...
        uint positiveAnswers; // 3
        uint negativeAnswers; // 3
        string topic; //buying pizza
        string optionalDescription; // buying pizza and stuff...
    }
    
    struct Vote {
        address voter; //0x1234
        string name; // Omer
        VoteType answer; // true
    }
    
    struct Message{
        address publisherAddress;
        string publisherName;
        uint date;
        string message;
    }

    struct GroupMember{
        address memberAddress;
        string memberName;
    }

    address manager;
    GroupType groupType;
    Transaction[] transactionsLog;
    Message[] groupChat;
    GroupVote[] groupVotes; //which contains all group votes (might be used even if group is dictatorship)
    GroupMember[] members;
    
    constructor(GroupType groupType) public {
        // if type is Democratic then manager is null
    }
    
    // Members section
    function addMemberToGroup() public restricted {
        if (groupType == GroupType.Democratic) {
            // vote....
        }
        else {
            //to manager:
            // please enter an address...
        }
    }
    
    function getMembers() public restricted view returns (GroupMember[] memory members) {
    }
    
    
    // TransactionsLog section
    function addTransaction() public restricted {
        // Add voters
        // vote of each related member
    }
    
    function removeTransaction() public restricted{
        // If transaction was paid or if 100% democratic agree...
    }
    
    
    // Chat section
    function sendMsgToGroup(string memory message) public restricted {
    }
    
    
    // Votes section
    function addGroupVote() public restricted {
        // Adding restrictions to every group vote
        // Remember the positiveAnswers var
    }
    
    
    // Utils
    function getName(address friend) public restricted returns (string memory) {
        return Utils.getName(members, friend);
    }

    function getMyStatus() public restricted returns (string[] memory status){
        // Would run on the TransactionsLog if the date is not recent
        // change the string array to a better option
    }
    
    modifier restricted() {
        bool isGroupMember = false;
        for (uint i=0; i<members.length; i++) {
            if (msg.sender == members[i]){
                isGroupMember = true;
            }
        }
        require(isGroupMember == true);
        _;
    }
}