// backend/listeners/blockchainListener.ts
import { Contract, ethers } from "ethers";
import ERC20TestArtifact from '../../../artifacts/contracts/ERCC20Test.sol/ERC20Test.json';
// import WebSocket from 'ws';

// const provider = new providers.JsonRpcProvider("YOUR_BLOCKCHAIN_RPC_URL");
// const provider = new ethers.JsonRpcProvider("wss://evm-ws-arctic-1.sei-apis.com")

// const contractAddress = "YOUR_CONTRACT_ADDRESS";
// // const contract = new Contract(contractAddress, ERC20TestABI, provider);
// const ERC20TestContract = new Contract(contractAddress, ERC20TestArtifact.abi, provider);
const seiWebSocket = "wss://evm-ws-arctic-1.sei-apis.com";

  function createWebSocket() {
    const ws = new WebSocket (seiWebSocket);
    ws.onopen = () => {
      console.log('WebSocket connection established');
      // Set up your ethers provider here if needed
    };

    ws.onmessage = (event) => {
      console.log('Received message:', event.data);
      // Handle incoming WebSocket messages here
    };

    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
  
    // ws.close();
    return ws;
  }


const listenToEvents = (ERC20TestContractAddress: string) => {
    
    const wsProvider = new ethers.WebSocketProvider(createWebSocket())
    const contract = new ethers.Contract(
    ERC20TestContractAddress.toString(), 
    ERC20TestArtifact.abi, 
    wsProvider);
    console.log("WebSocket provider set up:", wsProvider);
    console.log("Contract initialized and listening for events at address:", ERC20TestContractAddress);
    // wsProvider.on('open', () => {
    //     console.log('WebSocket connection established');
    //   });
      
    //   // Log any errors with the WebSocket
    //   wsProvider.on('error', (error) => {
    //     console.error('WebSocket error:', error);
    //   });
      
    //   // Log when the WebSocket is disconnected
    //   wsProvider.on('close', () => {
    //     console.log('WebSocket connection closed');
    //   });
    contract.on("Transfer", (from, to, value)=> {
        console.log("src: ", from);
        console.log("dst: ", to)
        console.log("wad: ", value)
        // console.log("event: ", event)

    })

    const handleEvent = (account:any, amount:any, deposit:any) => {
        console.log(`Event - Account: ${account}, Amount: ${amount.toString()}, Deposit: ${deposit.toString()} `);

    };
  
      contract.on("ContinuousMint", (account, amount, deposit) => handleEvent(account, amount, deposit));
      contract.on("ContinuousBurn", (account, amount, reimburseAmount) => handleEvent(account, amount, reimburseAmount));
};

export default listenToEvents;