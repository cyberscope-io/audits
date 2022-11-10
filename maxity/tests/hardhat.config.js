const dotenv = require("dotenv");
dotenv.config();

require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");

const TEST_PRIVATE_KEY = process.env.TEST_PRIVATE_KEY || "";

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    testnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: [TEST_PRIVATE_KEY],
    },
  },
  solidity: "0.8.11",
  settings: {
    optimizer: {
      enabled: true,
      runs: 0,
    },
  },
};