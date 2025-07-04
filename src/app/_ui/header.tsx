"use client"
import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';
// import ConnectButton from './connect-button';
import { useSwitchNetwork, useWeb3Modal, useWeb3ModalAccount, useWeb3ModalProvider } from '@web3modal/ethers5/react';
import { extractFirstSixCharac } from '../_utils/helpers';
import { ethers } from 'ethers';
import { AppDispatch, useAppSelector } from '../_redux/store';
import { useDispatch } from 'react-redux';
import { logIn, setNativeTokenBalance } from '../_redux/features/user-slice';
import { setChain } from '../_redux/features/chain-slice';
import { toast } from 'react-toastify';

interface SpanProps {
  balance?: number; // balance can be optional and is a number
  currentChain: string; // Assuming currentChain is always provided and is a string
  address: string; // Assuming address is always provided and is a string
}

const Header = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [providerReady, setProviderReady] = useState(false);
  const [currentChain, setCurrentChain] = useState('');
  const [currentBalance, setCurrentBalance] = useState(0);
  const { open } = useWeb3Modal()
  const { switchNetwork } = useSwitchNetwork()
  const { address, chainId, isConnected } = useWeb3ModalAccount()
  const { walletProvider } = useWeb3ModalProvider();
  const [userName, setUserName] = useState('');
  // const SEI_CHAIN_ID = 713715;
  // const FTM_CHAIN_ID = 64165;
  const FTM_CHAIN_ID = 250;
  
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
          setCurrentBalance(Number(balance))
          dispatch(setNativeTokenBalance(Number(balance)));
        }).catch(error => {
          console.error("Failed to fetch balance:", error);
      });
      } else {
        // console.log("provider is not ready to read user")
      }
    }
  }, [address, chainId, providerReady]);


  async function fetchBalance(walletProvider: any) {
    const signer = await walletProvider.getSigner();
    const signerAddr = await signer.getAddress();
    const balance = await walletProvider.getBalance(signerAddr);
    // console.log(`Balance: ${ethers.utils.formatEther(balance)} SEI`);
    return ethers.utils.formatEther(balance)
  }
  
  // const fetchBalance = useCallback(async (walletProvider: any) => {
  //   try {

  //     const signer = await walletProvider.getSigner();
  //     const signerAddr = await signer.getAddress();
  //     const balance = await walletProvider.getBalance(signerAddr);
  //     return ethers.utils.formatEther(balance);
  //   } catch (error) {
  //     console.error("Failed to fetch balance:", error);
  //     return "0"; // return 0 balance on error
  //   }
  // }, []);


  // useEffect( () => {
  //   const SEI_CHAIN_ID = 713715;
  //   // const FTM_CHAIN_ID = 64165;
  //   const FTM_CHAIN_ID = 250;

  //   if(chainId){
  //     if (chainId === SEI_CHAIN_ID){
  //       setCurrentChain("SEI")
  //       dispatch(setChain("sei"));
  //     } else if (chainId === FTM_CHAIN_ID){
  //       setCurrentChain("FTM")
  //       dispatch(setChain("ftm"));
  //     }

  //   }
  // }, [chainId]);




  // useEffect(() => {
  //   if (chainId && isConnected) {
  //     // dispatch(logIn(address));
  //     handleChainChange();
  //     setCurrentChain("FTM")
  //     // dispatch(setChain("ftm"));//chainreducer not used anywhere
  //     initProfile('ftm');
  //   }
  // }, [chainId,isConnected]);

  useEffect(() => {
    const handleChain = async () => {
      if (chainId && isConnected) {
        try {
          await handleChainChange();
          setCurrentChain("FTM");
        } catch (error) {
          toast.error(error);
        }
      }
    };

    handleChain();
    initProfile('ftm');//modular 

  }, [chainId, isConnected]);

  useEffect(() => {
    if (isConnected) {
      initProfile('ftm');
    }
  }, [isConnected]);

  async function handleChainChange() {
    return new Promise((resolve, reject) => {
      // Assuming chain IDs for 'sei' and 'ftm' as constants for clarity
      // const SEI_CHAIN_ID = 713715;
      // const FTM_CHAIN_ID = 64165;
      // const FTM_CHAIN_ID = 250;
      let targetChainId = 250;

      if (chainId !== targetChainId) {
        switchNetwork(targetChainId)
          .then(() => {
            // if (walletProvider)
            resolve(targetChainId);
          })
          .catch((error) => {
            reject(`Failed to switch to ${targetChainId}: ${error}`);
          });
      } else {
        // Resolve immediately if no switch is needed
        // resolve("No network switch needed.");
        resolve(chainId);
      }
    });
  }

  const initProfile = async (chain:string) => {
    try {
      // const response = await fetch(`/api/initProfile?id=${address}&chain=${currentChain}`);
      const response = await fetch(`/api/initProfile?id=${address}&chain=${chain}`);
      if (!response.ok) {
        throw new Error('Failed to init');
      }
      const data = await response.json();
      dispatch(logIn(data.username)); // Use the returned username to log in
    } catch (error) {
      console.error('Error initiating profile:', error);
    }
  };
  // const initProfile = useCallback(async () => {
  //   try {
  //     const response = await fetch(`/api/initProfile?id=${address}&chain=${currentChain}`);
  //     if (!response.ok) {
  //       throw new Error('Failed to init');
  //     }
  //   } catch (error) {
  //     console.error('Error init:', error);
  //   }
  // }, [address, currentChain]);

  // useEffect(() => {
  //   if (currentChain && isConnected) {
  //     initProfile();
  //     console.log("making sure code not infinite loop")
  //   }
  // }, [currentChain, isConnected, initProfile]);
  

  const userState = useAppSelector((state) => state.userReducer.value); // Use selector inside the component

  const handleCheckState = () => {
    console.log('Current User State:', userState);
  };


  return (
<div className="bg-black text-green-400 py-4 px-10 flex justify-end items-center">
  <div className="flex items-center gap-4">
  <button
          className={`w-40 h-8 rounded-full bg-green-400 text-black hover:text-white text-sm font-medium leading-5 transition-colors`}
          onClick={handleCheckState}
        >
          Check Redux State
        </button>
  <button
      className={`w-40 h-8 rounded-full bg-green-400 text-black hover:text-white text-sm font-medium leading-5 transition-colors`}
      onClick={() => open()}
    >
      {isConnected ? 'Connected' : 'Connect Wallet'}
    </button>
    {isConnected && (
      <div>
        <div className="text-sm">
          <span>
            {/* ({currentBalance.toFixed(2)} {currentChain})  */}
            {chainId === FTM_CHAIN_ID ? `(${currentBalance.toFixed(2)} ${currentChain})` : ''}
            {extractFirstSixCharac(userState.user || address)}</span>
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
