import { ethers } from 'ethers';
import ERC20TestArtifact from '@/../artifacts/contracts/ERC20Lock.sol/ERC20Lock.json'
import { postTransactionAndOHLC } from '../_services/db-write';
import * as Sentry from '@sentry/nextjs';

// Function to handle logs parsing and storing data
const handleLogs = async (
    result: any, 
    isPhaseTwo: boolean, 
    chain: string, 
    ERC20TestContractAddress: string, 
    buySell: string, 
    txHash: string, 
    tokenDetails: any,
    emitEvent: (event: string, data: any) => void // Accept emitEvent as an argument
    ) => {
  if (result.status === 1) {

    if (isPhaseTwo) {
        // console.log("phase 2 so do no logging")
      // Handle Phase Two logs
    //   const account = result.from;
    //   const amount = hexToNumber(result.logs[2].data);
    //   const deposit = hexToNumber(result.logs[1].data);
    //   console.log("account", account)
    //   console.log("amount", amount)
    //   console.log("deposit", deposit)

    //   const info = {
    //     selectedChain: chain,
    //     contractAddress: ERC20TestContractAddress,
    //     account: account,
    //     status: "successful",
    //     amount: amount,
    //     deposit: deposit,
    //     timestamp: Math.floor(Date.now() / 1000),
    //     trade: buySell.toString(),
    //     txHash: txHash
    //   };

    //   postTransactionAndOHLC(info, false).then(response => {
    //     console.log('Backend response:', response.message);
    //     const updatedInfo = {
    //       ...info,
    //       txid: response.txid,
    //       token_ticker: tokenDetails?.token_ticker,
    //       token_name: tokenDetails?.token_name,
    //       token_description: tokenDetails?.token_description
    //     };
    //     emitEvent("updated", updatedInfo);

    //   }).catch(error => {
    //     console.error('Error posting data to backend:', error);
    //   });
    } else {
      // Handle Phase One logs
      const iface = new ethers.utils.Interface(ERC20TestArtifact.abi);

      result.logs.forEach((log: any) => {
        try {
          const parsedLog = iface.parseLog(log);
          if (parsedLog?.name === 'ContinuousMint') {
            // console.log('ContinuousMint Event Args:', parsedLog.args);

            const info = {
              selectedChain: chain,
              contractAddress: ERC20TestContractAddress,
              account: parsedLog.args[0],
              status: "successful",
              // amount: Number(parsedLog.args[1].toString()), // Ensure conversion to string before to Number if BigNumber
              amount: parsedLog.args[1].toString(), // Ensure conversion to string before to Number if BigNumber
              // deposit: Number(parsedLog.args[2].toString()), // Same conversion as above
              deposit: parsedLog.args[2].toString(), // Same conversion as above
              timestamp: Math.floor(Date.now() / 1000),
              trade: buySell.toString(),
              txHash: txHash
            };

            postTransactionAndOHLC(info, false).then(response => {
              // console.log('Backend response:', response.message);
              const updatedInfo = {
                ...info,
                txid: response.txid,
                bondingPrice: response.bondingPrice, // Include the bondingPrice here
                token_ticker: tokenDetails?.token_ticker,
                token_name: tokenDetails?.token_name,
                token_description: tokenDetails?.token_description
              };
              emitEvent("updated", updatedInfo);

            }).catch(error => {
              console.error('Error posting data to backend:', error);
            });
          } else if (parsedLog?.name === 'ContinuousBurn') {
            // console.log("Continuous Burn")
            const info = {
                selectedChain: chain,
                contractAddress: ERC20TestContractAddress,
                account: parsedLog.args[0],
                status: "successful",
                // amount: Number(parsedLog.args[1].toString()), // Ensure conversion to string before to Number if BigNumber
                amount: parsedLog.args[1].toString(), // Ensure conversion to string before to Number if BigNumber
                // deposit: Number(parsedLog.args[2].toString()), // Same conversion as above
                deposit: parsedLog.args[2].toString(), // Same conversion as above
                timestamp:Math.floor(Date.now() / 1000),
                trade: buySell.toString(),
                txHash: txHash
              };
            postTransactionAndOHLC(info, false).then(response => {
            // console.log('Backend response:', response.message);
            const updatedInfo = {
              ...info,
              txid: response.txid,
              bondingPrice: response.bondingPrice, // Include the bondingPrice here
              token_ticker: tokenDetails?.token_ticker,
              token_name: tokenDetails?.token_name,
              token_description: tokenDetails?.token_description
            };
            emitEvent("updated", updatedInfo);
          }).catch(error => {
            console.error('Error posting data to backend:', error);
            });
          }
        } catch (error) {
          const comment = "Error handling log  after transaction"
          Sentry.captureException(error, { extra: { comment } });
          // This log was not from our contract
          console.error("Error parsing log:", error);
        }
      });
    }
  }
};

export default handleLogs;
