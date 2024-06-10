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
        fetchBalance(ethersProvider).then(balance => {
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

  async function fetchBalance(walletProvider: any) {
    const signer = await walletProvider.getSigner();
    const signerAddr = await signer.getAddress();
    const balance = await walletProvider.getBalance(signerAddr);
    // console.log(`Balance: ${ethers.utils.formatEther(balance)} SEI`);
    return ethers.utils.formatEther(balance)
  }

  useEffect(() => {
    if (currentChain) {
     initProfile();
    }
  }, [currentChain,isConnected]);

  const initProfile = async () => {
    try {
      const response = await fetch(`/api/initProfile?id=${address}&chain=${currentChain}`);
      if (!response.ok) {
        throw new Error('Failed to init');
      }
          } catch (error) {
      console.error('Error init:', error);
    }
  };



  return (
<div className="bg-black text-green-400 py-4 px-10 flex justify-end items-center">
  <div className="flex items-center gap-4">
  <button
      className={`w-40 h-8 rounded-full bg-green-400 text-black hover:text-white text-sm font-medium leading-5 transition-colors`}
      onClick={() => open()}
    >
      {isConnected ? 'Connected' : 'Connect Wallet'}
    </button>
    {isConnected && (
      <div>
        <div className="text-sm">
          <span>({currentBalance.toFixed(2)} {currentChain}) {extractFirstSixCharac(address || 'unknown')}</span>
        </div>
        <Link href={`/profile/${address}`} className="text-sm hover:underline transition-colors">
          [view profile]
        </Link>
      </div>
    )}
  </div>
</div>
  );
};

export default Header;
