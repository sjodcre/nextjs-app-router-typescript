"use client"
import Link from 'next/link';
import React from 'react';
// import ConnectButton from './connect-button';
import { useWeb3Modal, useWeb3ModalAccount } from '@web3modal/ethers/react';


const Header = () => {
  const { open } = useWeb3Modal()
  const { address, chainId, isConnected } = useWeb3ModalAccount()

  // const profile = "0x742d35cc6634c0532925a3b844bc454e4438f44e"; 
  // const otherProfile = "21SY6TNeVgm23crGFMRdLoifTmQxMknNUpZf44YXPLj2";
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
              <span className="hidden sm:block">(0.02 SEI)</span>
              <span>{address?.slice(-6)}</span>
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

  // return (
  //   <div className="bg-black text-white py-4 flex justify-between items-center px-10">
  //     <div className="flex items-center gap-4">
  //       <button
  //         className="text-white text-sm p-2 border border-slate-500 rounded-md cursor-pointer hover:bg-slate-600 flex items-center gap-1"
  //         aria-haspopup="dialog"
  //         aria-expanded="false"
  //         aria-controls="dropdown-menu"
  //       >
  //         <span className="hidden sm:block">(0.02 SOL)</span>
  //         <span>21SY6T</span>
  //         <svg width="15" height="15" fill="none" xmlns="http://www.w3.org/2000/svg">
  //           <path d="M4 6H11L7.5 10.5L4 6Z" fill="currentColor"></path>
  //         </svg>
  //       </button>
  //       <Link href={`/profile/${otherProfile}`}>[view profile]</Link>
  //         {/* <a className="text-white text-sm hover:underline">
  //         </a> */}
        
  //     </div>
  //   </div>
  // );
