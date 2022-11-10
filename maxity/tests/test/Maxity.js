const { expect } = require("chai");
const { ethers } = require("ethers");
const setup = require("./setup");

describe("Maxity", async function () {
  describe("Deployment", function () {
    it("Should set the right owner.", async function () {
      const { sender, contract } = await setup();
      expect(await contract.owner()).to.equal(sender.address);
    });

    it("Should assign the total supply of tokens to the owner.", async function () {
      const { sender, contract } = await setup();
      const ownerBalance = await contract.balanceOf(sender.address);
      expect(await contract.totalSupply()).to.equal(ownerBalance);
    });

    it("Should have 18 decimals.", async function () {
      const { contract } = await setup();
      expect(await contract.decimals()).to.equal(18);
    });

    it("Should assign the name and symbol correctly.", async function () {
      const { contract } = await setup();
      expect(await contract.name()).to.equal("TEST");
      expect(await contract.symbol()).to.equal("TST");
    });

    it("Should have total supply equal to preMintedSupply.", async function () {
      const { contract } = await setup();
      // Decimal to Hex 1e27 = 0x33B2E3C9FD0803CE8000000
      expect(await contract.totalSupply()).to.equal(
        ethers.BigNumber.from("0x33B2E3C9FD0803CE8000000")
      );
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts.", async function () {
      const {  receiver, receiver1, contract } = await setup();
      // Transfer 200 tokens from owner to receiver
      await expect(() =>
        contract.transfer(receiver.address, 200)
      ).to.changeTokenBalance(contract, receiver, 200);
      // // Transfer 50 tokens from receiver to receiver1
      await expect(() =>
        contract.connect(receiver).transfer(receiver1.address, 50)
      ).to.changeTokenBalances(contract, [receiver, receiver1], [-50, 50]);
    });

    it("Should fail if the sender doesn't have enough tokens.", async function () {
      const { sender, receiver, contract } = await setup();
      const initialOwnerBalance = await contract.balanceOf(sender.address);
      // Try to send 1 token from receiver (0 tokens) to owner (1000 tokens).
      // `require` will evaluate false and revert the transaction.
      await expect(
        contract.connect(receiver).transfer(sender.address, 1)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
      // Owner balance shouldn't have changed.
      expect(await contract.balanceOf(sender.address)).to.equal(
        initialOwnerBalance
      );
    });

    it("Should fail if sender or receiver is zero address.", async function () {
      const { contract } = await setup();
      // Try to send 1 token to zero address.
      // `require` will evaluate false and revert the transaction.
      await expect(
        contract.transfer(ethers.constants.AddressZero, 1)
      ).to.be.revertedWith("ERC20: transfer to the zero address");
    });

    it("Should allowance to accounts[1] authority to spend account[0]'s token.", async function () {
      const { sender, receiver, contract } = await setup();
      // Give authority to receiver to transfer 200000
      await contract.approve(receiver.address, 200000);
      const result = await contract.allowance(sender.address, receiver.address);
      expect(result.toNumber()).to.equal(200000);
      // Transfer allowed token
      await expect(() =>
        contract
          .connect(receiver)
          .transferFrom(sender.address, receiver.address, 200000)
      ).to.changeTokenBalances(contract, [sender, receiver], [-200000, 200000]);
    });

    it("Should revert transfer where spender does not have the allowance.", async function () {
      const { sender, receiver, contract } = await setup();
      // Try to transferFrom without allowance
      // `require` will evaluate false and revert the transaction.
      await expect(
        contract
          .connect(receiver)
          .transferFrom(sender.address, receiver.address, 200000)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });
  });

  describe("Allowance", function () {
    it("Should allowance to accounts[1] authority to account[0]'s token.", async function () {
      const { sender, receiver, contract } = await setup();

      const approvedAmount = 200000;
      // Give authority to receiver to transfer 200000
      await contract.approve(receiver.address, approvedAmount);
      let result = await contract.allowance(sender.address, receiver.address);
      expect(result.toNumber()).to.equal(approvedAmount);

      // Give authority to receiver to transfer 400000.
      await contract.approve(receiver.address, approvedAmount * 2);
      result = await contract.allowance(sender.address, receiver.address);
      expect(result.toNumber()).to.equal(approvedAmount * 2);
    });

    it("Should increase and decrease allowance.", async function () {
      const { sender, receiver, contract } = await setup();

      const approveAmount = 200000;
      // IncreaseAllowance.
      await contract.increaseAllowance(receiver.address, approveAmount);
      let result = await contract.allowance(sender.address, receiver.address);
      expect(result.toNumber()).to.equal(approveAmount);

      // DecreaseAllowance
      await contract.decreaseAllowance(receiver.address, approveAmount);
      result = await contract.allowance(sender.address, receiver.address);
      expect(result.toNumber()).to.equal(0);
    });

    it("Decrease allowance should revert if the subtracted value is greater than the allowance.", async function () {
      const { receiver, contract } = await setup();

      // Try to decrease allowance without having allowance.
      // `require` will evaluate false and revert the transaction.
      await expect(
        contract.decreaseAllowance(receiver.address, 2)
      ).to.be.revertedWith("ERC20: decreased allowance below zero");

      await contract.increaseAllowance(receiver.address, 10);

      // Try to decrease allowance woth greater subtracted value.
      // `require` will evaluate false and revert the transaction.
      await expect(
        contract.decreaseAllowance(receiver.address, 20)
      ).to.be.revertedWith("ERC20: decreased allowance below zero");
    });

    it("Approve should revert to zero address.", async function () {
      const { contract } = await setup();
      // Try to approve on zero address.
      // `require` will evaluate false and revert the transaction.
      await expect(
        contract.approve(ethers.constants.AddressZero, 1)
      ).to.be.revertedWith("ERC20: approve to the zero address");
    });
  });

  describe("Owner Role", async function () {
    it("Should have the authority to add minter role.", async function () {
      const { contract, receiver } = await setup();
      // Add minter roler
      // Check if the minter has inserted.
      await contract.addMinter(receiver.address, 10);
      expect(await contract.isMinter(receiver.address)).to.equal(true);
    });

    it("addMinter should revert to zero address.", async function () {
      const { contract } = await setup();
      await expect(
        contract.addMinter(ethers.constants.AddressZero, 1)
      ).to.be.revertedWith("_addMinter is the zero address");
    });

    it("Should have the authority to remove minter role.", async function () {
      const { contract, receiver } = await setup();
      // Add minter roler
      // Check if the minter has inserted.
      await contract.addMinter(receiver.address, 10);
      expect(await contract.isMinter(receiver.address)).to.equal(true);
      // Delete minter roler
      // Check if the minter has inserted.
      await contract.delMinter(receiver.address);
      expect(await contract.isMinter(receiver.address)).to.equal(false);
    });

    it("Should have the authority to view address of minters.", async function () {
      const { contract, receiver, receiver1 } = await setup();
      // Add minter roler
      await contract.addMinter(receiver.address, 10);
      await contract.addMinter(receiver1.address, 10);
      // Check if the minter has inserted.
      expect(await contract.getMinter(0)).to.equal(receiver.address);
      expect(await contract.getMinter(1)).to.equal(receiver1.address);
    });

    it("GetMinter should revert on out of index when not minters are added.", async function () {
      const { contract } = await setup();
      // Try retrive out of index minter.
      // `require` will evaluate false and revert the transaction.
      await expect(contract.getMinter(1)).to.be.revertedWith(
        "Index out of bounds"
      );
    });

    it("GetMinter should revert on out of index.", async function () {
      const { contract, receiver } = await setup();
      // Add minter roler
      await contract.addMinter(receiver.address, 10);
      // Try to approve on zero address.
      // `require` will evaluate false and revert the transaction.
      await expect(contract.getMinter(2)).to.be.revertedWith(
        "Index out of bounds"
      );
    });

    it("Burn should revert on the burn amount exceeds the balance", async function () {
      const { contract, sender } = await setup();
      // Try burn more tokens than the balance of user.
      // `require` will evaluate false and revert the transaction.
      await expect(contract.burn(sender.address,ethers.BigNumber.from("0x34B2E3C9FD0803CE8000000"))).to.be.revertedWith(
        "ERC20: burn amount exceeds balance"
      );
    });

    it("Burn should revert to zero address", async function () {
      const { contract } = await setup();
      // Burn to zero address
      // `require` will evaluate false and revert the transaction.
      await expect(contract.burn(ethers.constants.AddressZero,10)).to.be.revertedWith(
        "ERC20: burn from the zero address"
      );
    });
  });

  describe("Minter Role", function () {
  it("Should be able to mint", async function () {
    const { contract, sender, receiver } = await setup();
    const burnAmount = 1000;
    // Add minter roler
    await contract.addMinter(sender.address, burnAmount);
    await contract.addMinter(receiver.address, burnAmount);
    //to mint more token firstly i have to burn some
    await contract.burn(sender.address, burnAmount * 2);
    // Mint burned tokens.
    expect(
      await contract.callStatic.mint(sender.address, burnAmount)
    ).to.equal(true);
    expect(
      await contract
        .connect(receiver)
        .callStatic.mint(receiver.address, burnAmount)
    ).to.equal(true);
  });

  it("Should revert max mint ability is exceeded.", async function () {
    const { contract, sender, receiver } = await setup();
    // Add minter roler
    await contract.addMinter(sender.address, 1);
    // Burn first in order to mint
    await contract.burn(sender.address, 2);
    await expect(
      contract.mint(receiver.address, 2)
    ).to.be.revertedWith("minting limit exceeded");
  });

  it("Mint should revert if more tokens than max total supply are minted.", async function () {
    const { contract, sender, receiver } = await setup();
    const mintAmount = 10000;
    // Add minter roler
    await contract.addMinter(receiver.address, mintAmount);
    // Mint token
    await expect(
       contract.callStatic.mint(sender.address, mintAmount)
    ).to.be.reverted;
  });
  });

  describe("Public functions", function () {
    it("Should be able to view if an address is a minter.", async function () {
      const { contract, sender, receiver } = await setup();
      // Add minter roler
      await contract.addMinter(sender.address, 1);
      // Check if an address is minter
      expect(await contract.callStatic.isMinter(sender.address)).to.equal(true);
      // Check if an address is minter
      expect(await contract.callStatic.isMinter(receiver.address)).to.equal(false);
    });

    it("Should be able to view how many minters there are.", async function () {
      const { contract, sender, receiver, receiver1 } = await setup();
      // Add minter roler
      await contract.addMinter(sender.address, 1);
      // Minter length
      await expect(await contract.callStatic.getMinterLength()).to.equal(1);
      // Add minter roler
      await contract.addMinter(receiver.address, 1);
      await contract.addMinter(receiver1.address, 1);
      // Minter length
      await expect(await contract.callStatic.getMinterLength()).to.equal(3);
    });
  });

  describe("ERC20 Events", function () {
    it("approve should emit an {Approval} event.", async function () {
      const { contract, sender } = await setup();
      await expect(contract.approve(sender.address, 50))
      .to.emit(contract, "Approval")
    });

    it("increaseAllowance should emit an {Approval} event.", async function () {
      const { contract, sender} = await setup();
      await expect(contract.increaseAllowance(sender.address, 50)).to.emit(
        contract,
        "Approval"
      );
    });

    it("decreaseAllowance should emit an {Approval} event.", async function () {
      const { contract, sender } = await setup();
      await contract.increaseAllowance(sender.address, 50)
      await expect(contract.decreaseAllowance(sender.address, 50)).to.emit(
        contract,
        "Approval"
      );
    });

    it("transfer emit a {Transfer} event.", async function () {
      const { contract, receiver } = await setup();
      await expect(contract.transfer(receiver.address, 50)).to.emit(
        contract,
        "Transfer"
      );
    });

    it("transferFrom should emit an {Approval} event and emit a {Transfer} event.", async function () {
      const { contract, sender, receiver } = await setup();
      await contract.approve(receiver.address, 200000);
      await expect(
        contract
          .connect(receiver)
          .transferFrom(sender.address, receiver.address, 100)
      ).to.emit(contract, "Transfer");
      await expect(
        contract
          .connect(receiver)
          .transferFrom(sender.address, receiver.address, 100)
      ).to.emit(contract, "Approval");
    });

    it("_mint should emit a {Transfer} event.", async function () {
      const { contract, sender } = await setup();
      await contract.addMinter(sender.address, 1);
      await contract.burn(sender.address, 1);
      await expect(contract.mint(sender.address, 1)).to.emit(
        contract,
        "Transfer"
      );
    });

    it("burn should emit a {Transfer} event.", async function () {
      const { contract, sender } = await setup();
      await expect(contract.burn(sender.address, 50)).to.emit(
        contract,
        "Transfer"
      );
    });
  });
});
