pragma solidity ^0.4.17;

contract BinaryContract{

    struct Transaction {
        address from;
        address to;
        uint amount;
        uint date;
    }

    // We have that struct as it stores the current contract status (the "sum" of all the contract's transactions)
    // It saves power/money for the caller - every time a user adds a debt - it changes the ContractDebt as well
    // struct ContractDebt{
    //     address debtor;
    //     address creditor;
    //     uint amountOwned;
    // }

    uint creationDate;
    uint validityInDays;
    bool isValid = true;
    // address playerOne;
    // address playerTwo;

    // ContractDebt currentDebt;
    address debtor;
    address creditor;
    uint amountOwned;

    Transaction[] binContractTransactionsLog;

    function BinaryContract(address providedCreditor, uint amount, address providedDebtor) public{
        debtor = providedDebtor;
        creditor = providedCreditor;
        amountOwned = amount;
    }

    // function getNumberForTestingOnly() public view returns (uint) {
    //     return validityInDays;
    // }

    // E.g. BinaryContract(player1, 2, player2) == deploy a new contract, where player 1 owes 2 shekels to player 2
    // function setArguments(address providedCreditor, uint amount, address providedDebtor) public {
    //     // creationDate = block.timestamp;

    //     // if (providedValidityInDays == 0)
    //     //     validityInDays = 365;
    //     // else
    //     //     validityInDays = providedValidityInDays;

    //     debtor = providedDebtor;
    //     creditor = providedCreditor;
    //     amountOwned = amount;

    //     addTransaction(providedPlayerOne, amount, providedPlayerTwo);
    // }

    // // E.g. BinaryContract(player1, 2, player2) == deploy a new contract, where player 1 owes 2 shekels to player 2
    // function setArguments(address providedPlayerOne) public {
    //     // creationDate = block.timestamp;

    //     // if (providedValidityInDays == 0)
    //     //     validityInDays = 365;
    //     // else
    //     //     validityInDays = providedValidityInDays;

    //     playerOne = providedPlayerOne;

    //     currentDebt.debtor = providedPlayerOne;
    //     currentDebt.creditor = providedPlayerOne;
    //     currentDebt.amountOwned = 6;

    //     // playerTwo = providedPlayerTwo;

    //     // addTransaction(providedPlayerOne, amount, providedPlayerTwo);
    // }

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
        if(binContractTransactionsLog.length != 1){ // in the constructor we just pushed the only transaction
            if (debtor != sender){ // means the debtor now in a bigger debt
            amountOwned += amount;
            } else { // means the debtor is the sender
                if (amount > amountOwned){
                     updateDebtor(receiver);
                     updateCreditor(sender);
                     amountOwned =  amount - amountOwned;
                } else{
                    amountOwned -= amount;
                }
            }
        } else {
            debtor = receiver;
            creditor = sender;
            amountOwned = amount;
        }
    }

    function updateDebtor(address newDebtor) public {
        debtor = newDebtor;
    }

    function updateCreditor(address newCreditor) public {
        creditor = newCreditor;
    }

    // function getCurrentDebtorAddress() public ifValid returns(address){
    //     return currentDebt.debtor;
    // }

    //// function getCurrentDebtorName() public view returns(string memory){
    ////     //return currentDebt.debtor name
    //// }

    // function getCurrentCreditorAddress() public ifValid returns(address){
    //     return currentDebt.creditor;
    // }

    //// function getCurrentCreditorName() public view returns(string memory){
    ////     //return currentDebt.creditor name
    //// }

    // function getCurrentDebtAmount() public view returns(uint){
    //     return currentDebt.amountOwned;
    // }

    function getCurrentDebt() public view returns(address, uint, address){
        return (debtor, amountOwned, creditor);
    }

    modifier ifValid(){
        if (block.timestamp > creationDate + validityInDays * 1 days){
            isValid = false;
        }
        require(isValid);
        _;
    }
}