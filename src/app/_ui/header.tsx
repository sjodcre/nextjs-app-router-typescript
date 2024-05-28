"use client"
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
// import ConnectButton from './connect-button';
import { useWeb3Modal, useWeb3ModalAccount, useWeb3ModalProvider } from '@web3modal/ethers5/react';
import { extractFirstSixCharac } from '../_utils/helpers';
import { ethers } from 'ethers';

interface SpanProps {
  balance?: number; // balance can be optional and is a number
  currentChain: string; // Assuming currentChain is always provided and is a string
  address: string; // Assuming address is always provided and is a string
}

const Header = () => {
  const [providerReady, setProviderReady] = useState(false);
  const [currentChain, setCurrentChain] = useState('');
  const [currentBalance, setCurrentBalance] = useState(0);
  const { open } = useWeb3Modal()
  const { address, chainId, isConnected } = useWeb3ModalAccount()
  const { walletProvider } = useWeb3ModalProvider();
  
  // if (walletProvider){
  //   const ethersProvider = new ethers.providers.Web3Provider(walletProvider);

  // }

  //wallet provider readiness
  useEffect(() => {

  if (walletProvider) {
    setProviderReady(true);
  } else {
    setProviderReady(false);
  }
  }, [walletProvider]);

  //provider ready, get data
  useEffect(() => {

    if (providerReady) {
      if (walletProvider) {
        const ethersProvider = new ethers.providers.Web3Provider(walletProvider);
        fetchERC20Balance(ethersProvider).then(balance => {
          console.log("balance i got ", balance)
          setCurrentBalance(Number(balance))
        }).catch(error => {
          console.error("Failed to fetch balance:", error);
      });
      } else {
        console.log("provider is not ready to read user")
      }
    }
  }, [address, chainId, providerReady]);

  useEffect( () => {
    const SEI_CHAIN_ID = 713715;
    const FTM_CHAIN_ID = 64165;

    if(chainId){
      if (chainId === SEI_CHAIN_ID){
        setCurrentChain("SEI")
      } else if (chainId === FTM_CHAIN_ID){
        setCurrentChain("FTM")
      }

    }
  }, [chainId]);

  // const balance = await walletProvider.getBalance(address);
  // console.log(`Balance: ${ethers.utils.formatEther(balance)} SEI`);
  // const profile = "0x742d35cc6634c0532925a3b844bc454e4438f44e"; 
  // const otherProfile = "21SY6TNeVgm23crGFMRdLoifTmQxMknNUpZf44YXPLj2";

  async function fetchERC20Balance(walletProvider: any) {
    const signer = await walletProvider.getSigner();
    const signerAddr = await signer.getAddress();
    const balance = await walletProvider.getBalance(signerAddr);
    // console.log(`Balance: ${ethers.utils.formatEther(balance)} SEI`);
    return ethers.utils.formatEther(balance)
  }
  return (

    <div className="bg-black text-white py-4 px-10 flex justify-end items-center">
      <div className="flex items-center gap-4">
        {/* <button 
          className={`w-40 h-8 rounded-full bg-[#EED12E] text-black hover:text-white text-sm font-medium leading-5`}
          onClick={() => open()}>Connect Wallet</button> */}
           <button 
          className={`w-40 h-8 rounded-full bg-[#EED12E] text-black hover:text-white text-sm font-medium leading-5`}
          onClick={() => open()}>
          {isConnected ? 'Connected' : 'Connect Wallet'}
        </button>
        {/* <button 
          className={`w-40 h-8 rounded-full bg-[#EED12E] text-black hover:text-white text-sm font-medium leading-5`}
          onClick={() => open({ view: 'Networks' })}>Network</button> */}
        {/* <button
          className="text-sm p-2 border border-slate-500 rounded-md cursor-pointer hover:bg-slate-600 flex items-center gap-1"
          aria-haspopup="dialog"
          aria-expanded="false"
          aria-controls="dropdown-menu"
        >
          <span className="hidden sm:block">(0.02 SOL)</span>
          <span>{address?.substring(0, 6) + '...'}</span>
          <svg width="15" height="15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6H11L7.5 10.5L4 6Z" fill="currentColor"></path>
          </svg>
        </button>
        <Link href={`/profile/${address}`} className="text-sm hover:underline">
          [view profile]
        </Link> */}
        {isConnected && (
          <div>
            <div className='text-sm'>
              {/* <span className="hidden sm:block">(0.02 SEI)</span> */}
              <span>({currentBalance.toFixed(2)} {currentChain}) {extractFirstSixCharac(address || 'unknown')}</span>
            </div>
          <Link href={`/profile/${address}`} className="text-sm hover:underline">
            {/* <a className="text-sm p-2 border border-slate-500 rounded-md cursor-pointer hover:bg-slate-600 flex items-center gap-1"> */}
            [view profile]
              {/* <svg width="15" height="15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6H11L7.5 10.5L4 6Z" fill="currentColor"></path>
              </svg> */}
            {/* </a> */}
          </Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default Header;
