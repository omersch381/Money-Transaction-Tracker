const assert = require('assert');

exports.compiledBinaryContract = require('../build/BinaryContract.json');

exports.RequestPurpose = {
    AddFriend: "0",
    AddDebt: "1",
    DebtRotation: "2"
};

exports.assertRequest = (requestWrapper, source, destination, requestPurpose, transactionFrom, transactionTo, transactionAmount) => {
    let request = requestWrapper[0];
    let requestDetails = request.exchangeDetails;
    assert.ok(requestDetails.exchangeId > 0, "A wrong requestId was assigned to the request.");
    assert.strictEqual(source, requestDetails.source, "A wrong source was assigned to the request.");
    assert.strictEqual(destination, requestDetails.destination, "A wrong destination was assigned to the request.");
    assert.ok(Date.now() > requestDetails.creationDate, "A wrong creationDate was assigned to the request.");

    assert.strictEqual(requestPurpose, request.exchangePurpose, "A wrong requestPurpose was assigned to the request.");
    if (transactionFrom != null) {
        assert.strictEqual(transactionFrom, request.transaction.from, "A wrong transactionFrom was assigned to the request.");
        assert.strictEqual(transactionTo, request.transaction.to, "A wrong transactionTo was assigned to the request.");
        assert.strictEqual(transactionAmount, request.transaction.amount, "A wrong transactionAmount was assigned to the request.");
        assert.ok(Date.now() > request.transaction.date, "A wrong transactionDate was assigned to the request.");
    }
};

exports.getAddress = (profileContract) => {
    return profileContract.options.address;
}