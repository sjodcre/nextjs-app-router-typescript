// const BuySellSm = () => {
//     return (
//         <div className="h-full p-4 overflow-auto">
//               <div className="grid gap-1">
//                 <div className="text-sm text-green-300 flex gap-2">
//                   Market cap: $4,328.716
//                 </div>
//                 <div className="w-[350px] grid gap-4">
//                   <div className="bg-[#2e303a] p-4 rounded-lg border border-none text-gray-400 grid gap-4">
//                     <div className="grid grid-cols-2 gap-2 mb-4">
//                       <button className="p-2 text-center rounded bg-green-400 text-primary">
//                         Buy
//                       </button>
//                       <button className="p-2 text-center rounded bg-gray-800 text-grey-600">
//                         Sell
//                       </button>
//                     </div>
//                     <div className="flex justify-between w-full gap-2">
//                       <button className="text-xs py-1 px-2 rounded bg-primary text-gray-400 hover:bg-gray-800 hover:text-gray-300">
//                         switch to LNE
//                       </button>
//                       <button className="text-xs py-1 px-2 rounded text-gray-400 hover:bg-gray-800 bg-primary" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="radix-:ro:" data-state="closed">
//                         Set max slippage
//                       </button>
//                     </div>
//                     <div className="flex flex-col">
//                       <div className="flex items-center rounded-md relative bg-[#2e303a]">
//                       <input className="flex h-10 rounded-md border border-slate-200 px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm 
//                       file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 
//                       disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 
//                       dark:focus-visible:ring-slate-300 bg-transparent text-white outline-none w-full pl-3" 
//                       id="tokenAmount" 
//                       placeholder="0.0" 
//                       type="number"
//                       value={tokenAmountToTrade}
//                       onChange={e => setTokenAmountToTrade(e.target.value)}/>
//                         <div className="flex items-center ml-2 absolute right-2">
//                           <span className="text-white mr-2">
//                             SOL
//                           </span>
//                           {/* <img class="w-8 h-8 rounded-full" src="https://www.liblogo.com/img-logo/so2809s56c-solana-logo-solana-crypto-logo-png-file-png-all.png" alt="SOL"> */}
//                         </div>
//                         </div>
//                         <div className="flex mt-2 bg-[#2e303a] p-1 rounded-lg">
//                           <button className="text-xs py-1 -ml-1 px-2 rounded bg-primary text-gray-400 hover:bg-gray-800 hover:text-gray-300">
//                             reset
//                           </button>
//                           <button className="text-xs py-1 px-2 ml-1 rounded bg-primary text-gray-400 hover:bg-gray-800 hover:text-gray-300">
//                             1 SOL
//                           </button>
//                           <button className="text-xs py-1 px-2 ml-1 rounded bg-primary text-gray-400 hover:bg-gray-800 hover:text-gray-300">
//                             5 SOL
//                           </button>
//                           <button className="text-xs py-1 px-2 ml-1 rounded bg-primary text-gray-400 hover:bg-gray-800 hover:text-gray-300">
//                             10 SOL
//                           </button>
//                         </div>
//                         </div>
//                         <button className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-white transition-colors 
//                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none 
//                         disabled:opacity-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90 
//                         h-10 px-4 bg-green-400 text-primary w-full py-3 rounded-md hover:bg-green-200">
//                           place trade
//                         </button>
//                       </div>
//                     </div>
//                     <div className="flex gap-2">
//                         <div className="cursor-pointer px-1 rounded bg-green-300 text-black">
//                             Thread
//                         </div>
//                         <div className="cursor-pointer px-1 rounded hover:bg-gray-800 text-gray-500">
//                             Wall of fame
//                         </div>
//                     </div>
//                     <div className="text-slate-300 grid gap-1 relative">
//                         <div className="gap-1 grid h-fit bg-[#2e303a] p-1 text-sm">
//                             <div className="flex gap-1 text-xs">
//                                 <a href="/profile/21SY6TNeVgm23crGFMRdLoifTmQxMknNUpZf44YXPLj2">
//                                     <div className="flex gap-1  items-center">
//                                         {/* <img src="/pepe.png" class="w-4 h-4 rounded"> */}
//                                         <div className="px-1 rounded hover:underline flex gap-1 text-black bg-green-300">
//                                           21SY6T (dev)
//                                         </div>
//                                     </div>
//                                 </a>
//                                 <div className="text-slate-400">
//                                     09/04/2024, 21:29:24
//                                 </div>
//                             </div>
//                             <div className="relative items-start gap-3 text-slate-300 text-xs overflow-auto flex">
//                                 {/* <img src="https://pump.mypinata.cloud/ipfs/QmRMNwrwC2AZs5XAepCUGMtuwKkdy5saGDNzFoJtnovNjp" class="w-32 object-contain cursor-pointer"> */}
//                                 <div className="grid">
//                                     <div className="font-bold text-sm">
//                                         Loner69 (ticker: LNE)
//                                     </div>
//                                     <div>
//                                         how does a loner get 69? curiosity kills the cat.
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                         <div id="p603238" className="bg-[#2e303a] p-1 text-slate-200 text-sm grid gap-1 overflow-auto">
//                             <div className="flex flex-wrap gap-2 text-slate-400 text-xs items-start w-full">
//                                 <a href="/profile/C2wjb9hJrDMS4pMVPs9CCq5ZBpMdNaatCtxpXjp8npQs">
//                                     <div className="flex gap-1  items-center">
//                                         {/* <img src="/pepe.png" class="w-4 h-4 rounded"> */}
//                                         <div className="px-1 rounded hover:underline flex gap-1 text-black bg-yellow-100" >
//                                             C2wjb9 
//                                         </div>
//                                     </div>
//                                 </a>
//                                 <div>
//                                     09/04/2024
//                                 </div>
//                                 <div className="flex items-center gap-2 w-fit hover:text-red-500 hover:stroke-red-500 cursor-pointer">
//                                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-heart ">
//                                         <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
//                                     </svg>
//                                     <div>
//                                         0
//                                     </div>
//                                 </div>
//                                 <div className="cursor-pointer justify-self-end hover:underline">
//                                     #603238 [reply]
//                                 </div>
//                             </div>
//                             <div className="flex gap-2 items-start">
//                                 <div>
//                                     red pill. blue pill. orange pill. i wonder? shrooms time
//                                 </div>
//                             </div>
//                             <div className="flex gap-2"></div>
//                         </div>
//                         <div className="justify-self-center hover:underline cursor-pointer">
//                             [Post a reply]
//                         </div>
//                     </div>
//                 </div>
//             </div>
//     )
// }
