import { BigNumber, Contract, ContractFactory, ethers } from 'ethers'
// import ERC20TestArtifact from '@/../artifacts/contracts/ERC20Test.sol/ERC20Test.json'
import ERC20TestArtifact from '@/../artifacts/contracts/ERC20Lock.sol/ERC20Lock.json'

import { DeployTokenResult, TokenListData, TokenParams } from '../_utils/types'
// import { useWeb3ModalProvider } from '@web3modal/ethers/react'
import { calculateMinReturnWithSlippage, calculateMinTokensWithSlippage, calculateRequiredDeposit, extractLogData } from '../_utils/helpers'
import { postPendingData } from './db-write'
import ManagerArtifact from '@/../artifacts/contracts/Manager.sol/Manager.json'
// import logger from '../_utils/logger'
// import { EventParams, EventStruct, TicketStruct } from '@/utils/type.dt'
// import { globalActions } from '@/store/globalSlices'
// import { store } from '@/store'



let tx: any
// // const { walletProvider } = useWeb3ModalProvider()
// const { setEvent, setTickets } = globalActions


async function deployManager(walletProvider: any) {
  if (!walletProvider) {
    reportError('Please install/connect a browser provider')
    return Promise.reject(new Error('Browser provider not installed/not connected'))
  }

  

  const provider = new ethers.providers.Web3Provider(walletProvider); // Use MetaMask provider
  const signer = provider.getSigner();
  const network = await provider.getNetwork();
  const gasPrice = await provider.getGasPrice();
  // console.log('Current gas price:', gasPrice.toString());
  const feeReceiver = "0x0287b980Ffb856cfF0cB61B926219ccf977B6fB4"; // Replace with your address
  const feeAmount = ethers.utils.parseUnits("0.1", 18);
  const contractOwner = "0xf759c09456A4170DCb5603171D726C3ceBaDd3D5" 
  // const gasPrice = ethers.utils.parseUnits('40', 'gwei');
  const ManagerFactory = new ethers.ContractFactory(
      ManagerArtifact.abi,
      ManagerArtifact.bytecode,
      signer
  );

  try {
      const ManagerContract = await ManagerFactory.deploy(feeReceiver, feeAmount, contractOwner ,{
          gasLimit: 5000000, // Adjust based on your needs
          gasPrice: gasPrice,
      });

      // console.log("Deploying Manager contract...");

      await ManagerContract.deployed();

      // console.log("Manager contract deployed at:", ManagerContract.address);

      return ManagerContract.address;
  } catch (error) {
      // logger.error('Error deploying Manager contract:', JSON.stringify(error,null,4));
      console.error("Error deploying Manager contract:", JSON.stringify(error,null,4));
      // throw error;
  }
}

const deployToken = async (selectedChain: string, token: TokenParams, mintAmount: number, walletProvider: any): Promise<DeployTokenResult> => {
  if (!walletProvider) {
    reportError('Please install a browser provider')
    return Promise.reject(new Error('Browser provider not installed'))
  }
  let managerContractAddress = '';
  if (selectedChain === "sei"){
    // managerContractAddress = "0xF55f799E94F2908bd4482C875223fB827961C1E4"
    managerContractAddress = "0x4f37dbac5910A3463a9EF18B083b579B5Fa57D03" //test bug

  } else if (selectedChain === "ftm"){
    managerContractAddress = "0xdb9c41485C8C08B5ad216CB7d5A5Aa3cAD186aFC" //mainnet spooky
    // managerContractAddress = "0xceA6cEC23F5B1a18A97fFae0a8c06B26775Abc64" //testnet
    // managerContractAddress = "0x08A675f4297Df156Fb32A4f0ec534E6D863e706e" //mainnet
  } else {
    console.error("incorrect chain network!");
      throw new Error("incorrect chain network!");
  }

  const provider = new ethers.providers.Web3Provider(walletProvider)
  const signer = await provider.getSigner()
  const signerAddr = await signer.getAddress();
  const gasPrice = await provider.getGasPrice();
  const ManagerContract = new ethers.Contract(managerContractAddress, ManagerArtifact.abi, signer);

  try {
    // console.log("minAmount", mintAmount)
    const feeAmount = ethers.utils.parseUnits("0.1", 18) // Payment amount in ETH
    const mintAmountWFees = mintAmount *1.01
    const mintAmountParse = ethers.utils.parseUnits(mintAmountWFees.toString(), 18)
    const totalPayment = feeAmount.add(mintAmountParse);
    const mintValue = Number(mintAmountParse)
    // const gasPrice = ethers.utils.parseUnits('40', 'gwei');

    // console.log("mintValue", mintValue)
    const tx = await ManagerContract.deployERC20(
      (token.reserveRatio).toString(),
      token.name,
      token.ticker,
      signerAddr.toString(),
      mintValue.toString(),
      {
          value: totalPayment,
          gasLimit: 5000000,
          gasPrice: gasPrice,

        }
    );
     // Wait for the transaction to be mined
     const receipt = await tx.wait();

     const logData = extractLogData(receipt, signerAddr);

     // Extract the deployed contract address from the event
     const deployedEvent = receipt.events.find((event: any) => event.event === "ERC20Deployed");
     const contractAddress = deployedEvent.args.contractAddress;
     const txHash = receipt.transactionHash;

     console.log("Contract deployed at:", contractAddress);
     console.log("Transaction hash:", txHash);


    const tokenListData: TokenListData = {
      token_address: contractAddress,
      token_ticker: token.ticker,
      token_name: token.name,
      token_description: '', 
      image_url:'',
      creator:signerAddr, // Adjust accordingly
      datetime: Math.floor(Date.now() / 1000),
      tx_hash: txHash?.toString() || '' // Current timestamp
      };


    return {tokenListData, logData}

} catch (error) {
    // reportError(error)
    // logger.error('Error deploying token:', error);
    return Promise.reject(error)
  }
}

const mintToken = async (
  chain: string,
  tokenAddress: string,  
  walletProvider: any, 
  nativeSum: string,
  tokenSum: string,
  nativeTokenBool: boolean,
  tokenAmountToTrade: { toString: () => string; },
  slippage : number
  ) => {

  const reserveRatio = 50000;
  // const reserveBalance = nativeSum;
  const reserveBalance = ethers.BigNumber.from(nativeSum);
  let options: { value?: any; gasLimit?: string } = {};
  // let ethValue = 0;
  let ethValue = ethers.BigNumber.from(0); // Initialize ethValue as a BigNumber
  const feePercentage = 1;//1% fee
  const fee = Number(tokenAmountToTrade) * feePercentage / 100;
  const totalAmount = Number(tokenAmountToTrade) + fee;


    if (!walletProvider) {
        reportError('Please install a browser provider')
        return Promise.reject(new Error('Browser provider not installed'))
      }
    // const deposit_amt = toWei(amount);
    const provider = new ethers.providers.Web3Provider(walletProvider)
    const signer = await provider.getSigner()
    const signerAddr = await signer.getAddress();
    const ERC20TestContract = new Contract(tokenAddress, ERC20TestArtifact.abi, signer);
    
    if (!nativeTokenBool) {
      const bnTokenAmountToTrade = ethers.BigNumber.from(tokenAmountToTrade); 
      const bnTokenSum = ethers.BigNumber.from(tokenSum)
      // let depositAmount = calculateRequiredDeposit(tokenSum, reserveBalance, reserveRatio, Number(tokenAmountToTrade));
      let depositAmount = calculateRequiredDeposit(bnTokenSum, reserveBalance, reserveRatio, bnTokenAmountToTrade);
      // console.log("estimated deposit required", depositAmount.toString());
      // const feeDeposit = depositAmount * feePercentage;
      // const feeDeposit = depositAmount.mul(feePercentage);
      const feeBasisPoints = BigNumber.from((feePercentage * 100).toString()); // Convert to basis points (1% => 100 basis points)
      const feeDeposit = depositAmount.mul(feeBasisPoints).div(BigNumber.from(10000)); // Calculate fee as a fraction of 10000

      // let totalDepositAmount = Math.round(depositAmount.add(feeDeposit));
      let totalDepositAmount = depositAmount.add(feeDeposit);
      // console.log("total deposit amount plus fees", totalDepositAmount.toString())
      // console.log("plus fees", totalDepositAmount)
      // console.log("format depost units", ethers.utils.formatUnits(totalDepositAmount.toString(), 18))
      options = {
        value: ethers.utils.parseUnits(totalDepositAmount.toString(),0),
        gasLimit: ethers.utils.hexlify(1000000), // Correct use of hexlify
      };
      ethValue = depositAmount;
    } else {
      options = {
        value: ethers.utils.parseUnits(totalAmount.toString(), 18),
        gasLimit: ethers.utils.hexlify(1000000), // Correct use of hexlify
      };
      // ethValue = Number(ethers.utils.parseUnits(tokenAmountToTrade.toString(), 18));
      ethValue = (ethers.utils.parseUnits(tokenAmountToTrade.toString(), 18));
    }

    // console.log("ethValue used to calculate slippage", ethValue)
    try {
      let {estToken,estTokenWSlippage} = calculateMinTokensWithSlippage(Number(tokenSum), Number(reserveBalance), reserveRatio, Number(ethValue), slippage);
      
      // console.log("estToken", estToken.toString())

      let info = {
        status: 'pending',
        selectedChain: chain,
        contractAddress: tokenAddress,
        account: signerAddr,
        amount: estToken.toString(),// Ensure conversion to string before to Number if BigNumber
        deposit: ethValue.toString(), // Same conversion as above
        timestamp: Math.floor(Date.now() / 1000),
        trade: 'buy',
        txHash: ''
      };

      // console.log("amount pending", estToken.toString())
      // console.log("deposit pending", ethValue.toString())
      // Calculate gas estimate
      // const mintTx = await ERC20TestContract.mint(minTokens.toString(), options);
      const mintTx = await ERC20TestContract.mint(estTokenWSlippage.toString(), options);
      const txHash = mintTx.hash;
      // console.log("txHash", txHash);
      info.txHash = txHash;

      await postPendingData(info).then(response => {
        // console.log('Backend response:', response);
        // txid = response.primaryKey;
      }).catch((error: any) => {
        console.error('Error posting data to backend:', error);
        // logger.error('Error posting data to backend:', error);

      });

      const result = await mintTx.wait();

      // await tx.wait()
      return { result, txHash };

      // return Promise.resolve(tx)
    } catch (error) {
      // reportError(error)
      // logger.error('Error minting token:', error);
      return Promise.reject(error)
    }
  }

  const getBalance = async (tokenAddress: string,walletProvider: any): Promise<any> => {
    if (!walletProvider) {
      reportError('Please install a browser provider')
      return Promise.reject(new Error('Browser provider not installed'))
    }
    const provider = new ethers.providers.JsonRpcProvider(walletProvider)
    const signer = await provider.getSigner()
    const signerAddr = await signer.getAddress()
    const ERC20TestContract = new Contract(tokenAddress, ERC20TestArtifact.abi, provider);
    // console.log("signerAddr check", signerAddr)
    try {
      tx = await ERC20TestContract.balanceOf(signerAddr)
  
      // console.log(tx)
      // await tx.wait()
  
      return tx
    } catch (error) {
      // logger.error('Error getting user balance:', error);
      // reportError(error)
      return Promise.reject(error)
    }
  }
    
  const burnToken = async (
    chain:string,
    tokenAddress: string,  
    nativeSum : string,
    tokenSum: string,
    tokenAmountToTrade: { toString: () => any | ethers.Overrides; },
    slippage : number,
    walletProvider: any
    ) => {
    if (!walletProvider) {
        reportError('Please install a browser provider')
        return Promise.reject(new Error('Browser provider not installed'))
      }
    // const sellTokens = ethers.parseUnits(amount, 1);
    const provider = new ethers.providers.Web3Provider(walletProvider)
    const signer = await provider.getSigner()
    const signerAddr = await signer.getAddress();
    const ERC20TestContract = new Contract(tokenAddress, ERC20TestArtifact.abi, signer);
    const options = {
      gasLimit: ethers.utils.hexlify(5000000),
    };
    const reserveRatio = 50000;
   
  
    try {
      const bnTokenSum = ethers.BigNumber.from(tokenSum)
      const bnNativeSum= ethers.BigNumber.from(nativeSum)
      const bnTokenAmountToTrade = ethers.BigNumber.from(tokenAmountToTrade); 
      // const {estAmount,estAmountWSlippage} = calculateMinReturnWithSlippage(tokenSum, nativeSum, reserveRatio, Number(tokenAmountToTrade.toString()), slippage);
      const {estAmount,estAmountWSlippage} = calculateMinReturnWithSlippage(Number(bnTokenSum), Number(bnNativeSum), reserveRatio, Number(bnTokenAmountToTrade), slippage);
      // console.log("estAmount", estAmount)
      // console.log("tokenAmountToTrade", tokenAmountToTrade)

      let info = {
        status: 'pending',
        selectedChain: chain,
        contractAddress: tokenAddress,
        account: signerAddr,
        amount: tokenAmountToTrade.toString(),// Ensure conversion to string before to Number if BigNumber
        deposit: estAmount.toString(), // Same conversion as above
        timestamp: Math.floor(Date.now() / 1000),
        trade: 'sell',
        txHash: ''
      };
      const burnTx = await ERC20TestContract.burn(tokenAmountToTrade.toString(), estAmountWSlippage.toString(), options);
      const txHash = burnTx.hash;
      info.txHash = txHash;

      await postPendingData(info).then(response => {
        // console.log('Backend response: to update', response);
        // txid = response.primaryKey;
      }).catch((error: any) => {
        // logger.error('Error posting data to backend:', error);
        console.error('Error posting data to backend:', error);
      }); 
      const result = await burnTx.wait();

      return { result, txHash };
    } catch (error) {
      // logger.error('Error selling tokens:', error);
      // reportError(error)
      return Promise.reject(error)
    }
  }


  export {
    deployToken,
    mintToken,
    getBalance,
    burnToken,
    deployManager
  }