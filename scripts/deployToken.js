const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
  // Replace with your actual values
  const managerContractAddress = "0x2BE88Dd2Dc82Ec33fc8AAAa98Fe3211839eCc272"; // Manager contract address on mainnet
  const feeReceiver = "0x0287b980Ffb856cfF0cB61B926219ccf977B6fB4"; // Fee receiver address
  const feeAmount = ethers.utils.parseUnits("0.1", 18); // Payment amount in FTM
  const contractOwner = "0xf759c09456A4170DCb5603171D726C3ceBaDd3D5"; // Contract owner address
  const gasPrice = ethers.utils.parseUnits("50", "gwei"); // Gas price
  const gasLimit = 5000000; // Gas limit

  const token = {
    reserveRatio: 100, // Example reserve ratio
    name: "MyToken", // Token name
    ticker: "MTK", // Token ticker
  };
  const mintAmount = 0; // Amount to mint
  const mintAmountWFees = mintAmount * 1.01;
  const mintAmountParse = ethers.utils.parseUnits(mintAmountWFees.toString(), 18);
  const totalPayment = feeAmount.add(mintAmountParse);
  const mintValue = ethers.utils.parseUnits(mintAmount.toString(), 18);

  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Get manager contract
  const Manager = await ethers.getContractFactory("Manager");
  const manager = Manager.attach(managerContractAddress);

  // Deploy ERC20 token
  const tx = await manager.deployERC20(
    token.reserveRatio.toString(),
    token.name,
    token.ticker,
    contractOwner,
    mintValue.toString(),
    {
      value: totalPayment,
      gasLimit: gasLimit,
      gasPrice: gasPrice,
    }
  );

  // Wait for the transaction to be mined
  const receipt = await tx.wait();
  console.log("Transaction receipt:", receipt);

  // Extract the deployed contract address from the event
  const deployedEvent = receipt.events.find((event) => event.event === "ERC20Deployed");
  const contractAddress = deployedEvent.args.contractAddress;
  const txHash = receipt.transactionHash;

  console.log("Contract deployed at:", contractAddress);
  console.log("Transaction hash:", txHash);
  console.log("Deployer address:", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error deploying ERC20 token:", error);
    process.exit(1);
  });