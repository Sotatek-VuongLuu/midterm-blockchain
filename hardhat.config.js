require("dotenv").config();
require("@nomiclabs/hardhat-waffle");
require('@nomiclabs/hardhat-ethers');
require("@nomiclabs/hardhat-etherscan");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const INFURA_API_KEY = process.env.INFURA_API_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
module.exports = {
  solidity: "0.8.0",
  networks: {
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${INFURA_API_KEY}`, //Infura url with projectId
      accounts: [PRIVATE_KEY] // add the account that will deploy the contract (private key)
     },
     bsc_testnet: {
      url: 'https://data-seed-prebsc-2-s3.binance.org:8545/',
      accounts: [PRIVATE_KEY] // add the account that will deploy the contract (private key)
     }
   },
   etherscan: {
    apiKey: `${process.env.ETHERSCAN_API_KEY}` // eth
  },
};
