const { use, expect } = require("chai");
const { utils, ethers } = require("ethers");
const { solidity } = require("ethereum-waffle");
const setup = require("./setup");

use(solidity);

describe("Multiple", () => {
  it("register multiple times the same domain", async () => {
    const { wallets, contract, iHederaTokenServiceContract } = await setup();

    await iHederaTokenServiceContract.mock.mintToken.returns(22, 1, [50]);
    await iHederaTokenServiceContract.mock.associateToken.returns(22);
    await iHederaTokenServiceContract.mock.transferNFT.returns(22);

    await contract.setPrecompileAddress(iHederaTokenServiceContract.address);

    const domain = "test.hbar";
    const keccak256Domain = utils.keccak256(utils.toUtf8Bytes(domain));

    for (let i = 0; i < 100; ++i) {
      let request = contract
        .connect(wallets[i % wallets.length])
        .receivePayment(domain, {
          value: ethers.utils.parseEther("0.00001"),
        });

      if (i !== 0) {
        request = expect(request).revertedWith("Domain Booking in progress");
      }

      await request;
    }

    expect(await contract.getDomainInfo(domain)).to.equal("1,test.hbar,");

    await contract.mintNonFungibleToken(keccak256Domain, [1]);

    expect(await contract.getallDomains(wallets[0].address)).to.equal(
      "1,test.hbar"
    );

    console.log(
      `stress test of ${wallets.length} wallets trying to purchase one domain 100 times.`
    );
  });
});
