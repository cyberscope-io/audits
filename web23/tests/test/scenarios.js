const { use, expect } = require("chai");
const { utils, ethers } = require("ethers");
const { MockProvider } = require("@ethereum-waffle/provider");
const { deployMockContract } = require("@ethereum-waffle/mock-contract");
const { solidity, deployContract } = require("ethereum-waffle");

const DomainWeb23Contract = require("../artifacts/contracts/DomainWeb23.sol/DomainWeb23.json");
const IHederaTokenServiceContract = require("../artifacts/contracts/IHederaTokenService.sol/IHederaTokenService.json");

use(solidity);

describe("DomainWeb23", () => {
  const setup = async () => {
    const [sender, receiver] = new MockProvider().getWallets();
    const iHederaTokenServiceContract = await deployMockContract(
      sender,
      IHederaTokenServiceContract.abi
    );

    const hbarToken = "0x000000000000000000000000000000000000dddd";

    const contract = await deployContract(sender, DomainWeb23Contract, [
      hbarToken,
    ]);

    return { sender, receiver, contract, iHederaTokenServiceContract };
  };

  it("should receive a payment and mint successfully (1, 6)", async () => {
    const { contract, iHederaTokenServiceContract } = await setup();

    await iHederaTokenServiceContract.mock.mintToken.returns(22, 1, [50]);
    await iHederaTokenServiceContract.mock.associateToken.returns(22);
    await iHederaTokenServiceContract.mock.transferNFT.returns(22);

    await contract.setPrecompileAddress(iHederaTokenServiceContract.address);

    const domain = "test.hbar";
    const keccak256Domain = utils.keccak256(utils.toUtf8Bytes(domain));

    await contract.receivePayment(domain, {
      value: ethers.utils.parseEther("0.00001"),
    });

    expect(await contract.isDomainAvailable(domain)).to.equal(false);

    await contract.mintNonFungibleToken(keccak256Domain, [1]);

    expect(await contract.isDomainAvailable(domain)).to.equal(true);
  });

  it("should setDomainAsset successfully (1,2)", async () => {
    const { contract, iHederaTokenServiceContract } = await setup();

    await iHederaTokenServiceContract.mock.mintToken.returns(22, 1, [50]);
    await iHederaTokenServiceContract.mock.associateToken.returns(22);
    await iHederaTokenServiceContract.mock.transferNFT.returns(22);

    await contract.setPrecompileAddress(iHederaTokenServiceContract.address);

    const domain = "test.hbar";
    const keccak256Domain = utils.keccak256(utils.toUtf8Bytes(domain));

    await contract.receivePayment(domain, {
      value: ethers.utils.parseEther("0.00001"),
    });

    await contract.mintNonFungibleToken(keccak256Domain, [1]);

    const assetHashValue = "assetHashValue";

    await contract.setDomainAsset(domain, assetHashValue);

    expect(await contract.getDomainAsset(domain)).to.equal(assetHashValue);
  });

  it("should return empty value in an unregistered domain (1)", async () => {
    const { contract } = await setup();

    expect(await contract.getDomainAsset("unregisteredDomain")).to.equal("");
  });

  it("should check if domain exist", async () => {
    const { contract, iHederaTokenServiceContract } = await setup();

    const domain = "test.hbar";
    const assetHashValue = "assetHashValue";

    await expect(contract.setDomainAsset(domain, assetHashValue)).revertedWith(
      "Domain Doesn't exist"
    );
  });

  it("should check if sender is the owner", async () => {
    const { receiver, contract, iHederaTokenServiceContract } = await setup();

    await iHederaTokenServiceContract.mock.mintToken.returns(22, 1, [50]);
    await iHederaTokenServiceContract.mock.associateToken.returns(22);
    await iHederaTokenServiceContract.mock.transferNFT.returns(22);

    await contract.setPrecompileAddress(iHederaTokenServiceContract.address);

    const domain = "test.hbar";
    const keccak256Domain = utils.keccak256(utils.toUtf8Bytes(domain));

    await contract.receivePayment(domain, {
      value: ethers.utils.parseEther("0.00001"),
    });

    await contract.mintNonFungibleToken(keccak256Domain, [1]);

    const assetHashValue = "assetHashValue";

    await expect(
      contract.connect(receiver).setDomainAsset(domain, assetHashValue)
    ).revertedWith("");
  });

  it("should blacklist a domain (3)", async () => {
    const { receiver, contract, iHederaTokenServiceContract } = await setup();

    await iHederaTokenServiceContract.mock.mintToken.returns(22, 1, [50]);
    await iHederaTokenServiceContract.mock.associateToken.returns(22);
    await iHederaTokenServiceContract.mock.transferNFT.returns(22);

    await contract.setPrecompileAddress(iHederaTokenServiceContract.address);

    const domain = "test.hbar";

    await contract.disableBtld("hbar");

    await expect(
      contract.receivePayment(domain, {
        value: ethers.utils.parseEther("0.00001"),
      })
    ).revertedWith("BTLD not enabled");
  });

  it("should not allow an unregistered domain", async () => {
    const { receiver, contract, iHederaTokenServiceContract } = await setup();

    await iHederaTokenServiceContract.mock.mintToken.returns(22, 1, [50]);
    await iHederaTokenServiceContract.mock.associateToken.returns(22);
    await iHederaTokenServiceContract.mock.transferNFT.returns(22);

    await contract.setPrecompileAddress(iHederaTokenServiceContract.address);

    await expect(
      contract.receivePayment("unregisterTopLevelDomain", {
        value: ethers.utils.parseEther("0.00001"),
      })
    ).revertedWith("BTLD not enabled");
  });

  it("should allow a registered domain (4,7)", async () => {
    const { contract, iHederaTokenServiceContract } = await setup();

    await iHederaTokenServiceContract.mock.mintToken.returns(22, 1, [50]);
    await iHederaTokenServiceContract.mock.associateToken.returns(22);
    await iHederaTokenServiceContract.mock.transferNFT.returns(22);

    await contract.setPrecompileAddress(iHederaTokenServiceContract.address);

    const domain = "test.unregisterTopLevelDomain";

    await contract.enableBtld(
      "unregisterTopLevelDomain",
      "0x0000000000000000000000000000000000001111"
    );

    expect(await contract.getDomainInfo(domain)).to.equal("1,,");

    await contract.receivePayment(domain, {
      value: ethers.utils.parseEther("0.00001"),
    });

    expect(await contract.getDomainInfo(domain)).to.equal(
      "1,test.unregisterTopLevelDomain,"
    );
  });

  it("should update the site address (5,7)", async () => {
    const { contract, iHederaTokenServiceContract } = await setup();

    await iHederaTokenServiceContract.mock.mintToken.returns(22, 1, [50]);
    await iHederaTokenServiceContract.mock.associateToken.returns(22);
    await iHederaTokenServiceContract.mock.transferNFT.returns(22);

    await contract.setPrecompileAddress(iHederaTokenServiceContract.address);

    const domain = "test.hbar";
    const keccak256Domain = utils.keccak256(utils.toUtf8Bytes(domain));

    await contract.receivePayment(domain, {
      value: ethers.utils.parseEther("0.00001"),
    });

    const siteAddress = "siteAddressValue";

    await contract.updateSiteAddress(domain, siteAddress);

    expect(await contract.getDomainInfo(domain)).to.equal(
      "1,test.hbar,siteAddressValue"
    );
  });

  it("should update the site address only from owner (5)", async () => {
    const { receiver, contract, iHederaTokenServiceContract } = await setup();

    await iHederaTokenServiceContract.mock.mintToken.returns(22, 1, [50]);
    await iHederaTokenServiceContract.mock.associateToken.returns(22);
    await iHederaTokenServiceContract.mock.transferNFT.returns(22);

    await contract.setPrecompileAddress(iHederaTokenServiceContract.address);

    const domain = "test.hbar";

    await contract.receivePayment(domain, {
      value: ethers.utils.parseEther("0.00001"),
    });

    const siteAddress = "siteAddressValue";

    await expect(
      contract.connect(receiver).updateSiteAddress(domain, siteAddress)
    ).revertedWith("Denied Access");
  });

  it("should not allow changing an unregistered site address (5)", async () => {
    const { contract } = await setup();

    await expect(
      contract.updateSiteAddress("unregistered", "siteAddressValue")
    ).revertedWith("Denied Access");
  });

  it("should book a domain when payment received (6)", async () => {
    const { receiver, contract, iHederaTokenServiceContract } = await setup();

    await iHederaTokenServiceContract.mock.mintToken.returns(22, 1, [50]);
    await iHederaTokenServiceContract.mock.associateToken.returns(22);
    await iHederaTokenServiceContract.mock.transferNFT.returns(22);

    await contract.setPrecompileAddress(iHederaTokenServiceContract.address);

    const domain = "test.hbar";
    const keccak256Domain = utils.keccak256(utils.toUtf8Bytes(domain));

    expect(await contract.isDomainAvailable(domain)).to.equal(false);

    await contract.receivePayment(domain, {
      value: ethers.utils.parseEther("0.00001"),
    });

    await contract.mintNonFungibleToken(keccak256Domain, [1]);

    expect(await contract.isDomainAvailable(domain)).to.equal(true);
  });

  it("should get all registered domains (8)", async () => {
    const { sender, contract, iHederaTokenServiceContract } = await setup();

    await iHederaTokenServiceContract.mock.mintToken.returns(22, 1, [50]);
    await iHederaTokenServiceContract.mock.associateToken.returns(22);
    await iHederaTokenServiceContract.mock.transferNFT.returns(22);

    await contract.setPrecompileAddress(iHederaTokenServiceContract.address);

    const domain = "test.hbar";
    const keccak256Domain = utils.keccak256(utils.toUtf8Bytes(domain));

    await contract.receivePayment(domain, {
      value: ethers.utils.parseEther("0.00001"),
    });

    await contract.mintNonFungibleToken(keccak256Domain, [1]);

    const domain2 = "test2.hbar";
    const keccak256Domain2 = utils.keccak256(utils.toUtf8Bytes(domain2));

    await contract.receivePayment(domain2, {
      value: ethers.utils.parseEther("0.00001"),
    });

    await contract.mintNonFungibleToken(keccak256Domain2, [1]);

    expect(await contract.getallDomains(sender.address)).to.equal(
      "1,test.hbar,test2.hbar"
    );
  });

  it("should check that domain exists (9)", async () => {
    const { sender, contract, iHederaTokenServiceContract } = await setup();

    await iHederaTokenServiceContract.mock.mintToken.returns(22, 1, [50]);
    await iHederaTokenServiceContract.mock.associateToken.returns(22);
    await iHederaTokenServiceContract.mock.transferNFT.returns(22);

    await contract.setPrecompileAddress(iHederaTokenServiceContract.address);

    const domain = "test.hbar";
    const keccak256Domain = utils.keccak256(utils.toUtf8Bytes(domain));

    expect(await contract.getBookingDomainHash(keccak256Domain)).to.equal(
      false
    );

    await contract.receivePayment(domain, {
      value: ethers.utils.parseEther("0.00001"),
    });

    expect(await contract.getBookingDomainHash(keccak256Domain)).to.equal(true);
  });

  it("should receive multiple payments (7,9,10)", async () => {
    const { sender, contract, iHederaTokenServiceContract } = await setup();

    await iHederaTokenServiceContract.mock.mintToken.returns(22, 1, [50]);
    await iHederaTokenServiceContract.mock.associateToken.returns(22);
    await iHederaTokenServiceContract.mock.transferNFT.returns(22);

    await contract.setPrecompileAddress(iHederaTokenServiceContract.address);

    const domain1 = "test1.hbar";
    const domain2 = "test2.hbar";
    const keccak256Domain1 = utils.keccak256(utils.toUtf8Bytes(domain1));
    const keccak256Domain2 = utils.keccak256(utils.toUtf8Bytes(domain2));

    expect(await contract.getDomainInfo(domain1)).to.equal("1,,");
    expect(await contract.getDomainInfo(domain2)).to.equal("1,,");
    expect(await contract.getBookingDomainHash(keccak256Domain1)).to.equal(
      false
    );
    expect(await contract.getBookingDomainHash(keccak256Domain2)).to.equal(
      false
    );

    await contract.receivePaymentMultiple([domain1, domain2], {
      value: ethers.utils.parseEther("0.00001"),
    });

    expect(await contract.getDomainInfo(domain1)).to.equal("1,test1.hbar,");
    expect(await contract.getDomainInfo(domain2)).to.equal("1,test2.hbar,");
    expect(await contract.getBookingDomainHash(keccak256Domain1)).to.equal(
      true
    );
    expect(await contract.getBookingDomainHash(keccak256Domain2)).to.equal(
      true
    );
  });
});
