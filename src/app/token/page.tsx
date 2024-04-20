"use client"

import {toast} from "sonner"
import ConnectButton from "../ui/connect-button";
import CandleChart  from "../ui/candle-chart";
import SlippageDialog from "../ui/slippage-dialog";
import { useEffect, useState } from "react";
import IndeterminateProgressBar from '../ui/indeterminate-progress-bar';


type TokenDetails = {
  name: string;
  symbol: string;
  description: string;
  creator: string;
  img: string; 
  twitter:string;
  telegram: string;
  website: string; // Total supply might be large, consider handling big numbers appropriately
};

export default function Page() {

  const [tokenDetails, setTokenDetails] = useState<TokenDetails | null>({
		name: 'Cats Have 9 Sols',
		symbol: '9Lives',
		description: 'Why cats are often depicted having nine lives can be explained by the fact that during the ancient times, the number nine was considered a mystical and lucky number, the sum total of the "trinity of trinities", also being due to their associations with magic and their tendency to survive considerable falls',
    creator: '',
    img: "https://pump.mypinata.cloud/ipfs/QmbTJoAjP1g7NSKQrpkVouhr78YNqDgQ251LpJsrHE8YY5",
    twitter: 'https://twitter.com/ChristChry84614',
    telegram: 'https://http://t.me/cryptochristt',
    website: '',
  });

  const [nativeToken, setNativeToken] = useState(true);
  const [activeTab, setActiveTab] = useState('thread');
  const [buySell, setBuySell] = useState('buy');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        const newProgress = prevProgress + 10;
        if (newProgress > 100) {
          clearInterval(timer);
          return 100;
        }
        return newProgress;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);  
  
  
  
  const toggleDialog = () => setDialogOpen(!dialogOpen);

  // Function to change tab
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleBuySellChange = (tab: string) => {
    setBuySell(tab);
  }

  const handleToggleToken = () => {
    setNativeToken(!nativeToken);
  };
  

  return (
     
    <main className="h-full">
      <div className="md:block hidden mt-16 p-4">
        <div className="flex justify-center">
          <a className="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50 h-10 px-4 py-2 -mt-5 text-2xl text-slate-50 hover:font-bold hover:bg-transparent hover:text-slate-50" href="/board">
            [go back]
          </a>
        </div>
        <div className="flex space-x-8 mt-4">
          <div className="flex flex-col gap-2 w-2/3">
            <div className="text-xs text-green-300 flex w-full justify-between items-center">
              <div className="flex gap-4">
                <div className="text-gray-400">
                  {tokenDetails?.name}
                </div>
                <div className="text-gray-400">
                  Ticker: {tokenDetails?.symbol}
                </div>
                <div>
                  Market cap: $38,703.96
                </div>
                <div>
                  Virtual liquidity: $29,384
                </div>
              </div>
              <div className="inline-flex items-center gap-2 text-sm">
                <span>
                  created by
                </span>
                <a href="/profile/8Af5Gs3KnKsnT7SnscyDucLuHWJaeKnsG29SA5exKAx9">
                  <div className="flex gap-1 items-center">
                    <img src="/pepe.png" className="w-4 h-4 rounded"></img>
                    {/* <div className="px-1 rounded hover:underline flex gap-1 text-black" style="background-color: rgb(227, 135, 209);">
                      8Af5Gs 
                    </div> */}
                  </div>
                </a>
              </div>
            </div>
            <div className="h-4/8">
              <div className="grid h-fit gap-2">
                <div className="chart-container ">
                  <CandleChart/>
                  <div className="hidden">
                    <div id="dexscreener-embed">
                    {/* <iframe src="https://dexscreener.com/solana/null?embed=1&amp;theme=dark&amp;trades=0&amp;info=0" style="height: 400px; width: 99%;">
                    </iframe> */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 h-fit">
            <div
              className={`cursor-pointer px-1 rounded ${activeTab === 'thread' ? 'bg-green-300 text-black': 'hover:bg-gray-800 text-gray-500' }`}
              onClick={() => handleTabChange('thread')}
            >
              Thread
            </div>
            <div
              className={`cursor-pointer px-1 rounded ${activeTab === 'trades' ? 'bg-green-300 text-black' : 'hover:bg-gray-800 text-gray-500'}`}
              onClick={() => handleTabChange('trades')}
            >
              Trades
            </div>
            <div className="mt-4 text-white">
              {activeTab === 'thread' ? 'Thread Page' : 'Trades Page'}
            </div>
              {/* <div className="cursor-pointer px-1 rounded bg-green-300 text-black">
                Thread
              </div>
              <div className="cursor-pointer px-1 rounded hover:bg-gray-800 text-gray-500">
                Trades
              </div> */}
            </div>
          </div>
          <div className="w-1/3 grid gap-4 h-fit w-fit">
            <div className="w-[350px] grid gap-4">
              <div className="bg-[#2e303a] p-4 rounded-lg border border-none text-gray-400 grid gap-4">
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {/* <button className="p-2 text-center rounded bg-green-400 text-primary">
                    Buy
                  </button>
                  <button className="p-2 text-center rounded bg-gray-800 text-grey-600">
                    Sell
                  </button> */}
                  <button
                    className={`p-2 text-center rounded ${buySell === 'buy' ? 'bg-green-400 text-black': 'bg-gray-800 text-grey-600' }`}
                    onClick={() => handleBuySellChange('buy')}
                  >
                    Buy
                  </button>
                  <button
                    className={`p-2 text-center rounded ${buySell === 'sell' ? 'bg-red-400 text-white' : 'bg-gray-800 text-grey-600'}`}
                    onClick={() => handleBuySellChange('sell')}
                  >
                    Sell
                  </button>

                </div>
                <div className="flex justify-between w-full gap-2">
                  {/* <button className="text-xs py-1 px-2 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300">
                    switch to {tokenDetails?.symbol}
                  </button> */}
                  <button className="text-xs py-1 px-2 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                    onClick={handleToggleToken}>
                    switch to {nativeToken ? tokenDetails?.symbol : 'SOL'}
                  </button>
                  <div>
                    <button 
                      className="text-xs py-1 px-2 rounded text-gray-400 hover:bg-gray-800 bg-black"
                      onClick={toggleDialog}
                      aria-haspopup="dialog"
                    >
                      Set max slippage
                    </button>
                    {dialogOpen && <SlippageDialog open={dialogOpen} onDialogClose={toggleDialog} />}
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center rounded-md relative bg-[#2e303a]">
                    <input className="flex h-10 rounded-md border border-slate-200 px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm 
                    file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 
                    disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 
                    dark:focus-visible:ring-slate-300 bg-transparent text-white outline-none w-full pl-3" id="amount" placeholder="0.0" type="number"></input>
                      <div className="flex items-center ml-2 absolute right-2">
                        {/* <span className="text-white mr-2">SOL</span> */}
                        <span className="text-white mr-2">{nativeToken ? 'SOL' : tokenDetails?.symbol}</span>
                        {/* <img className="w-8 h-8 rounded-full" src="https://www.liblogo.com/img-logo/so2809s56c-solana-logo-solana-crypto-logo-png-file-png-all.png" alt="SOL"></img> */}
                        <img className="w-8 h-8 rounded-full" src={nativeToken ?  "https://www.liblogo.com/img-logo/so2809s56c-solana-logo-solana-crypto-logo-png-file-png-all.png": tokenDetails?.img}
        alt={nativeToken ? "CRYPTO CHRIST" : tokenDetails?.name} />
                      </div>
                  </div>
                  <div className="flex mt-2 bg-[#2e303a] p-1 rounded-lg">
                    {/* {nativeToken && (
                      <div>
                        <button className="text-xs py-1 -ml-1 px-2 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300">
                          reset
                        </button>
                        <button className="text-xs py-1 px-2 ml-1 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300">
                          1 SOL
                        </button>
                        <button className="text-xs py-1 px-2 ml-1 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300">
                          5 SOL
                        </button>
                        <button className="text-xs py-1 px-2 ml-1 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300">
                          10 SOL
                        </button>
                      </div>
                    )} */}
                    {nativeToken && (
                        <div>
                          <button className="text-xs py-1 -ml-1 px-2 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300">
                            Reset
                          </button>
                          {/* Conditionally render buttons based on buySell state */}
                          {buySell === 'buy' ? (
                            <>
                              <button className="text-xs py-1 px-2 ml-1 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300">
                                1 SOL
                              </button>
                              <button className="text-xs py-1 px-2 ml-1 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300">
                                5 SOL
                              </button>
                              <button className="text-xs py-1 px-2 ml-1 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300">
                                10 SOL
                              </button>
                            </>
                          ) : (
                            <>
                              <button className="text-xs py-1 px-2 ml-1 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300">
                                25%
                              </button>
                              <button className="text-xs py-1 px-2 ml-1 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300">
                                50%
                              </button>
                              <button className="text-xs py-1 px-2 ml-1 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300">
                                75%
                              </button>
                              <button className="text-xs py-1 px-2 ml-1 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300">
                                100%
                              </button>
                            </>
                          )}
                        </div>
                      )}
                  </div>
                </div>
                <button className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none 
                focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-950 
                dark:focus-visible:ring-slate-300 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90 h-10 px-4 bg-green-400 text-black w-full py-3 rounded-md hover:bg-green-200">
                  place trade
                </button>
              </div>
            </div>
            <div className="w-[350px] bg-transparent text-gray-400 rounded-lg border border-none grid gap-4">
              <div className="flex gap-4">
                {/* <a href="https://twitter.com/ChristChry84614" target="_blank" rel="noopener noreferrer" className=" text-gray-400 hover:underline">
                  [twitter]
                </a>
                <a href="https://http://t.me/cryptochristt" target="_blank" rel="noopener noreferrer" className=" text-gray-400 hover:underline">
                  [telegram]
                </a>
                <a href="https://http://cryptochrist.xyz" target="_blank" rel="noopener noreferrer" className=" text-gray-400 hover:underline">
                  [website]
                </a> */}
                  {tokenDetails?.twitter && (
                    <a href={tokenDetails?.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:underline">
                      [twitter]
                    </a>
                  )}
                  {tokenDetails?.telegram && (
                    <a href={tokenDetails?.telegram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:underline">
                      [telegram]
                    </a>
                  )}
                  {tokenDetails?.website && (
                    <a href={tokenDetails?.website} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:underline">
                      [website]
                    </a>
                  )}
              </div>
              <div className="gap-3 h-fit items-start flex">
                <img src={tokenDetails?.img} className="w-32 object-contain cursor-pointer"></img>
                  <div>
                    <div className="font-bold text-sm">
                      {tokenDetails?.name} (ticker: {tokenDetails?.symbol})
                    </div>
                    <div className="text-xs text-gray-400">
                      {tokenDetails?.description}
                    </div>
                  </div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">bonding curve progress: {progress} %</div>
                {/* <div aria-valuemax="100" aria-valuemin="0" role="progressbar" data-state="indeterminate" data-max="100" className="relative h-4 overflow-hidden rounded-full dark:bg-slate-800 w-full bg-gray-700">
                  <div data-state="indeterminate" data-max="100" className="h-full w-full flex-1 bg-green-300 transition-all dark:bg-slate-50" style="transform: translateX(-12%);"></div>
                </div> */}
                <IndeterminateProgressBar progress={progress} />

              </div>
              <div className="text-xs text-gray-400">
                when the market cap reaches $71,372 all the liquidity from the bonding curve will be deposited into Raydium and burned. progression increases as the price goes up.<br/><br/>there are 99,485,219 tokens still available for sale in the bonding curve and there is 54.848 SOL in the bonding curve.
              </div>
                <div className="text-yellow-500 font-bold">
                  👑 Crowned king of the hill on 12/04/2024, 12:20:58
                </div>
                <div className="grid gap-2">
                  <div className="font-bold">
                    Holder distribution
                  </div>
                  <div className="text-sm">
                    <div>Loading...</div>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    );
  } 