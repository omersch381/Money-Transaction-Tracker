const path = require('path');
const fs = require('fs-extra');
const solc = require('solc');

const buildPath = path.resolve(__dirname, 'build');
fs.removeSync(buildPath);

const binaryPath = path.resolve(__dirname, 'contracts', 'BinaryContract.sol');

const binarysource = fs.readFileSync(binaryPath, 'utf8');

const binaryOutput = solc.compile(binarysource, 1).contracts;

fs.ensureDirSync(buildPath);

for (let contract in binaryOutput) {
    fs.outputJSONSync(path.resolve(buildPath, contract.replace(':', '') + '.json'), binaryOutput[contract]);
}