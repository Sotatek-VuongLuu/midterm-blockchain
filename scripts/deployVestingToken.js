
const ethersJS = require("ethers");
async function main() {
    const [deployer] = await ethers.getSigners();
  
    console.log("Deploying contracts with the account:", deployer.address);
  
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    const VToken = await ethers.getContractFactory("VestingToken");
    const token = await VToken.deploy("Vesting Token", "VEST",  ethersJS.ethers.utils.parseEther("1000000"));
  
    await token.deployed();
    console.log("Token address:", token.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });