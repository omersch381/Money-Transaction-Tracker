pragma solidity >=0.4.22 <0.7.0;

import "./Utils";

contract Group {

    enum GroupType { Democratic, Dictatorship }
    
    // All the transactions will be added in a binary way to TransactionsLog
    // E.g. Omer owes Dror and Michael and Ariel 25 shekels each:
    //      Omer -> Dror 25
    //      Omer -> Michael 25
    //      Omer -> Ariel 25
    // When the cotract is over, TransactionsLog creates binary contracts with debts
    // for each relevant user
    struct TransactionsLog {
        address from;
        address to;
        uint amount;
        bool wasPaid;
    }
    
    struct GroupVote {
        Vote[] groupVote;
        uint positiveAnswers;
    }
    
    struct Vote {
        address voter;
        bool answer;
    }
    
    address manager;
    GroupType groupType;
    TransactionsLog[] transactionsLog;
    string[] groupChat;
    GroupVote[] groupVotes; //which contains all group votes (might be used even if group is dictatorship)
    address[] members;
    
    constructor(GroupType groupType) public {
        // if type is Democratic then manager is not null
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
    
    function getMembers() public restricted {
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
    
    modifier restricted() {
        bool isMemberOfGroup = false;
        for (uint i=0; i<members.length; i++) {
            if (msg.sender == members[i]){
                isMemberOfGroup = true;
            }
        }
        require(isMemberOfGroup == true);
        _;
    }
    
}