const { MockProvider } = require("@ethereum-waffle/provider");
const { deployContract } = require("ethereum-waffle");

const MaxityContract = require("../artifacts/contracts/Maxity.sol/Maxity.json");

module.exports = async () => {
  const wallets = new MockProvider().getWallets();
  const [sender, receiver, receiver1] = wallets;

  const contract = await deployContract(sender, MaxityContract, [
    "TEST",
    "TST",
  ]);

  return { wallets, sender, receiver, receiver1, contract, MaxityContract };
};
