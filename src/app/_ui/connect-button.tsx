// "use client"

// import { useWeb3Modal, useWeb3ModalAccount } from '@web3modal/ethers/react'

// export default function ConnectButton() {
//   // 4. Use modal hook
//   const { address, chainId, isConnected } = useWeb3ModalAccount()

//   const { open } = useWeb3Modal()

//   return (
//     <>
//       <button 
//       className={`w-40 h-8 rounded-full bg-[#EED12E] text-black hover:text-white text-sm font-medium leading-5`}
//       onClick={() => open()}>Connect Wallet</button>
//       <button 
//       className={`w-40 h-8 rounded-full bg-[#EED12E] text-black hover:text-white text-sm font-medium leading-5`}
//       onClick={() => open({ view: 'Networks' })}>Network</button>
//       {/* <div className="inline-flex shadow-md rounded-full overflow-hidden h-8 leading-5">
// 				<button 
// 					className={`hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 
// 								${selectedChain === "sei" ? 'bg-blue-500 text-white' : 'bg-gray-300'}
// 								focus:outline-none focus:ring-2 focus:ring-blue-500`}
// 					onClick={handleSeiChainButton}
// 					disabled={selectedChain === "sei"}>
// 					Sei
// 				</button>
// 				<button 
// 					className={`hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 
// 								${selectedChain === "ftm" ? 'bg-blue-500 text-white' : 'bg-gray-300'}
// 								focus:outline-none focus:ring-2 focus:ring-blue-500`}
// 					onClick={handleFtmChainButton}
// 					disabled={selectedChain === "ftm"}>
// 					FTM
// 				</button>
// 			</div> */}
//     </>

    
//   )
// }