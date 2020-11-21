pragma solidity >=0.4.22 <0.7.0;

//TODO
contract BinaryContract{

    struct Transaction {
        address from;
        address to;
        uint amount;
        uint date;
    } // this is only needed if we're keeping a transaction log inside a bin contract as well

    struct ContractDebt{
        address debtor;
        uint amountOwned;
    }


    address playerOne;
    address playerTwo;    
    ContractDebt currentDebt;

    Transaction[] binContractTransactionsLog; 
    /* not sure if needed because the transactions are already saved in the 
    group contract and a two person group i.e binary contract is just a two person group contract with a log already being made.
    My question is: do we need to differentiate between a binary contract and a two person group? */ 

    constructor() public{
        //TODO
    }

    function updateContractDebt public (address memory inserter, uint memory amount) {
        /*  recieves the end result of a transaction i.e (Omer,20) is equals to Omer inserted 20 Shekels into the contract
            meaning Dror now ows 20 shekels. */

        /* 
            if debtor != inerter:
                amountOwned += amount
            else:
                if amount > amountOwned:
                    updateDebtor(player who is not the inserter);
                    temp = currentDebt.amountOwned;
                    currentDebt.amountOwned =  amount - temp;
                else if amount < amountOwned:
                    temp = currentDebt.amountOwned;
                    currentDebt.amountOwned =  amountOwned - temp;
                else:
                    if the amountOwned is now 0, do we want to terminate the contract?
        */
    }

    function updateDebtor(address newDebtor){
        //updates the currentDebt.debtor to be newDebtor
    }

    function getCurrentDebtor public view returns(address){ 
        //return currentDebt.debtor
    }
    function getCurrentDebt public view returns(uint){
        //return currentDebt.amountOwned
    }
}