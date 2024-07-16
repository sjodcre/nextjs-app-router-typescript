const ethers = require('ethers');
const path = require('path');
const abiPath = path.resolve(__dirname, '../artifacts/contracts/ERC20Lock.sol/ERC20Lock.json');
const ERC20TestArtifact = require(abiPath);

// Function to unpause the contract
async function handleUnpause(provider, contractAddress, signer) {
    const ERC20LockContract = new ethers.Contract(contractAddress, ERC20TestArtifact.abi, signer);

    try {
        const pauseStatus = await ERC20LockContract.paused();
        console.log("Pause status:", pauseStatus);
        if (pauseStatus) {
            console.log("Currently paused. Unpausing...");
            const options = { gasLimit: ethers.utils.hexlify(5000000) };
            const pauseResp = await ERC20LockContract.unpause(options);
            console.log("Unpause response:", pauseResp);
        } else {
            console.log("Contract is not paused.");
        }
    } catch (error) {
        console.error("Error unpausing the contract:", error);
        throw error;
    }
}

// Main function to execute the script
async function main() {
    // Get input arguments
    const contractAddress = process.argv[2];
    const privateKey = process.argv[3];
    const providerUrl = 'https://fantom-rpc.publicnode.com/'; // Use your Infura project ID or other provider URL

    if (!contractAddress || !privateKey) {
        console.error("Contract address and private key are required.");
        process.exit(1);
    }

    // Initialize ethers provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // Perform unpause
    await handleUnpause(provider, contractAddress, wallet);
}

// Execute main function
main().catch(console.error);
