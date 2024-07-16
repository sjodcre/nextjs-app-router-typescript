// import { ethers } from 'ethers';
const ethers = require('ethers');
// import ERC20TestArtifact from '@/../artifacts/contracts/ERC20Lock.sol/ERC20Lock.json'; // Ensure you provide the correct path to your ABI
// const ERC20TestArtifact = require('./artifacts/contracts/ERC20Lock.sol/ERC20Lock.json');
const path = require('path');
const abiPath = path.resolve(__dirname, '../artifacts/contracts/ERC20Lock.sol/ERC20Lock.json');
const ERC20TestArtifact = require(abiPath);

// Function to handle ERC20 token withdrawal
async function handleWithdrawToken(provider, contractAddress, withdrawAmount, tokenAddress, signer) {
     const withdrawAmountInWei = ethers.utils.parseUnits(withdrawAmount, 18);
//   const gasPrice = ethers.utils.parseUnits('20', 'gwei');
    console.log("withdraw amount", withdrawAmountInWei.toString())
    const gasPrice = await provider.getGasPrice();
    
    console.log('Current gas price:', gasPrice.toString());
    const ERC20LockContract = new ethers.Contract(contractAddress, ERC20TestArtifact.abi, signer);

    try {
        const options = { gasLimit: 5000000, gasPrice };
        const balance = await ERC20LockContract.balanceOf(tokenAddress.toString());
        console.log("available balance", balance.toString())
        const withdrawResp = await ERC20LockContract.withdrawERC20Tokens(tokenAddress, withdrawAmountInWei, options);
        console.log("Withdrawal response:", withdrawResp);
        const receipt = await withdrawResp.wait();
        console.log('Transaction receipt:', receipt);
    } catch (error) {
        console.error("Error withdrawing ERC20 tokens:", error);
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
    const withdrawTokenAmount = '3'; // Amount to withdraw in tokens
    await handleWithdrawToken(provider, tokenAddress, withdrawTokenAmount, tokenAddress, wallet);
}

// Execute main function
main().catch(console.error);
