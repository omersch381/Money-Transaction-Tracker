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
    function BinaryContract(address providedPlayerOne, uint amount, address providedPlayerTwo, uint providedValidityInDays) public ifValid {
        creationDate = block.timestamp;

        if (providedValidityInDays == 0)
            validityInDays = 365;
        else
            validityInDays = providedValidityInDays;

        playerOne = providedPlayerOne;

        playerTwo = providedPlayerTwo;

        addTransaction(providedPlayerOne, amount, providedPlayerTwo);
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
        if(binContractTransactionsLog.length != 1){ // in the constructor we just pushed the only transaction
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

    function updateDebtor(address newDebtor) public ifValid {
        currentDebt.debtor = newDebtor;
    }

    function updateCreditor(address newCreditor) public ifValid {
        currentDebt.creditor = newCreditor;
    }

    function getCurrentDebtorAddress() public ifValid returns(address){
        return currentDebt.debtor;
    }

    // function getCurrentDebtorName() public view returns(string memory){
    //     //return currentDebt.debtor name
    // }

    function getCurrentCreditorAddress() public ifValid returns(address){
        return currentDebt.creditor;
    }

    // function getCurrentCreditorName() public view returns(string memory){
    //     //return currentDebt.creditor name
    // }

    function getCurrentDebtAmount() public ifValid returns(uint){
        return currentDebt.amountOwned;
    }

    function getCurrentDebt() public ifValid returns(ContractDebt memory){
        return currentDebt;
    }

    modifier ifValid(){
        if (block.timestamp > creationDate + validityInDays * 1 days){
            isValid = false;
        }
        require(isValid);
        _;
    }
}