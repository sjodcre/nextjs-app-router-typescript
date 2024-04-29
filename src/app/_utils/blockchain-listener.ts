// backend/listeners/blockchainListener.ts
import { Contract, ethers } from "ethers";
// import { ERC20TestABI } from "../../artifacts/contracts/ERCC20Test.sol/"; // ABI of your contract
import ERC20TestArtifact from '../../../artifacts/contracts/ERCC20Test.sol/ERC20Test.json';

// const provider = new providers.JsonRpcProvider("YOUR_BLOCKCHAIN_RPC_URL");
const provider = new ethers.JsonRpcProvider("https://evm-rpc.arctic-1.seinetwork.io")

const contractAddress = "YOUR_CONTRACT_ADDRESS";
// const contract = new Contract(contractAddress, ERC20TestABI, provider);
const ERC20TestContract = new Contract(contractAddress, ERC20TestArtifact.abi, provider);


const listenToEvents = () => {
  ERC20TestContract.on("ContinuousMint", (account, amount, deposit, event) => {
        // Handle mint event
        console.log(`Mint | Account: ${account} | Amount: ${amount} | Deposit: ${deposit}`);
        // Update OHLC logic here
    });

    ERC20TestContract.on("ContinuousBurn", (account, amount, reimburseAmount, event) => {
        // Handle burn event
        console.log(`Burn | Account: ${account} | Amount: ${amount} | Reimburse: ${reimburseAmount}`);
        // Update OHLC logic here
    });
};

export default listenToEvents;