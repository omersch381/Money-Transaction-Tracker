const path = require('path');
const fs = require('fs-extra');
const solc = require('solc');

const buildPath = path.resolve(__dirname, 'build');
fs.removeSync(buildPath);

// contracts = ['ProfileContract.sol', 'BinaryContract.sol'];

// outputs = [];
// for (contract in contracts){
//     const contractPath = path.resolve(__dirname, 'contracts', contracts[contract]);
//     const contractSource = fs.readFileSync(contractPath, 'utf8');
//     const contractOutput = solc.compile(contractSource, 1).contracts;
//     outputs.push(contractOutput);
// }

// console.log(outputs);

const profilePath = path.resolve(__dirname, 'contracts', 'ProfileContract.sol');
const binaryPath = path.resolve(__dirname, 'contracts', 'BinaryContract.sol');

const profileSource = fs.readFileSync(profilePath, 'utf8');
const binarysource = fs.readFileSync(binaryPath, 'utf8');

const profileOutput = solc.compile(profileSource, 1).contracts;
const binaryOutput = solc.compile(binarysource, 1).contracts;

// fs.ensureDirSync(buildPath);
// for (output in outputs){
//     for (let contract in output) {
//         fs.outputJSONSync(path.resolve(buildPath, contracts[contract].replace(':', '') + '.json'), output[contract]);
//     }
// }
for (let contract in profileOutput) {
    fs.outputJSONSync(path.resolve(buildPath, contract.replace(':', '') + '.json'), profileOutput[contract]);
}

for (let contract in binaryOutput) {
    fs.outputJSONSync(path.resolve(buildPath, contract.replace(':', '') + '.json'), binaryOutput[contract]);
}

// module.exports = solc.compile(source, 1).contracts[':ProfileContract'];