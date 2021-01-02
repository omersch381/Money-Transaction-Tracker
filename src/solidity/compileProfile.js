const path = require('path');
const fs = require('fs-extra');
const solc = require('solc');

const buildPath = path.resolve(__dirname, 'build');
fs.removeSync(buildPath);

const profilePath = path.resolve(__dirname, 'contracts', 'ProfileContract.sol');

const profileSource = fs.readFileSync(profilePath, 'utf8');

const profileOutput = solc.compile(profileSource, 1).contracts;

fs.ensureDirSync(buildPath);


for (let contract in profileOutput) {
    fs.outputJSONSync(path.resolve(buildPath, contract.replace(':', '') + '.json'), profileOutput[contract]);
}