'use client'

import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react'
import { ReactNode } from 'react'

// 1. Get projectId at https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WC_PROJECTID || ''

// 2. Set chains
const EthMainnet = {
  chainId: 1,
  name: 'Ethereum',
  currency: 'ETH',
  explorerUrl: 'https://etherscan.io',
  rpcUrl: 'https://cloudflare-eth.com'
}

const SeiEVM = {
  chainId: 713715,
  name: 'SEI',
  currency: 'SEI  ',
  explorerUrl: 'https://seistream.app/',
  rpcUrl: 'https://evm-rpc.arctic-1.seinetwork.io'
}

const FtmEVM = {
  chainId: 64165,
  name: 'FTM',
  currency: 'FTM  ',
  explorerUrl: 'https://sonicscan.io',
  rpcUrl: 'https://rpc.sonic.fantom.network/'
}

// 3. Create a metadata object
const metadata = {
  name: 'My Website',
  description: 'My Website description',
  url: 'https://mywebsite.com', // origin must match your domain & subdomain
  icons: ['https://avatars.mywebsite.com/']
}
// 4. Create Ethers config
const ethersConfig = defaultConfig({
  /*Required*/
  metadata,

  /*Optional*/
  enableEIP6963: true, // true by default
  enableInjected: true, // true by default
  enableCoinbase: true, // true by default
  rpcUrl: '...', // used for the Coinbase SDK
  defaultChainId: 1, // used for the Coinbase SDK
})

interface Props {
  children?: ReactNode
  // any props that come into the component
}

// 5. Create a Web3Modal instance
createWeb3Modal({
  ethersConfig,
  chains: [EthMainnet, SeiEVM, FtmEVM],
  projectId,
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
  enableOnramp: true, // Optional - false as default
  includeWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
    'a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393',
    '2bd8c14e035c2d48f184aaa168559e86b0e3433228d3c4075900a221785019b0'
  ],
  allWallets:'HIDE'
})

export function Web3Modal({ children }: Props) {
  return children
}