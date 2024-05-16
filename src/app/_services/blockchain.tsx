import { Contract, ContractFactory, ethers } from 'ethers'
import address from '@/../contracts/contractAddress.json'
import ERC20TestArtifact from '@/../artifacts/contracts/ERCC20Test.sol/ERC20Test.json'
import { TokenListData, TokenParams } from '../_utils/types'
// import { useWeb3ModalProvider } from '@web3modal/ethers/react'
import { calculateMinReturnWithSlippage, calculateMinTokensWithSlippage, calculateRequiredDeposit } from '../_utils/helpers'
import { postTransactionData } from './db-write'

// import { EventParams, EventStruct, TicketStruct } from '@/utils/type.dt'
// import { globalActions } from '@/store/globalSlices'
// import { store } from '@/store'



let ethereum: any
let tx: any
// const { walletProvider } = useWeb3ModalProvider()
if (typeof window !== 'undefined') ethereum = (window as any).ethereum
// const { setEvent, setTickets } = globalActions

const deployToken = async (token: TokenParams, walletProvider: any): Promise<TokenListData> => {
  if (!walletProvider) {
    reportError('Please install a browser provider')
    return Promise.reject(new Error('Browser provider not installed'))
  }

  const provider = new ethers.providers.Web3Provider(walletProvider)
  const signer = await provider.getSigner()
  let signer2 = signer.connect
  const ERC20_Token = new ContractFactory(
      ERC20TestArtifact.abi,
      ERC20TestArtifact.bytecode,
      signer
  );

  try {

      
      const ERC20Contract = await ERC20_Token.deploy(
          Number(token.reserveRatio),
          token.name,
          token.ticker,
          {
            gasLimit: 5000000  // Adjust this number based on your needs
          }
      );
      // console.log("finding tx id...")
      // console.log(ERC20Contract)
      // await ERC20Contract.deployed().
      // await ERC20Contract.deploymentTransaction()?.wait(1); // Wait for at least one confirmation
      const txHash = ERC20Contract.deployTransaction.hash;
      await ERC20Contract.deployed();
      // const txHash = ERC20Contract.deploymentTransaction()?.hash;
      const contractAddress = ERC20Contract.address;  // Contract address can be retrieved directly
      // const txHash = ERC20Contract.deploymentTransaction(); 
      // const contractAddress = await ERC20Contract.getAddress(); // Correctly await the address
      const signerAddr = await signer.getAddress();
      console.log("signerAddr check", signerAddr)
      // toast.alert(`Contract deployed to: ${contractAddress}`);
      // console.log(`Transaction hash: ${receipt}`);

      // console.log(`Transaction hash: `, JSON.stringify(receipt,null,4));
      // console.log(`Transaction hash: `, JSON.stringify(txHash,null,4));
        
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
  let depositAmount = calculateRequiredDeposit(tokenSum, reserveBalance, reserveRatio, Number(tokenAmountToTrade));

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
      console.log("estimated deposit required", depositAmount);
      console.log("format depost units", ethers.utils.formatUnits(depositAmount.toString(), 18))
      options = {
        value: ethers.utils.parseUnits(depositAmount.toString(), 1),
        gasLimit: ethers.utils.hexlify(1000000), // Correct use of hexlify
      };
      ethValue = depositAmount;
    } else {
      options = {
        value: ethers.utils.parseUnits(tokenAmountToTrade.toString(), 18),
        gasLimit: ethers.utils.hexlify(1000000), // Correct use of hexlify
      };
      ethValue = Number(ethers.utils.parseUnits(tokenAmountToTrade.toString(), 18));
    }
    
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
        deposit: Number(options.value.toString()), // Same conversion as above
        timestamp: Math.floor(Date.now() / 1000),
        trade: 'buy',
        txHash: ''
      };
      let txid = '';


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
      gasLimit: ethers.utils.hexlify(1000000),
    };
    const reserveRatio = 50000;
   
  
    try {
      const minReturn = calculateMinReturnWithSlippage(tokenSum, nativeSum, reserveRatio, Number(tokenAmountToTrade.toString()), slippage);
      console.log("minReturn", minReturn)
      console.log("tokenAmountToTrade", tokenAmountToTrade)

      let info = {
        status: 'pending',
        selectedChain: chain,
        contractAddress: tokenAddress,
        account: signerAddr,
        amount: Number(tokenAmountToTrade.toString()),// Ensure conversion to string before to Number if BigNumber
        deposit: Number(minReturn.toString()), // Same conversion as above
        timestamp: Math.floor(Date.now() / 1000),
        trade: 'sell',
        txHash: ''
      };
      // const contract = await getEthereumContracts()
      const burnTx = await ERC20TestContract.burn(tokenAmountToTrade.toString(), minReturn.toString(), options);
      const txHash = burnTx.hash;
      info.txHash = txHash;

      await postTransactionData(info).then(response => {
        console.log('Backend response:', response);
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
    burnToken
  }