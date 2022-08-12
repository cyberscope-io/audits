const { MockProvider } = require("@ethereum-waffle/provider");
const { deployMockContract } = require("@ethereum-waffle/mock-contract");
const { deployContract } = require("ethereum-waffle");

const DomainWeb23Contract = require("../artifacts/contracts/DomainWeb23.sol/DomainWeb23.json");
const IHederaTokenServiceContract = require("../artifacts/contracts/IHederaTokenService.sol/IHederaTokenService.json");

module.exports = async () => {
  const wallets = new MockProvider().getWallets();
  const [sender, receiver] = wallets;

  const iHederaTokenServiceContract = await deployMockContract(
    sender,
    IHederaTokenServiceContract.abi
  );

  const hbarToken = "0x000000000000000000000000000000000000dddd";

  const contract = await deployContract(sender, DomainWeb23Contract, [
    hbarToken,
  ]);

  return { wallets, sender, receiver, contract, iHederaTokenServiceContract };
};
