module.exports = {
  networks: {
    development: {
      host: "ganache",
      port: 8545,
      network_id: "*",
    },
    ropsten: {
      provider: () => new HDWalletProvider(process.env.GANACHE_MNEMONIC, `https://ropsten.infura.io/v3/XXX`),
      network_id: 3,
      gas: 5500000,
      confirmations: 2,
    },
  },
  mocha: {
  },
  compilers: {
    solc: {
      version: "0.8.1",
    }
  }
}
