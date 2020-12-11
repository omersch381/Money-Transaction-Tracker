import web3 from './web3';
import Profile from './build/ProfileContract.json';

export default (address) => {
    return new web3.eth.Contract(
        JSON.parse(Profile.interface),
        address
    );
};