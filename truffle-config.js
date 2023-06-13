const HDWalletProvider = require('@truffle/hdwallet-provider');

const fs = require('fs');
const mnemonic = fs.readFileSync(".secret").toString().trim();

module.exports = {
  plugins: ["solidity-coverage"],

  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
    ropsten: {
      provider: () => new HDWalletProvider(mnemonic, `https://ropsten.infura.io/v3/${process.env.INFURA_ROPSTEN_API_KEY}`),
      network_id: 3,       // Ropsten's id
      gas: 5500000,        // Ropsten has a lower block limit than mainnet
      confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      // timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      // skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
     }
  },

  mocha: {
    reporter: process.env.ENABLE_GAS_REPORTER ? 'eth-gas-reporter' : undefined
  },

  compilers: {
    solc: {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 20000
          },
          evmVersion: "shanghai"
        }
    }
  }
}
