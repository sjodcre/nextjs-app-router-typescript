// import { ethers } from 'ethers';
const ethers = require('ethers');
// import ERC20TestArtifact from '@/../artifacts/contracts/ERC20Lock.sol/ERC20Lock.json'; // Ensure you provide the correct path to your ABI
// const ERC20TestArtifact = require('./artifacts/contracts/ERC20Lock.sol/ERC20Lock.json');
const path = require('path');
const abiPath = path.resolve(__dirname, '../artifacts/contracts/ERC20Lock.sol/ERC20Lock.json');
const ERC20TestArtifact = require(abiPath);

// Function to handle native token withdrawal
async function handleWithdrawNative(provider, contractAddress, withdrawAmount, signer) {
  const withdrawAmountInWei = ethers.utils.parseUnits(withdrawAmount, 18);
  const ERC20LockContract = new ethers.Contract(contractAddress, ERC20TestArtifact.abi, signer);

  try {
    const options = { gasLimit: ethers.utils.hexlify(5000000) };
    const withdrawResp = await ERC20LockContract.withdrawNativeTokens(withdrawAmountInWei, options);
    console.log("Withdrawal response:", withdrawResp);
  } catch (error) {
    console.error("Error withdrawing native tokens:", error);
  }
}

// Main function to execute the script
async function main() {
  // Get input arguments
  const tokenAddress = process.argv[2];
  const privateKey = process.argv[3];
  const providerUrl = 'https://fantom-rpc.publicnode.com/'; // Use your Infura project ID or other provider URL

  if (!tokenAddress || !privateKey) {
    console.error("Token address and private key are required.");
    process.exit(1);
  }

  // Initialize ethers provider and wallet
  const provider = new ethers.providers.JsonRpcProvider(providerUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  

  // Perform withdrawal
  const withdrawNativeAmount = '0.4'; // Amount to withdraw in ETH
  await handleWithdrawNative(provider, tokenAddress, withdrawNativeAmount, wallet);
}

// Execute main function
main().catch(console.error);
