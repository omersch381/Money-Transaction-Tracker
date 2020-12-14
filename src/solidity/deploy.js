const HDWalletprovider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
// const ganache = require('ganache-cli');
const {
    interface,
    bytecode
} = require('./compile.js');

const provdier = new HDWalletprovider(
    'page basic neutral unaware target rather tattoo poet dutch flag luxury minute',
    'https://ropsten.infura.io/v3/9ba5464e1e3e43da9d605d467f5b4f74'
);

const web3 = new Web3(provdier);
// const web3 = new Web3(ganache);

const deploy = async () => {
    const accounts = await web3.eth.getAccounts();

    console.log('Attempting to deploy', accounts[0]);

    const result = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({
            data: bytecode,
        })
        .send({
            gas: '5000000',
            from: accounts[0]
        });

    console.log(interface);
    console.log('Contract deployed to ', result.options.address);
};

deploy();