import { getTransactionStatus } from "@/app/_utils/tx-tracing-api";
import { getPendingTransactions, postTransactionAndOHLC, postTransactionFailed } from "../_services/db-write";
import { Interface } from "ethers/lib/utils";
import ERC20TestArtifact from '../../../artifacts/contracts/ERCC20Test.sol/ERC20Test.json'


// Assuming `params` or specifically `tokenInfo` needs to be passed to access the right data
export async function checkPendingTx( chain: string, tokenAddr: string){
  try {
    const pendingTransactions = await getPendingTransactions(chain);
    const pendingTxs = pendingTransactions.filter(tx => tx.tx_status === 'pending');

    console.log("pendingTxs", pendingTxs);

    for (const tx of pendingTxs) {
      const txHash = tx.tx_hash;
      const { result, timestamp } = await getTransactionStatus(chain, txHash);
      console.log("txhash:", txHash);
    //   console.log("Details from tracing", result);
      if (result && result.status === 1) {
            // console.log(txReceipt.hash)
            // console.log(txReceipt.)
            // return txReceipt;
            const iface = new Interface(ERC20TestArtifact.abi);
            result.logs.forEach((log: any) => {
                const parsedLog = iface.parseLog(log);
                console.log(["parsed log", parsedLog])
                if (parsedLog?.name === 'ContinuousMint') {
                    console.log("Continuous Mint")
                    const info = {
                        selectedChain: chain,
                        contractAddress: tokenAddr,
                        account: parsedLog.args[0],
                        status: "successful",
                        amount: Number(parsedLog.args[1].toString()), // Ensure conversion to string before to Number if BigNumber
                        deposit: Number(parsedLog.args[2].toString()), // Same conversion as above
                        timestamp: timestamp,
                        trade: 'buy',
                        txHash: txHash
                      };
                    postTransactionAndOHLC(info).then(response => {
                    console.log('Backend response:', response);
                    // socket.emit("updated", "updated to db");                    
                    }).catch(error => {
                    console.error('Error posting data to backend:', error);
                    });
                } else if (parsedLog?.name === 'ContinuousBurn') {
                    console.log("Continuous Burn")
                    const info = {
                        selectedChain: chain,
                        contractAddress: tokenAddr,
                        account: parsedLog.args[0],
                        status: "successful",
                        amount: Number(parsedLog.args[1].toString()), // Ensure conversion to string before to Number if BigNumber
                        deposit: Number(parsedLog.args[2].toString()), // Same conversion as above
                        timestamp:timestamp,
                        trade: 'sell',
                        txHash: txHash
                      };
                    postTransactionAndOHLC(info).then(response => {
                    console.log('Backend response:', response);
                    // socket.emit("updated", "updated to db");                    
                    }).catch(error => {
                    console.error('Error posting data to backend:', error);
                    });
                }
            });

        } else if (result && result.status === 0) {
            // return 'Failure';
            const info = {
                selectedChain: chain,
                status: "failed",
                timestamp: timestamp,
                txHash: txHash
              };
              postTransactionFailed(info).then(response => {
                console.log('Backend response:', response);
              }).catch(error => {
                console.error('Error posting data to backend:', error);
              });
        } else {
            // return 'Transaction not found or pending';
        }
    }
  } catch (error) {
    console.error("Error checking pending transactions:", error);
  }
}