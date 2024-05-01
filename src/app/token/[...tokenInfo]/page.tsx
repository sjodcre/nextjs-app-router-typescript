"use client"

import { useEffect, useState } from "react";
import { TokenPageDetails } from "@/app/_utils/types";
import CandleChart from "@/app/_ui/candle-chart";
import SlippageDialog from "@/app/_ui/slippage-dialog";
import IndeterminateProgressBar from "@/app/_ui/indeterminate-progress-bar";
import { BrowserProvider, Contract, ethers, Interface } from "ethers";
import ERC20TestArtifact from '../../../../artifacts/contracts/ERCC20Test.sol/ERC20Test.json'
import { postTransactionAndOHLC } from "@/app/_services/db-write";
import { useWeb3ModalAccount, useWeb3ModalProvider } from "@web3modal/ethers/react";
import { toast } from "react-toastify";


const fetchData = async (chainId: string, tokenAddress: string) => {
   //const tokenAddress = "0x9AA19CF4849c03a77877CaFBf61003aeDFDA3779";
   tokenAddress = "0xB8a0752e5d286CBeAcD1E0d232BCE965211d7E6f";
  // const chainId = 1;
  console.log("fetching data from database...");
  try {
      const response = await fetch(`http://localhost:3001/token-info?token_address=${tokenAddress}&chainid=${chainId}`);
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // console.log(data[0])
      return data[0];
  } catch (error) {
      console.error("Failed to fetch data:", error);
      return null;  // Or handle error appropriately depending on your application requirements
  }
};  



export default function TokenPage({ params }: { params: { tokenInfo: string } }) {

  // const [tokenDetails, setTokenDetails] = useState<TokenPageDetails | null>({
	// 	name: 'Cats Have 9 Sols',
	// 	ticker: '9Lives',
	// 	description: 'Why cats are often depicted having nine lives can be explained by the fact that during the ancient times, the number nine was considered a mystical and lucky number, the sum total of the "trinity of trinities", also being due to their associations with magic and their tendency to survive considerable falls',
  //   creator: '',
  //   img: "https://pump.mypinata.cloud/ipfs/QmbTJoAjP1g7NSKQrpkVouhr78YNqDgQ251LpJsrHE8YY5",
  //   twitter: 'https://twitter.com/ChristChry84614',
  //   telegram: 'https://http://t.me/cryptochristt',
  //   website: '',
  // });

  // const tokenDetails: TokenPageDetails= await fetchData()
  const [tokenDetails, setTokenDetails] = useState<TokenPageDetails>();
  const [tokenAmount, setTokenAmount] = useState('');
  const [nativeToken, setNativeToken] = useState(true);
  const [activeTab, setActiveTab] = useState('thread');
  const [buySell, setBuySell] = useState('buy');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [providerReady, setProviderReady] = useState(false);
  const [userBalance, setUserBalance] = useState({
    token: 0,
    native: 0,
  });

  const [nativeTokenInfo, setNativeTokenInfo] = useState({
    chain: '',
    chainLogo: '',
  })

  const { isConnected } = useWeb3ModalAccount()
  const { walletProvider } = useWeb3ModalProvider()
  const seiWebSocket = "wss://evm-ws-arctic-1.sei-apis.com";
  const ERC20TestContractAddress = params.tokenInfo[1]; 

  
  //demo for progress bar
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

  //web socket listener
  useEffect(() => {

    try {

      // const provider = new ethers.JsonRpcProvider("https://evm-rpc-arctic-1.sei-apis.com")
      const wsProvider = new ethers.WebSocketProvider(seiWebSocket)
      const contract = new ethers.Contract(ERC20TestContractAddress.toString(), ERC20TestArtifact.abi, wsProvider);
      // console.log("WebSocket provider set up:", wsProvider);
      // console.log("Contract initialized and listening for events at address:", ERC20TestContractAddress);
      // contract.on("Transfer", (src, dst, wad, event)=> {
      //   console.log("src: ", src);
      //   console.log("dst: ", dst)
      //   console.log("wad: ", wad)
      //   console.log("event: ", event)

      // })
  //   wsProvider.on("close", () => {
  //     console.log("WebSocket connection closed. Attempting to reconnect...");
  //     // initializeWebSocketConnection();  // Re-initialize or create a function that reconnects
  // });
      const handleEvent = (account:any, amount:any, deposit:any) => {
        console.log(`Event - Account: ${account}, Amount: ${amount.toString()}, Deposit: ${deposit.toString()} `);

    };

    contract.on("ContinuousMint", (account, amount, deposit) => handleEvent(account, amount, deposit));
    contract.on("ContinuousBurn", (account, amount, reimburseAmount) => handleEvent(account, amount, reimburseAmount));

      return () => {
        contract.removeAllListeners();
    };
    } catch (error) {
      console.error("Failed to set up contract listeners:", error);

    }
    
}, []);

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
      if (walletProvider)
      {
        const ethersProvider = new BrowserProvider(walletProvider);
        fetchERC20Balance(ethersProvider, params.tokenInfo[1])
      .then(balance => {
        console.log(typeof balance)
        // Handle ERC-20 balance
        console.log("balance " + balance)
        // setUserBalance(prevState => ({
        //   ...prevState,
        //   token: Number(balance)  // Replace `newValue` with the actual new value for the token balance
        // }));
        // console.log("user balance: ", userBalance)

      })
      .catch(error => {
        // Error handling
        console.log("fail to fetch user balance:", error)

      });
      } else {
        console.log("provider is not ready to read user")
      }
    }
  }, [providerReady]);

  //load data
  useEffect(() => {    
    let chainId;
    if (params.tokenInfo[0] === 'sei'){
      setNativeTokenInfo({
        chain: 'SEI',
        chainLogo: '/sei-logo.png'
      })
      chainId = '1';
    } else {
      setNativeTokenInfo({
        chain: 'FTM',
        chainLogo: '/ftm-logo.png'
      })
      chainId = '2';
    }
    // const test =  await fetchData()
    fetchData(chainId,params.tokenInfo[1]).then(setTokenDetails);
    
    
  },[])
  
  //slippage dialog
  const toggleDialog = () => setDialogOpen(!dialogOpen);

  //tokena mount to buy/sell
  const handleSetAmount = (amount: string) => {
    setTokenAmount(amount);  // Assuming tokenAmount is a string, if not, convert appropriately
  };

  const handleSetPercentage = (percentage: number) => {
    const fullAmount = userBalance.token; // Assuming `userBalance.token` holds the full token balance as a number
    const amountToSet = (fullAmount * percentage / 100).toFixed(0); // Calculating the percentage and rounding it to the nearest whole number
  
    setTokenAmount(amountToSet.toString()); // Convert to string to match your state expectation
  };

  // threads/trades tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  //buy sell tab change
  const handleBuySellChange = (tab: string) => {
    setBuySell(tab);
    setTokenAmount('');
  }

  //switch to native/erc20 token
  const handleToggleToken = () => {
    setNativeToken(!nativeToken);
  };

  async function fetchERC20Balance(walletProvider: any,tokenAddress: string) {
    // const ethersProvider = new BrowserProvider(walletProvider);
    const signer = await walletProvider.getSigner();
    const contract = new ethers.Contract(tokenAddress, ERC20TestArtifact.abi, signer);
    
    try {
      const balance = await contract.balanceOf(signer.address.toString());
      console.log("token address: ", tokenAddress);
      console.log("signer address: ", signer.address);
      console.log("Token Balance:", balance.toString());
      return balance;
    } catch (error) {
      console.error("Failed to fetch token balance:", error);
      throw error;  // or handle error appropriately
    }
  }

  // place trade handler
  const handlePlaceTrade = async () => {
		try {
			if (!isConnected) throw Error('User is not connected')

			if (walletProvider) {

				// const ethersProvider = new BrowserProvider(walletProvider);
				// const signer = await ethersProvider.getSigner();
				
				// ===========erc20 test contract burn===========
				// const options = {
				// 	// value: ethers.parseUnits("0.01", 18), // Your transaction value
				// 	gasLimit: ethers.toBeHex(1000000), // Example gas limit; adjust based on your needs
				// };
				// const amountToBurn = ethers.parseUnits("49976265426123", 1);
				// const ERC20TestContractAddress = "0xe7a3D1A2e108A67b7F678297907eB477f661e8bf"; 
				// const ERC20TestContract = new Contract(ERC20TestContractAddress, ERC20TestArtifact.abi, signer);

				// const mintTx = await ERC20TestContract.burn( "49928857892001",options);  // Adjust parameters as needed
				// await mintTx.wait();
				// console.log(mintTx);

				//==============erc20 test contract query=======
				// const ERC20TestContractAddress = "0x9AA19CF4849c03a77877CaFBf61003aeDFDA3779"; 
				// const provider = new ethers.JsonRpcProvider("https://evm-rpc-arctic-1.sei-apis.com")
				// const contractToUse = new ethers.Contract(ERC20TestContractAddress, ERC20TestArtifact.abi, provider);
				// const txResponseTotalSupply = await contractToUse.balanceOf("0x372173ca23790098F17f376F59858a086Cae9Fb0");
				// console.log(txResponseTotalSupply);

				// ===========erc20 test contract mint===========
        // console.log(buySell);
				const ethersProvider = new BrowserProvider(walletProvider);
				const signer = await ethersProvider.getSigner();

				const options = {
					value: ethers.parseUnits(tokenAmount.toString(), 18), // Your transaction value
					gasLimit: ethers.toBeHex(1000000), // Example gas limit; adjust based on your needs
				};
				const ERC20TestContractAddress = params.tokenInfo[1].toString(); 
				const ERC20TestContract = new Contract(ERC20TestContractAddress, ERC20TestArtifact.abi, signer);

				const mintTx = await ERC20TestContract.mint( options);  // Adjust parameters as needed
				const result = await mintTx.wait();
        if (result.status === 1) {
          console.log("Transaction succeeded:", result);

        const iface = new Interface(ERC20TestArtifact.abi);

        result.logs.forEach((log: any) => {
            try {
                const parsedLog = iface.parseLog(log);
                if (parsedLog?.name === 'ContinuousMint') {
                  console.log('ContinuousMint Event Args:', parsedLog.args);
                  
                  const info = {
                      account: parsedLog.args[0],
                      amount: Number(parsedLog.args[1].toString()), // Ensure conversion to string before to Number if BigNumber
                      deposit: Number(parsedLog.args[2].toString()), // Same conversion as above
                      timestamp: Math.floor(Date.now() / 1000)
                  };
                  console.log("Processed Event Data:", info);
                  postTransactionAndOHLC(info).then(response => {
                    console.log('Backend response:', response);
                  }).catch(error => {
                      console.error('Error posting data to backend:', error);
                  });
                  
                  
                  
                  
                  // Now you can use `info` object to do further processing, like sending to a backend or updating state
                  // Example: postTransactionAndOHLC(info);
                }            
              } catch (error) {
                // This log was not from our contract
                console.error("Error parsing log:", error);
            }
        });
        //   const info = {
        //     account:result.to,
        //     amount: Number(amount),
        //     deposit: Number(result.value),
        //     timestamp: Math.floor(Date.now() / 1000)
        // };
        // console.log(JSON.stringify(info,null,4));
        // // console.log(Math.floor(Date.now() / 1000));


        // // Call the handleTransactionData function with the event data
        // postTransactionAndOHLC(info).then(response => {
        //     console.log('Backend response:', response);
        // }).catch(error => {
        //     console.error('Error posting data to backend:', error);
        // });
          // Perform actions based on success
      } else {
          console.log("Transaction failed with receipt:", result);
          // Handle failure case
      }

				// console.log(Math.floor(Date.now() / 1000));
				
			} else {
				// Handle the case where walletProvider is undefined
				console.error("Wallet provider is not available.");
			}

		} catch (error: any) {

			console.log(error);
			toast.error(`Deployment failed: ` + error);
		}	
	};

  
  // console.log('token address: '+ params.tokenInfo[1])
  if (!params.tokenInfo[1] || params.tokenInfo[1] === "") {
    return <div>Error: Token not found</div>;  // Display error if tokenAddress is undefined or empty
  }
  return (
    <div style={{ display: 'grid', height: '100vh', gridTemplateRows: 'auto auto auto 1fr', alignItems: 'start' }}>
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
                    {tokenDetails?.token_name}
                  </div>
                  <div className="text-gray-400">
                    Ticker: {tokenDetails?.token_ticker}
                  </div>
                  <div>
                    Market cap: $38,703.96
                  </div>
                  <div>
                    Virtual liquidity: $29,384
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 text-xs">
                <span>
                  created by {tokenDetails?.creator ? `${tokenDetails.creator.slice(-6)}` : 'Unknown'}
                </span>
                  <a href="/profile/8Af5Gs3KnKsnT7SnscyDucLuHWJaeKnsG29SA5exKAx9">
                    <div className="flex gap-1 items-center">
                      {/* <img src="/pepe.png" className="w-4 h-4 rounded"></img> */}
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
                    <CandleChart tokenAddress={params.tokenInfo[1]} chainId={params.tokenInfo[0]}/>
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
                    
                  <button 
                    className={`text-xs py-1 px-2 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300`}
                    onClick={handleToggleToken}
                    disabled={buySell === 'sell'}
                    style={{ visibility: buySell === 'sell' ? 'hidden' : 'visible' }}  // Use inline style for visibility
                  >
                    switch to {nativeToken ? tokenDetails?.token_ticker : nativeTokenInfo.chain}
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
                      dark:focus-visible:ring-slate-300 bg-transparent text-white outline-none w-full pl-3" 
                      id="tokenAmount" 
                      placeholder="0.0" 
                      type="number"
                      value={tokenAmount}
                      onChange={e => setTokenAmount(e.target.value)}/>
                        <div className="flex items-center ml-2 absolute right-2">
                        <span className="text-white mr-2">
                          {buySell === 'sell' ? tokenDetails?.token_ticker : (nativeToken ? nativeTokenInfo.chain : tokenDetails?.token_ticker)}
                        </span>
                        {/* Conditionally display token logo or chain logo */}
                        <img 
                          className="w-8 h-8 rounded-full bg-white" 
                          src={buySell === 'sell' ? tokenDetails?.image_url : (nativeToken ? nativeTokenInfo.chainLogo : tokenDetails?.image_url)}
                          alt={buySell === 'sell' ? tokenDetails?.token_name : (nativeToken ? nativeTokenInfo.chain : tokenDetails?.token_name)}
                        />
                          
                          {/* <span className="text-white mr-2">{nativeToken ? nativeTokenInfo.chain : tokenDetails?.token_ticker}</span>
                          <img className="w-8 h-8 rounded-full bg-white" src={nativeToken ?  nativeTokenInfo.chainLogo: tokenDetails?.image_url}
                                    alt={nativeToken ? nativeTokenInfo.chain: tokenDetails?.token_name} /> */}
                        </div>
                          {/* <img className="w-8 h-8 rounded-full" src="https://www.liblogo.com/img-logo/so2809s56c-solana-logo-solana-crypto-logo-png-file-png-all.png" alt="SOL"></img> */}



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
                            <button className="text-xs py-1 -ml-1 px-2 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                            onClick={() => handleSetAmount('')}>
                              Reset
                            </button>
                            {/* Conditionally render buttons based on buySell state */}
                            {buySell === 'buy' ? (
                              <>
                                <button className="text-xs py-1 px-2 ml-1 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                                onClick={() => handleSetAmount('10')}>
                                  10 {nativeTokenInfo.chain}
                                </button>
                                <button className="text-xs py-1 px-2 ml-1 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                                onClick={() => handleSetAmount('50')}>
                                  50 {nativeTokenInfo.chain}
                                </button>
                                <button className="text-xs py-1 px-2 ml-1 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                                onClick={() => handleSetAmount('100')}>
                                  100 {nativeTokenInfo.chain}
                                </button>
                              </>
                            ) : (
                              <>
                                <button className="text-xs py-1 px-2 ml-1 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                                onClick={() => handleSetPercentage(25)}>
                                  25%
                                </button>
                                <button className="text-xs py-1 px-2 ml-1 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                                onClick={() => handleSetPercentage(50)}>
                                  50%
                                </button>
                                <button className="text-xs py-1 px-2 ml-1 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                                onClick={() => handleSetPercentage(75)}>
                                  75%
                                </button>
                                <button className="text-xs py-1 px-2 ml-1 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                                onClick={() => handleSetPercentage(100)}>
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
                  dark:focus-visible:ring-slate-300 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90 h-10 px-4 bg-green-400 text-black w-full py-3 rounded-md hover:bg-green-200"
                  onClick={handlePlaceTrade}>
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
                  <img src={tokenDetails?.image_url} className="w-32 object-contain cursor-pointer"></img>
                    <div>
                      <div className="font-bold text-sm">
                        {tokenDetails?.token_name} (ticker: {tokenDetails?.token_ticker})
                      </div>
                      <div className="text-xs text-gray-400">
                        {tokenDetails?.token_description}
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
                  when the market cap reaches $71,372 all the liquidity from the bonding curve will be deposited into Raydium and burned. progression increases as the price goes up.<br/><br/>there are 99,485,219 tokens still available for sale in the bonding curve and there is 54.848 {nativeTokenInfo.chain} in the bonding curve.
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
    </div>
  )
}