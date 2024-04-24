require('@nomicfoundation/hardhat-toolbox')
// require('dotenv/config')

module.exports = {
  defaultNetwork: 'localhost',
  networks: {
    hardhat: {},
    localhost: {
      url: 'http://127.0.0.1:8545',
    },
    bitfinity: {
      url: 'https://testnet.bitfinity.network',
      accounts: ["0499308649cbfa0231701a19ee71d9c4204be4a8a14ac9e1bb8ccc41c9be57bf"],
      chainId: 355113,
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
