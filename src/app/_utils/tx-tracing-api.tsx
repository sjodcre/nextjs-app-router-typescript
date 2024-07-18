import { ethers } from "ethers";

// interface TraceTransactionResponse {
//     result?: any;  // Define more specific type based on the expected structure of the response
//     error?: string;
//   }
  
//     function traceTransaction(txId: string) {

//     const url = "https://rpc.sonic.fantom.network/ ";
//     // const body = JSON.stringify({
//     //   method: "trace_transaction",
//     //   params: ['0x830b79bbbf15838279a4122f336faf71c5510fb43e3050b6d4aeb894cb8955be',
//     //   {

//     //     "tracer": "callTracer"
  
//     //   }
//     // ],
//     //   id: 1,
//     //   jsonrpc: "2.0"
//     // });
  
//     // const requestOptions = {
//     //   method: 'POST',
//     //   headers: {
//     //     "Content-Type": "application/json"
//     //   },
//     //   body: body,
      
//     // };

//     var myHeaders = new Headers();

//     myHeaders.append("Content-Type", "application/json");


//     var raw = JSON.stringify({

//     "method": "trace_transaction",

//     "params": [
//         "0x830b79bbbf15838279a4122f336faf71c5510fb43e3050b6d4aeb894cb8955be"
//     ],
//     "id": 1,
//     "jsonrpc": "2.0"
//     });


//     var requestOptions = {
//         method: 'POST',
//         headers: myHeaders,
//         body: raw,
//         };
//     fetch(url, requestOptions)
//     .then(response => response.text())
//     .then(result => console.log(result))
//     .catch(error => console.log('error', error));
  
//     // try {
//     //   const response = await fetch(url, requestOptions);
//     //   const result = await response.json();
//     // //   console.log("result from POST", result)
//     //   return result; // return the parsed JSON result directly
//     // } catch (error) {
//     //   console.error('Error tracing transaction:', error);
//     //   throw new Error('Failed to trace transaction');
//     // }
//   }

  export default async function getTransactionStatus(chainId:string, txHash: string): Promise<{result: ethers.providers.TransactionReceipt, timestamp: number}> {
    let url = ''
    if (chainId === 'ftm'){
        // url = 'https://rpc.sonic.fantom.network/'
        url = 'https://fantom-rpc.publicnode.com/'
    } else if ( chainId ==='sei') {
        url = 'https://evm-rpc-arctic-1.sei-apis.com/'
    } else {
        throw new Error('incorrect chain id!')
    }
    const provider = new ethers.providers.JsonRpcProvider(url);

    try {
        const txReceipt = await provider.getTransactionReceipt(txHash);
        if (!txReceipt) {
            throw new Error('Transaction receipt not found.');
        }
        const block = await provider.getBlock(txReceipt.blockNumber);
        return { result: txReceipt, timestamp: block.timestamp };

        // return txReceipt
    } catch (error) {
        console.error('Error fetching transaction receipt:', error);
        throw error;
    }
}
  
