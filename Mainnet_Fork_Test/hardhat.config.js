require("@nomicfoundation/hardhat-toolbox");

// get infura key from .infura file
const fs = require('fs');
const infuraKey = fs.readFileSync(".infura").toString().trim();

const mnemonic = fs.readFileSync("../.secret").toString().trim();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity:{
    compilers: [{
      version:  "0.8.8"
    }, {
      version:  "0.8.9"
    }
    ]
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic: mnemonic,
        count: 10,
      },
      forking: {
        url: "https://mainnet.infura.io/v3/" + infuraKey
      },
      gas: 7000000,
      gasPrice: 40746038000,
    }
  }
};
