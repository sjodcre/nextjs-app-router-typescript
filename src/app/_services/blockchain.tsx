import { Contract, ContractFactory, ethers } from 'ethers'
import address from '@/../contracts/contractAddress.json'
import ERC20TestArtifact from '@/../artifacts/contracts/ERCC20Test.sol/ERC20Test.json'
import { TokenListData, TokenParams } from '../_utils/types'
import { useWeb3ModalProvider } from '@web3modal/ethers/react'

// import { EventParams, EventStruct, TicketStruct } from '@/utils/type.dt'
// import { globalActions } from '@/store/globalSlices'
// import { store } from '@/store'

const toWei = (num: number) => ethers.parseEther(num.toString())
const fromWei = (num: number) => ethers.formatEther(num)

let ethereum: any
let tx: any
// const { walletProvider } = useWeb3ModalProvider()
if (typeof window !== 'undefined') ethereum = (window as any).ethereum
// const { setEvent, setTickets } = globalActions

const getEthereumContracts = async () => {
  const accounts = await ethereum?.request?.({ method: 'eth_accounts' })

  if (accounts?.length > 0) {
    const provider = new ethers.BrowserProvider(ethereum)
    const signer = await provider.getSigner()
    const contracts = new ethers.Contract(address.contract, ERC20TestArtifact.abi, signer)

    return contracts
  } else {
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL)
    const wallet = ethers.Wallet.createRandom()
    const signer = wallet.connect(provider)
    const contracts = new ethers.Contract(address.contract, ERC20TestArtifact.abi, signer)

    return contracts
  }
}

const deployToken = async (token: TokenParams, walletProvider: any): Promise<TokenListData> => {
  if (!walletProvider) {
    reportError('Please install a browser provider')
    return Promise.reject(new Error('Browser provider not installed'))
  }

  const provider = new ethers.BrowserProvider(walletProvider)
  const signer = await provider.getSigner()
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
      console.log("finding tx id...")
      // console.log(ERC20Contract)
      await ERC20Contract.deploymentTransaction()?.wait(1); // Wait for at least one confirmation

      const txHash = ERC20Contract.deploymentTransaction()?.hash;
      // const contractAddress = ERC20Contract.address;  // Contract address can be retrieved directly
      // const txHash = ERC20Contract.deploymentTransaction(); 
      const contractAddress = await ERC20Contract.getAddress(); // Correctly await the address
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
        creator:signer.address, // Adjust accordingly
        datetime: Math.floor(Date.now() / 1000),
        tx_hash: txHash?.toString() || '' // Current timestamp
        };
      // await postTokenData({
      //   token_address: contractAddress,
      //   token_symbol: token.symbol,
      //   token_name: token.name,
      //   token_description: "Test deploy store backend 1", // Add more details if necessary
      //   creator:signer.address, // Adjust accordingly
      //   datetime: Math.floor(Date.now() / 1000) // Current timestamp
      // });

      return tokenListData

  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const mintToken = async (tokenAddress: string,  amount: number, walletProvider: any): Promise<void> => {
    if (!walletProvider) {
        reportError('Please install a browser provider')
        return Promise.reject(new Error('Browser provider not installed'))
      }
    const deposit_amt = toWei(amount);
    const provider = new ethers.BrowserProvider(walletProvider)
    const signer = await provider.getSigner()
    const ERC20TestContract = new Contract(tokenAddress, ERC20TestArtifact.abi, signer);
    
    try {
      // const contract = await getEthereumContracts()
      tx = await ERC20TestContract.mint({value: deposit_amt})

      await tx.wait()
  
      return Promise.resolve(tx)
    } catch (error) {
      reportError(error)
      return Promise.reject(error)
    }
  }

  const getBalance = async (tokenAddress: string,walletProvider: any): Promise<any> => {
    if (!walletProvider) {
      reportError('Please install a browser provider')
      return Promise.reject(new Error('Browser provider not installed'))
    }
    const provider = new ethers.BrowserProvider(walletProvider)
    const signer = await provider.getSigner()
    const ERC20TestContract = new Contract(tokenAddress, ERC20TestArtifact.abi, provider);
    console.log(signer.address)
    try {
      // const contract = await getEthereumContracts()
      tx = await ERC20TestContract.balanceOf(signer.address)
  
      console.log(tx)
      // await tx.wait()
  
      return tx
    } catch (error) {
      reportError(error)
      return Promise.reject(error)
    }
  }
  
  
  const burnToken = async (tokenAddress: string,  amount: string, walletProvider: any): Promise<void> => {
    if (!walletProvider) {
        reportError('Please install a browser provider')
        return Promise.reject(new Error('Browser provider not installed'))
      }
    // const sellTokens = ethers.parseUnits(amount, 1);
    const provider = new ethers.BrowserProvider(walletProvider)
    const signer = await provider.getSigner()
    const ERC20TestContract = new Contract(tokenAddress, ERC20TestArtifact.abi, signer);
  
    try {
      // const contract = await getEthereumContracts()
      tx = await ERC20TestContract.burn(amount, {gasLimit: ethers.toBeHex(1000000)})
  
      await tx.wait()
  
      return Promise.resolve(tx)
    } catch (error) {
      reportError(error)
      return Promise.reject(error)
    }
  }


  export {
    deployToken,
    mintToken,
    getBalance,
    burnToken
  }