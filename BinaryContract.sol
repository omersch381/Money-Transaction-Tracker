pragma solidity >=0.4.22 <0.7.0;

contract BinaryContract{

    struct Transaction {
        address from;
        address to;
        uint amount;
        uint date;
    }

    struct ContractDebt{
        address debtor;
        string debtorName;
        uint amountOwned;
    }

    address playerOne;
    address playerTwo;
    ContractDebt currentDebt;

    Transaction[] binContractTransactionsLog;

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

    function getCurrentDebtorAddress public view returns(address){
        //return currentDebt.debtor
    }

    function getCurrentDebtorName public view returns(string){
        //return currentDebt.debtor name
    }

    function getCurrentDebtAmount public view returns(uint){
        //return currentDebt.amountOwned
    }
}