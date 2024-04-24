import { ContractFactory, ethers } from 'ethers'
import address from '@/../contracts/contractAddress.json'
import ERC20TestArtifact from '@/../artifacts/contracts/ERCC20Test.sol/ERC20Test.json'
import { TokenParams } from '../_utils/types'
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

const deployToken = async (token: TokenParams): Promise<string> => {
    if (!ethereum) {
      reportError('Please install a browser provider')
      return Promise.reject(new Error('Browser provider not installed'))
    }

    const provider = new ethers.BrowserProvider(ethereum)
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
            token.symbol
        );
      
        const contractAddress = await ERC20Contract.getAddress(); // Correctly await the address
        window.alert(`Contract deployed to: ${contractAddress}`);
        return contractAddress

    } catch (error) {
      reportError(error)
      return Promise.reject(error)
    }
  }

const mintToken = async (): Promise<void> => {
    if (!ethereum) {
        reportError('Please install a browser provider')
        return Promise.reject(new Error('Browser provider not installed'))
      }
  
    try {
      const contract = await getEthereumContracts()
      tx = await contract.mint()

      await tx.wait()
  
      return Promise.resolve(tx)
    } catch (error) {
      reportError(error)
      return Promise.reject(error)
    }
  }



  export {
    deployToken,
    mintToken
  }