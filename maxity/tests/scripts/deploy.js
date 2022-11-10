const hre = require("hardhat");

const main = async () => {
  const arguments = ["Test","tst"];

  const Contract = await hre.ethers.getContractFactory("Maxity");
  const contract = await Contract.deploy(...arguments);

  await contract.deployed();

  console.log("contract deployed to:", contract.address);

  await hre.run("verify:verify", {
    address: contract.address,
    constructorArguments: arguments,
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });