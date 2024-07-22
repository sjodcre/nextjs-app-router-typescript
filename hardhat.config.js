require('@nomicfoundation/hardhat-toolbox')
require('dotenv/config')

module.exports = {
  defaultNetwork: 'localhost',
  networks: {
    hardhat: {},
    localhost: {
      url: 'http://127.0.0.1:8545',
    },
    bitfinity: {
      url: 'https://testnet.bitfinity.network',
      accounts: [],
      chainId: 355113,
    },
    fantom: {
      url: 'https://fantom-rpc.publicnode.com/',
      // url: process.env.FTM_RPC_URL,
      accounts: [], // Replace with your private key
    },
  },
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  mocha: {
    timeout: 40000,
  },
}
