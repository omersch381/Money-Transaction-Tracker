pragma solidity ^0.4.17;
pragma experimental ABIEncoderV2;

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