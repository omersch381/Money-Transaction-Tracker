const path = require('path');
const fs = require('fs-extra');
const solc = require('solc');

// const lotteryPath = path.resolve(__dirname, 'contracts', 'Lottery.sol');
const profilePath = path.resolve(__dirname, 'contracts', 'ProfileContract.sol');
// const source = fs.readFileSync(lotteryPath, 'utf8');
const source = fs.readFileSync(profilePath, 'utf8');

module.exports = solc.compile(source, 1).contracts[':ProfileContract'];
// console.log(solc.compile(source, 1));