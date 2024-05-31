import { Contract, ContractFactory, ethers } from 'ethers'
// import ERC20TestArtifact from '@/../artifacts/contracts/ERC20Test.sol/ERC20Test.json'
import ERC20TestArtifact from '@/../artifacts/contracts/ERC20Lock.sol/ERC20Lock.json'

import { TokenListData, TokenParams } from '../_utils/types'
// import { useWeb3ModalProvider } from '@web3modal/ethers/react'
import { calculateMinReturnWithSlippage, calculateMinTokensWithSlippage, calculateRequiredDeposit } from '../_utils/helpers'
import { postTransactionData } from './db-write'
import ManagerArtifact from '@/../artifacts/contracts/Manager.sol/Manager.json'
// import { EventParams, EventStruct, TicketStruct } from '@/utils/type.dt'
// import { globalActions } from '@/store/globalSlices'
// import { store } from '@/store'



let ethereum: any
let tx: any
// const { walletProvider } = useWeb3ModalProvider()
if (typeof window !== 'undefined') ethereum = (window as any).ethereum
// const { setEvent, setTickets } = globalActions


async function deployManager(walletProvider: any) {
  if (!walletProvider) {
    reportError('Please install/connect a browser provider')
    return Promise.reject(new Error('Browser provider not installed/not connected'))
  }

  const provider = new ethers.providers.Web3Provider(walletProvider); // Use MetaMask provider
  const signer = provider.getSigner();
  const feeReceiver = "0x0287b980Ffb856cfF0cB61B926219ccf977B6fB4"; // Replace with your address
  const feeAmount = ethers.utils.parseUnits("0.1", 18);
  const contractOwner = "0xf759c09456A4170DCb5603171D726C3ceBaDd3D5" 

  const ManagerFactory = new ethers.ContractFactory(
      ManagerArtifact.abi,
      ManagerArtifact.bytecode,
      signer
  );

  try {
      const ManagerContract = await ManagerFactory.deploy(feeReceiver, feeAmount, contractOwner ,{
          gasLimit: 10000000 // Adjust based on your needs
      });

      console.log("Deploying Manager contract...");

      await ManagerContract.deployed();

      console.log("Manager contract deployed at:", ManagerContract.address);

      return ManagerContract.address;
  } catch (error) {
      console.error("Error deploying Manager contract:", error);
      throw error;
  }
}

const deployToken = async (selectedChain: string, token: TokenParams, mintAmount: number, walletProvider: any): Promise<TokenListData> => {
  if (!walletProvider) {
    reportError('Please install a browser provider')
    return Promise.reject(new Error('Browser provider not installed'))
  }
  let managerContractAddress = '';
  if (selectedChain === "sei"){
    // managerContractAddress = "0xF55f799E94F2908bd4482C875223fB827961C1E4"
    managerContractAddress = "0x4F5b661a97235Bd129416eDbF070b35842EB7691" //test bug

  } else if (selectedChain === "ftm"){
    // managerContractAddress = "0x9CE7A39Eaa1B8df86f48828799276d213C1a4761"
    managerContractAddress = "0xceA6cEC23F5B1a18A97fFae0a8c06B26775Abc64" //test bug
  } else {
    console.error("incorrect chain network!");
      throw new Error("incorrect chain network!");
  }
  const provider = new ethers.providers.Web3Provider(walletProvider)
  const signer = await provider.getSigner()
  const signerAddr = await signer.getAddress();
  const ManagerContract = new ethers.Contract(managerContractAddress, ManagerArtifact.abi, signer);
  
  // const ERC20_Token = new ContractFactory(
  //     ERC20TestArtifact.abi,
  //     ERC20TestArtifact.bytecode,
  //     signer
  // );
  

  try {

    // const ERC20Contract = await ERC20_Token.deploy(
    //     Number(token.reserveRatio),
    //     token.name,
    //     token.ticker,
    //     {
    //       gasLimit: 5000000  // Adjust this number based on your needs
    //     }
    // );

    // const txHash = ERC20Contract.deployTransaction.hash;
    // await ERC20Contract.deployed();
    // const contractAddress = ERC20Contract.address;  // Contract address can be retrieved directly
    console.log("minAmount", mintAmount)
    const feeAmount = ethers.utils.parseUnits("0.1", 18) // Payment amount in ETH
    const mintAmountWFees = mintAmount *1.01
    const mintAmountParse = ethers.utils.parseUnits(mintAmountWFees.toString(), 18)
    const totalPayment = feeAmount.add(mintAmountParse);
    const mintValue = Number(mintAmountParse)
    console.log("mintValue", mintValue)
    const tx = await ManagerContract.deployERC20(
      (token.reserveRatio).toString(),
      token.name,
      token.ticker,
      signerAddr.toString(),
      mintValue.toString(),
      {
          value: totalPayment,
          gasLimit: ethers.utils.hexlify(10000000) // Adjust this number based on your needs
      }
    );
     // Wait for the transaction to be mined
     const receipt = await tx.wait();
     console.log("Transaction receipt:", receipt);

     // Extract the deployed contract address from the event
     const deployedEvent = receipt.events.find((event: any) => event.event === "ERC20Deployed");
     const contractAddress = deployedEvent.args.contractAddress;
     const txHash = receipt.transactionHash;

     console.log("Contract deployed at:", contractAddress);
     console.log("Transaction hash:", txHash);
     console.log("Signer address:", signerAddr);


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

    return tokenListData

} catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const mintToken = async (
  chain: string,
  tokenAddress: string,  
  walletProvider: any, 
  nativeSum: number,
  tokenSum: number,
  nativeTokenBool: boolean,
  tokenAmountToTrade: { toString: () => string; },
  slippage : number
  ) => {

  const reserveRatio = 50000;
  const reserveBalance = nativeSum;
  let options: { value?: any; gasLimit?: string } = {};
  let ethValue = 0;
  const feePercentage = 0.01;
  const fee = Number(tokenAmountToTrade) * feePercentage;
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
      let depositAmount = calculateRequiredDeposit(tokenSum, reserveBalance, reserveRatio, Number(tokenAmountToTrade));
      // console.log("estimated deposit required", depositAmount);
      const feeDeposit = depositAmount * feePercentage;
      let totalDepositAmount = Math.round(depositAmount + feeDeposit);
      // console.log("plus fees", totalDepositAmount)
      // console.log("format depost units", ethers.utils.formatUnits(totalDepositAmount.toString(), 18))
      options = {
        value: ethers.utils.parseUnits(totalDepositAmount.toString(),0),
        gasLimit: ethers.utils.hexlify(1000000), // Correct use of hexlify
      };
      ethValue = depositAmount;
    } else {
      console.log("totalAmount pre estimate gas", totalAmount)
      options = {
        value: ethers.utils.parseUnits(totalAmount.toString(), 18),
        gasLimit: ethers.utils.hexlify(1000000), // Correct use of hexlify
      };
      ethValue = Number(ethers.utils.parseUnits(tokenAmountToTrade.toString(), 18));
    }

    // console.log("ethValue used to calculate slippage", ethValue)
    try {
      // const contract = await getEthereumContracts()
      const {estToken,estTokenWSlippage} = calculateMinTokensWithSlippage(tokenSum, reserveBalance, reserveRatio, ethValue, slippage);
      
      console.log("estTokenWSlippage", estTokenWSlippage)
      console.log("estToken", estToken)
      let info = {
        status: 'pending',
        selectedChain: chain,
        contractAddress: tokenAddress,
        account: signerAddr,
        amount: Number(estToken.toString()),// Ensure conversion to string before to Number if BigNumber
        deposit: ethValue, // Same conversion as above
        timestamp: Math.floor(Date.now() / 1000),
        trade: 'buy',
        txHash: ''
      };

      // Calculate gas estimate
      // const mintTx = await ERC20TestContract.mint(minTokens.toString(), options);
      const mintTx = await ERC20TestContract.mint(estTokenWSlippage.toString(), options);
      const txHash = mintTx.hash;
      console.log("txHash", txHash);
      info.txHash = txHash;

      await postTransactionData(info).then(response => {
        console.log('Backend response:', response);
        // txid = response.primaryKey;
      }).catch((error: any) => {
        console.error('Error posting data to backend:', error);
      });

      const result = await mintTx.wait();

      // await tx.wait()
      return { result, txHash };

      // return Promise.resolve(tx)
    } catch (error) {
      // console.log("is it this error?")
      // reportError(error)
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
    console.log("signerAddr check", signerAddr)
    try {
      // const contract = await getEthereumContracts()
      tx = await ERC20TestContract.balanceOf(signerAddr)
  
      console.log(tx)
      // await tx.wait()
  
      return tx
    } catch (error) {
      reportError(error)
      return Promise.reject(error)
    }
  }
  
  
  const burnToken = async (
    chain:string,
    tokenAddress: string,  
    nativeSum : number,
    tokenSum: number,
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
      console.log("tokenSum",tokenSum)
      console.log("nativeSum", nativeSum)
      console.log("slippage",slippage)
      const {estAmount,estAmountWSlippage} = calculateMinReturnWithSlippage(tokenSum, nativeSum, reserveRatio, Number(tokenAmountToTrade.toString()), slippage);
      console.log("estAmount", estAmount)
      console.log("tokenAmountToTrade", tokenAmountToTrade)

      let info = {
        status: 'pending',
        selectedChain: chain,
        contractAddress: tokenAddress,
        account: signerAddr,
        amount: Number(tokenAmountToTrade.toString()),// Ensure conversion to string before to Number if BigNumber
        deposit: Number(estAmount.toString()), // Same conversion as above
        timestamp: Math.floor(Date.now() / 1000),
        trade: 'sell',
        txHash: ''
      };
      // const contract = await getEthereumContracts()
      const burnTx = await ERC20TestContract.burn(tokenAmountToTrade.toString(), estAmountWSlippage.toString(), options);
      const txHash = burnTx.hash;
      info.txHash = txHash;

      await postTransactionData(info).then(response => {
        // console.log('Backend response: to update', response);
        // txid = response.primaryKey;
      }).catch((error: any) => {
        console.error('Error posting data to backend:', error);
      }); 
      const result = await burnTx.wait();

      return { result, txHash };
    } catch (error) {
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