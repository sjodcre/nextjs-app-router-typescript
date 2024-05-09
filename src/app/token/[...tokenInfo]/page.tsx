"use client"

import { SetStateAction, useEffect, useState } from "react";
import { SmartContractError, TokenHolder, TokenPageDetails, TradeData } from "@/app/_utils/types";
import CandleChart from "@/app/_ui/candle-chart";
import SlippageDialog from "@/app/_ui/slippage-dialog";
import IndeterminateProgressBar from "@/app/_ui/indeterminate-progress-bar";
import { BrowserProvider, Contract, ethers, Interface } from "ethers";
import ERC20TestArtifact from '../../../../artifacts/contracts/ERCC20Test.sol/ERC20Test.json'
import { fetchTokenInfo, getTokenTrades, getTopTokenHolders, postTransactionAndOHLC } from "@/app/_services/db-write";
import { useSwitchNetwork, useWeb3ModalAccount, useWeb3ModalProvider } from "@web3modal/ethers/react";
import { toast } from "react-toastify";
import TradeItem from "@/app/_ui/trade-list";
import { calculateMinReturnWithSlippage, calculateMinTokensWithSlippage, calculateRequiredDeposit, extractFirstSixCharac, getAccountUrl } from "@/app/_utils/helpers";
import { fetchNativeTokenPrice } from "@/app/_utils/native-token-pricing";
import { useAppSelector } from "@/app/_redux/store";
import {socket } from "src/socket";





export default function TokenPage({ params }: { params: { tokenInfo: string } }) {

  const slippage = useAppSelector((state) => state.userReducer.value.slippage);
  const [tokenDetails, setTokenDetails] = useState<TokenPageDetails>();
  const [tokenAmountToTrade, setTokenAmountToTrade] = useState('');
  const [nativeTokenBool, setNativeTokenBool] = useState(true);
  const [activeTab, setActiveTab] = useState('thread');
  const [activeTabSmScreen, setActiveTabSmScreen] = useState('info');  // Default to showing the 'info' tab
  const [buySell, setBuySell] = useState('buy');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState(0);
  const [holders, setHolders] = useState<TokenHolder[]>([]);
  const [tokenSum, setTokenSum] = useState(0);
  const [nativeSum, setNativeSum] = useState(0);
  const [marketCap, setMarketCap] = useState<string>('0');
  const [providerReady, setProviderReady] = useState(false);
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [transactionDone, setTransactionDone] = useState(false);
  const { switchNetwork} = useSwitchNetwork()
  const [userBalance, setUserBalance] = useState({
    token: 0,
    native: 0,
  });
  const [nativeTokenPrice, setnativeTokenPrice] = useState<number | null>(null);
  const [nativeTokenInfo, setNativeTokenInfo] = useState({
    chain: '',
    chainId:0,
    chainLogo: '',
  })

  const { isConnected, chainId, address } = useWeb3ModalAccount()
  const { walletProvider } = useWeb3ModalProvider()
  const seiWebSocket = "wss://evm-ws-arctic-1.sei-apis.com";
  // const ftmWebSocket = "wss://fantom-testnet.public.blastapi.io/";
  const ERC20TestContractAddress = params.tokenInfo[1]; 
  
//new socket/websocket codes
  const [isCon, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");

  useEffect(() => {
    if (socket.connected) {
      onConnect();
    }

    function onConnect() {
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);

      socket.io.engine.on("upgrade", (transport: { name: SetStateAction<string>; }) => {
        setTransport(transport.name);
      });
    }

    function onDisconnect() {
      setIsConnected(false);
      setTransport("N/A");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);
  
 
//set bonding curve %
  useEffect(() => {
    // Convert marketCap string to number, removing commas and parsing as integer
    const marketCapValue = parseInt(marketCap.replace(/,/g, ''), 10);
    // Calculate the new progress as a fraction of marketCap to 50,000
    const newProgress = (marketCapValue / 50000) * 100;
  
    // Ensure the progress doesn't exceed 100%
    if (newProgress > 100) {
      setProgress(100);
    } else {
      setProgress(newProgress);
    }
  }, [marketCap]); 

  //fetch native token price
  useEffect(() => {
    const updatePrice = async () => {
        const fetchedPrice = await fetchNativeTokenPrice(params.tokenInfo[0]);
        setnativeTokenPrice(fetchedPrice);
        // console.log(fetchedPrice)
    };

    updatePrice(); // Initial fetch
    const intervalId = setInterval(updatePrice, 86400000); // Update every 24 hours

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, []);

  //web socket listener
  useEffect(() => {
    // try {
    //   let provider = new ethers.WebSocketProvider(createWebSocket());
    //   startListening(provider);
      

    //   return () => {
    //     stopListening(provider);
    // };
    // } catch (error) {
    //   console.error("Failed to set up contract listeners:", error);

    // }

    try {

      const wsProvider = new ethers.WebSocketProvider(seiWebSocket)
      // const wsProvider = new ethers.WebSocketProvider(ftmWebSocket)
      const contract = new ethers.Contract(
        ERC20TestContractAddress.toString(), 
        ERC20TestArtifact.abi, 
        wsProvider);
      // contract.removeAllListeners();
      // console.log("WebSocket provider set up:", wsProvider);
      console.log("Contract initialized and listening for events at address:", ERC20TestContractAddress);
      contract.on("Transfer", (from, to, value)=> {
        console.log("src: ", from);
        console.log("dst: ", to)
        console.log("wad: ", value)
        // console.log("event: ", event)

      })

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
        
        setUserBalance(prevState => ({
          ...prevState,
          token: Number(balance)  // Replace `newValue` with the actual new value for the token balance
        }));
        setTransactionDone(false);

      })
      .catch(error => {
        // Error handling
        console.log("fail to fetch user balance:", error)

      });
      } else {
        console.log("provider is not ready to read user")
      }
    } 
  }, [address,chainId, providerReady, transactionDone,switchNetwork]);


  //set native token info, token details, trades, market cap
  /* useEffect(() => {
    // const chainId = params.tokenInfo[0] === 'sei' ? '1' : '2';
    setNativeTokenInfo({
      chain: params.tokenInfo[0] === 'sei' ? 'SEI' : 'FTM',
      chainId: params.tokenInfo[0] === 'sei' ? 713715: 64165,
      chainLogo: params.tokenInfo[0] === 'sei' ? '/sei-logo.png' : '/ftm-logo.png'
    });

    const fetchData = async () => {
      const tokenInfoPromise = fetchTokenInfo(params.tokenInfo[0], params.tokenInfo[1]);
      const tradesDataPromise = getTokenTrades(params.tokenInfo[1], params.tokenInfo[0]);

      const [tokenInfo, tradesData] = await Promise.all([tokenInfoPromise, tradesDataPromise]);
      setTokenDetails(tokenInfo);
      setTrades(tradesData);
      // console.log(tradesData);

      if (tradesData && tradesData.length > 0 && nativeTokenPrice) {
        const marketCap = tradesData[0].sum * tradesData[0].price_per_token * nativeTokenPrice/1E18;
        // marketCap = 10000;
        const formattedMarketCap = marketCap.toLocaleString('en-US', {
          style: 'decimal',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        setMarketCap(formattedMarketCap);
      }
    };

    fetchData();
    console.log("data fetch");
    const intervalId = setInterval(fetchData, 10000); // 30 seconds in milliseconds

    // Cleanup function to clear the interval when the component unmounts or before it re-renders
    return () => {
        clearInterval(intervalId);
    };

  }, [params.tokenInfo, nativeTokenPrice]);
   */

  useEffect(() => {
    setNativeTokenInfo({
      chain: params.tokenInfo[0] === 'sei' ? 'SEI' : 'FTM',
      chainId: params.tokenInfo[0] === 'sei' ? 713715: 64165,
      chainLogo: params.tokenInfo[0] === 'sei' ? '/sei-logo.png' : '/ftm-logo.png'
    });
  }, [params.tokenInfo, nativeTokenPrice])


// Function to fetch data
const fetchData = async () => {
  // Fetch token info and trades data
  const tokenInfoPromise = fetchTokenInfo(params.tokenInfo[0], params.tokenInfo[1]);
  const tradesDataPromise = getTokenTrades(params.tokenInfo[0], params.tokenInfo[1]);

  // Wait for both promises to resolve
  const [tokenInfo, tradesData] = await Promise.all([tokenInfoPromise, tradesDataPromise]);

  // Update state with fetched data
  setTokenDetails(tokenInfo);
  setTrades(tradesData);
  setTokenSum(tradesData[0].sum_token);
  setNativeSum(tradesData[0].sum_native)

  getTopTokenHolders(params.tokenInfo[0],params.tokenInfo[1]);
  fetchHolders();
  // Calculate market cap if tradesData and nativeTokenPrice are available
  if (tradesData && tradesData.length > 0 && nativeTokenPrice) {
      const marketCap = tradesData[0].sum_token * tradesData[0].price_per_token * nativeTokenPrice / 1E18;
      const formattedMarketCap = marketCap.toLocaleString('en-US', {
          style: 'decimal',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
      });
      setMarketCap(formattedMarketCap);
  }
  console.log("data fetch");
};

//Fetch Data useeffect
  useEffect(() => {
    

    // Initial fetch of data
    fetchData();
  
    socket.on("refresh", (value: any) => {
      console.log(value);
      fetchData();
    });
    
    

  }, [params.tokenInfo, nativeTokenPrice]);

  //when user change wallet
  useEffect(()=> {
    setTokenAmountToTrade(''); 
  }, [address])


  //fetch token holders
  const fetchHolders = async () => {
      setIsLoading(true); // Start loading

      const data = await getTopTokenHolders(params.tokenInfo[0],params.tokenInfo[1]); // Assume this fetches the data as shown in your example
      // console.log(data)

      setHolders(data);
      // const sum = data.reduce((acc: any, holder: { balance: any; }) => acc + holder.balance, 0);
      // setTokenSum(sum);
      setIsLoading(false); // End loading
    };

    //slippage dialog
  const toggleDialog = () => setDialogOpen(!dialogOpen);

  //tokena mount to buy/sell
  const handleSetAmount = (amount: string) => {
    setTokenAmountToTrade(amount);  // Assuming tokenAmount is a string, if not, convert appropriately
  };

  const handleSetPercentage = (percentage: number) => {
    // handleChainChange()
    // // console.log(userBalance.token)
    // const fullAmount = userBalance.token; // Assuming `userBalance.token` holds the full token balance as a number
    // const amountToSet = (fullAmount * percentage / 100).toFixed(0); // Calculating the percentage and rounding it to the nearest whole number
  
    // setTokenAmountToTrade(amountToSet.toString()); // Convert to string to match your state expectation
    handleChainChange()
        .then(async() => {
            
            // This code executes after successful network change
            console.log(userBalance.token)
            const fullAmount = userBalance.token; // Assuming `userBalance.token` holds the full token balance as a number
            const amountToSet = (fullAmount * percentage / 100).toFixed(0); // Calculating the percentage and rounding it to the nearest whole number
        
            setTokenAmountToTrade(amountToSet.toString()); // Convert to string to match your state expectation
        })
        .catch(error => {
            // Handle error if network change fails
            console.error("Network change failed:", error);
        });
  };

  // threads/trades tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  //buy sell tab change
  const handleBuySellChange = (tab: string) => {
    setBuySell(tab);
    setTokenAmountToTrade('');
  }

  //switch to native/erc20 token
  const handleToggleToken = () => {
    setNativeTokenBool(!nativeTokenBool);
  };

  const getButtonClass = (tabName: string) => {
    return activeTabSmScreen === tabName ?
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50 h-10 px-4 py-2 hover:bg-transparent hover:text-white font-bold text-white bg-transparent" :
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50 h-10 px-4 py-2 text-black hover:bg-transparent hover:text-white";
  };

  function isErrorWithMessage(error: unknown): error is { message: string } {
    return typeof error === 'object' && error !== null && 'message' in error;
}

  async function handleChainChange() {
    return new Promise((resolve, reject) => {
        // Assuming chain IDs for 'sei' and 'ftm' as constants for clarity
        const SEI_CHAIN_ID = 713715;
        const FTM_CHAIN_ID = 64165;

        let targetChainId = null;

        if (params.tokenInfo[0] === "sei" && chainId !== SEI_CHAIN_ID) {
            targetChainId = SEI_CHAIN_ID;
        } else if (params.tokenInfo[0] === "ftm" && chainId !== FTM_CHAIN_ID) {
            targetChainId = FTM_CHAIN_ID;
        }

        // console.log( targetChainId)
        if (targetChainId !== null) {
            switchNetwork(targetChainId)
                .then(() => {
                    // if (walletProvider)
                    // {
                    //   const ethersProvider = new BrowserProvider(walletProvider);
                    //   await fetchERC20Balance(ethersProvider, params.tokenInfo[1])
                    // .then(balance => {
              
                    //   setUserBalance(prevState => ({
                    //     ...prevState,
                    //     token: Number(balance)  // Replace `newValue` with the actual new value for the token balance
                    //   }));
                    //   setTransactionDone(false);
              
                    // })
                    // .catch(error => {
                    //   // Error handling
                    //   console.log("fail to fetch user balance:", error)
              
                    // });
                    // } else {
                    //   console.log("provider is not ready to read user")
                    // }
                    // resolve(`Switched to ${targetChainId} successfully.`);
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

  // function createWebSocket() {
  //   const ws = new WebSocket (process.env.NEXT_PUBLIC_WSS_PROVIDER || '');
  //   ws.addEventListener("close", () => {
  //     console.log("Disconnected. Reconnecting...");
  //     setTimeout(() => {
  //       let provider = new ethers.WebSocketProvider(createWebSocket());
  //       startListening();
  //     }, 3000);
  //   });
  
  //   ws.addEventListener("error", (error) => {
  //     console.log("WebSocket error: ", error);
  //   });
  
  //   // ws.close();
  //   return ws;
  // }

  // function startListening() {
  //   const wsProvider = new ethers.WebSocketProvider(seiWebSocket)
  //   const contract = new ethers.Contract(ERC20TestContractAddress.toString(), ERC20TestArtifact.abi, wsProvider);
    
  //   // let contract = new ethers.Contract(
  //   //   params.tokenInfo[1],
  //   //   ERC20TestArtifact.abi,
  //   //   wsProvider
  //   // );
  //   console.log("listener started...")
  //   contract.removeAllListeners();
  
  //   const handleEvent = (account:any, amount:any, deposit:any) => {
  //     console.log(`Event - Account: ${account}, Amount: ${amount.toString()}, Deposit: ${deposit.toString()} `);

  //   };
  //   contract.on("Transfer", (src, dst, wad, event)=> {
  //       console.log("src: ", src);
  //       console.log("dst: ", dst)
  //       console.log("wad: ", wad)
  //       console.log("event: ", event)

  //     })

  //   contract.on("ContinuousMint", (account, amount, deposit) => handleEvent(account, amount, deposit));
  //   contract.on("ContinuousBurn", (account, amount, reimburseAmount) => handleEvent(account, amount, reimburseAmount));
  // }

  // function stopListening(provider: ethers.ContractRunner | null | undefined) {
  //   let contract = new ethers.Contract(
  //     params.tokenInfo[1],
  //     ERC20TestArtifact.abi,
  //     provider
  //   );
    
  //   if (contract) {
  //     contract.removeAllListeners();
  //   }

  //   console.log("listener ended...")
   
  // }

  async function fetchERC20Balance(walletProvider: any,tokenAddress: string) {
    // const ethersProvider = new BrowserProvider(walletProvider);
    const signer = await walletProvider.getSigner();
    const contract = new ethers.Contract(tokenAddress, ERC20TestArtifact.abi, signer);
    
    try {
      // console.log(chainId)
      // console.log(nativeTokenInfo.chainId)
      if(chainId === nativeTokenInfo.chainId){
        // console.log('pass here')
        const balance = await contract.balanceOf(signer.address.toString());
      // console.log("token address: ", tokenAddress);
      // console.log("signer address: ", signer.address);
      // console.log("Token Balance:", balance.toString());
      return balance;
      } else {
        return 0;
      }
      
    } catch (error) {
      console.error("Failed to fetch token balance:", error);
      throw error;  // or handle error appropriately
    }
  }

  async function handleBuyToken(walletProvider: ethers.Eip1193Provider, tokenAmountToTrade: { toString: () => string; }) {
    const ethersProvider = new BrowserProvider(walletProvider);
    const signer = await ethersProvider.getSigner();
    const ERC20TestContractAddress = params.tokenInfo[1].toString(); 
    const ERC20TestContract = new Contract(ERC20TestContractAddress, ERC20TestArtifact.abi, signer);

    const reserveBalance = nativeSum;
    const reserveRatio = 50000;
    let options = {};
    if (!nativeTokenBool){
      let depositAmount = calculateRequiredDeposit(tokenSum, reserveBalance, reserveRatio, Number(tokenAmountToTrade));
      console.log("estimated deposit required",depositAmount);
      console.log("format depost units", ethers.formatUnits(depositAmount.toString(), 18))
      options = {
        value: depositAmount.toString(),
        gasLimit: ethers.toBeHex(1000000), // Correct use of hexlify
      };
    } else {
      options = {
        value: ethers.parseUnits(tokenAmountToTrade.toString(), 18),
        gasLimit: ethers.toBeHex(1000000), // Correct use of hexlify
      }; 
    }
    


    const ethValue = ethers.parseUnits(tokenAmountToTrade.toString(), 18);
    // console.log("scale", scale)
    console.log("ethValue: ", ethValue)
    const depositAmount = Number(ethers.formatUnits(ethValue, 18));
    console.log("depositAmount: ", depositAmount)
    console.log("tokenSum: ", tokenSum)
    console.log("reserveBalance", reserveBalance)
    console.log("reserveRatio", reserveRatio)
    console.log("slippage", slippage)
    // console.log("sent to fn", (Math.round(minTokens)).toString())

    try {
      const minTokens = calculateMinTokensWithSlippage(tokenSum, reserveBalance,reserveRatio, Number(ethValue), slippage);
      console.log("minTokens", minTokens)

      const mintTx = await ERC20TestContract.mint(minTokens.toString(),options);
      const txHash = mintTx.hash;
      const result = await mintTx.wait();

      return { result, txHash, ERC20TestContract };
    } catch (error) {
      console.error("Transaction error:", error);

      if (isErrorWithMessage(error) && error.message.includes("transaction execution reverted")) {
        const errorMessage = "Buy transaction failed! Error: Transaction Execution Reverted.";
        // toast.error(errorMessage);
        throw new Error(errorMessage); // Rethrow if you need further error handling
      }

      // Generic error if no specific message
      const genericMessage = "Transaction failed due to unknown reasons!";
      // toast.error(genericMessage);
      throw new Error(genericMessage);
    }
  
    // const mintTx = await ERC20TestContract.mint(options);

  }
  
  async function handleSellToken(walletProvider: ethers.Eip1193Provider, tokenAmountToTrade: { toString: () => any | ethers.Overrides; }) {
    const ethersProvider = new BrowserProvider(walletProvider);
    const signer = await ethersProvider.getSigner();
    const ERC20TestContractAddress = params.tokenInfo[1].toString(); 
    const ERC20TestContract = new Contract(ERC20TestContractAddress, ERC20TestArtifact.abi, signer);
    const options = {
      gasLimit: ethers.toBeHex(1000000),
    };
    const reserveRatio = 50000;
    console.log("_supply", tokenSum)
    console.log("_reserveBalance", nativeSum)
    console.log("_reserveRatio", reserveRatio)
    console.log("slippage", slippage)
    console.log("_sellAmount",Number(tokenAmountToTrade.toString()) )


    const minReturn = calculateMinReturnWithSlippage(tokenSum, nativeSum, reserveRatio, Number(tokenAmountToTrade.toString()), slippage);
    console.log("minReturn", minReturn)
    const burnTx = await ERC20TestContract.burn(tokenAmountToTrade.toString(),minReturn.toString(), options);
    const txHash = burnTx.hash;
    const result = await burnTx.wait();
    return { result, txHash, ERC20TestContract };
  }
  


  // place trade handler
  const handlePlaceTrade = async () => {
		try {
			if (!isConnected) throw Error('User is not connected')
      let chain: string;

      await handleChainChange().then( async (updatedChainId)=> {
        if (updatedChainId === 713715 ){
          chain = "sei"
        } else if (updatedChainId === 64165) {
          chain = "ftm"
        } else {
          toast.error("Chain error! Using unsupported network")
          return
        }
        if (walletProvider) {

          const ethersProvider = new BrowserProvider(walletProvider);
          const signer = await ethersProvider.getSigner();
          const ERC20TestContractAddress = params.tokenInfo[1].toString(); 
          const ERC20TestContract = new Contract(ERC20TestContractAddress, ERC20TestArtifact.abi, signer);
  
          if (buySell === 'buy') {
            toast.promise(
              handleBuyToken(walletProvider, tokenAmountToTrade),
              {
                pending: 'Processing buy transaction...',
                success: 'Buy transaction successful! 👌',
                error: {
                  render({data}) {
                      // Accessing error details
                      if (isErrorWithMessage(data)) {
                        return data.message;
                    }
                    return "An unexpected error occurred";
                  }
              }
              }
            ).then(({ result, txHash, ERC20TestContract }) => {
              if (result.status === 1) {
              // console.log("Transaction succeeded:", result);
              const iface = new Interface(ERC20TestArtifact.abi);
    
              result.logs.forEach((log: any) => {
                try {
                    const parsedLog = iface.parseLog(log);
                    if (parsedLog?.name === 'ContinuousMint') {
                      // console.log('ContinuousMint Event Args:', parsedLog.args);
                      
                      const info = {
                          selectedChain: chain,
                          contractAddress: ERC20TestContractAddress,
                          account: parsedLog.args[0],
                          amount: Number(parsedLog.args[1].toString()), // Ensure conversion to string before to Number if BigNumber
                          deposit: Number(parsedLog.args[2].toString()), // Same conversion as above
                          timestamp: Math.floor(Date.now() / 1000),
                          trade: buySell.toString(),
                          txHash: txHash
                      };
                      // console.log("Processed Event Data:", info);
                      postTransactionAndOHLC(info).then(response => {
                        console.log('Backend response:', response);
                        socket.emit("updated","updated to db");
                      }).catch(error => {
                          console.error('Error posting data to backend:', error);
                      });                
                    }            
                  } catch (error) {
                    // This log was not from our contract
                    console.error("Error parsing log:", error);
                }
             });
            } else {
              console.log("Transaction failed with receipt:", result);
              // Handle failure case
            }
              // handle success, parse logs, etc.
              setTokenAmountToTrade('');
              setTransactionDone(true);
            }).catch(error => {
              console.error("Buy transaction error:", error);
              setTransactionDone(false);
            });
          } else if (buySell === 'sell') {
            toast.promise(
              handleSellToken(walletProvider, tokenAmountToTrade),
              {
                pending: 'Processing sell transaction...',
                success: 'Sell transaction successful! 👌',
                error: 'Sell transaction failed! 🤯'
              }
            ).then(({ result, txHash, ERC20TestContract }) => {
              if (result.status === 1) {
              // console.log("Transaction succeeded:", result);
              const iface = new Interface(ERC20TestArtifact.abi);
    
              result.logs.forEach((log: any) => {
                try {
                    const parsedLog = iface.parseLog(log);
                    if (parsedLog?.name === 'ContinuousBurn') {
                      // console.log('ContinuousBurn Event Args:', parsedLog.args);
                      
                      const info = {
                          selectedChain: chain,
                          contractAddress: ERC20TestContractAddress,
                          account: parsedLog.args[0],
                          amount: Number(parsedLog.args[1].toString()), // Ensure conversion to string before to Number if BigNumber
                          deposit: Number(parsedLog.args[2].toString()), // Same conversion as above
                          timestamp: Math.floor(Date.now() / 1000),
                          trade: buySell.toString(),
                          txHash: txHash  
                      };
                      // console.log("Processed Event Data:", info);
                      postTransactionAndOHLC(info).then(response => {
                        console.log('Backend response:', response);
                      }).catch(error => {
                          console.error('Error posting data to backend:', error);
                      });                
                    }
                  } catch (error) {
                    // This log was not from our contract
                    console.error("Error parsing log:", error);
                }
             });
            } else {
              console.log("Transaction failed with receipt:", result);
              // Handle failure case
            }
              // handle success, parse logs, etc.
              setTokenAmountToTrade('');
              setTransactionDone(true);
            }).catch(error => {
              console.error("Sell transaction error:", error);
              setTransactionDone(false);
            });
          }
  
          
          
        } else {
          // Handle the case where walletProvider is undefined
          console.error("Wallet provider is not available.");
        }

      })
      

			

		} catch (error: any) {

			toast.error(`Deployment failed: ` + error);
		}	
	};

  
  if (!params.tokenInfo[1] || params.tokenInfo[1] === "") {
    return <div>Error: Token not found</div>;  // Display error if tokenAddress is undefined or empty
  }
  return (
    // <div style={{ display: 'grid', height: '100vh', gridTemplateRows: 'auto auto auto 1fr', alignItems: 'start' }}>
    

      <main className="h-full">
        <div className="md:block  mt-8 p-4">
          <div className="flex justify-center">
            <a className="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50 h-10 px-4 py-2 -mt-5 text-2xl text-slate-50 hover:font-bold hover:bg-transparent hover:text-slate-50" href="/">
              [go back]
            </a>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-center space-x-8 mt-4">
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
                    Market cap: ${marketCap}
                  </div>
                  <div>
                    Virtual liquidity: $29,384
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 text-xs">
                <span>
                  created by 
                </span>
                  <a href="/profile/{tokenDetails?.creator ? `${tokenDetails.creator.slice(-6)}` : 'Unknown'}">
                    <div className="flex gap-1 items-center">
                      {/* <img src="/pepe.png" className="w-4 h-4 rounded"></img> */}
                      <div className="px-1 rounded hover:underline flex gap-1 text-black bg-pink-400" >
                        {extractFirstSixCharac(tokenDetails?.creator || 'unknown')} 
                      </div>
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
                {/* <div className="mt-4 text-white">
                  {activeTab === 'thread' ? 'Thread Page' : 'Trades Page'}
                </div> */}
              </div>
              {activeTab === 'trades' && (
                <div className="w-full text-xs text-gray-400 bg-transparent rounded-lg">
                  <div className="bg-[#2e303a] rounded-lg grid grid-cols-4 sm:grid-cols-6">
                    <div className="col-span-1 p-3 font-normal text-left">Account</div>
                    <div className="col-span-1 p-3 font-normal text-left hidden sm:block">Type</div>
                    <div className="col-span-1 p-3 font-normal text-left sm:hidden">txn</div>
                    <div className="col-span-1 p-3 font-normal text-left">{nativeTokenInfo.chain}</div>
                    <div className="col-span-1 p-3 font-normal text-left">{tokenDetails?.token_ticker}</div>
                    <div className="col-span-1 p-3 font-normal text-left hidden md:block">
                      <div className="flex items-center">
                      Date 
                        {/* <span className="ml-1 inline-block align-middle hover:text-gray-300">
                          <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" className="cursor-pointer relative top-0" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" >
                            <path d="M12 4C14.7486 4 17.1749 5.38626 18.6156 7.5H16V9.5H22V3.5H20V5.99936C18.1762 3.57166 15.2724 2 12 2C6.47715 2 2 6.47715 2 12H4C4 7.58172 7.58172 4 12 4ZM20 12C20 16.4183 16.4183 20 12 20C9.25144 20 6.82508 18.6137 5.38443 16.5H8V14.5H2V20.5H4V18.0006C5.82381 20.4283 8.72764 22 12 22C17.5228 22 22 17.5228 22 12H20Z"></path>
                          </svg>
                        </span> */}
                      </div>
                    </div>
                    <div className="col-span-1 p-3 font-normal text-right hidden sm:block">Transaction</div>
                  </div>
                  {trades.length > 0 ? (
                  <div>
                      {trades.map(trade => (
                          <TradeItem key={trade.txid} trade={trade} networkType={params.tokenInfo[0]}/>
                      ))}
                  </div>
                    ) : (
                        <p>No trades found.</p>
                    )}
                </div>
              )}
              
            </div>
            <div className="w-1/3 grid gap-4 h-fit w-fit">
              <div className="w-[350px] grid gap-4">
                <div className="bg-[#2e303a] p-4 rounded-lg border border-none text-gray-400 grid gap-4">
                  <div className="grid grid-cols-2 gap-2 mb-4">
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
                    switch to {nativeTokenBool ? tokenDetails?.token_ticker : nativeTokenInfo.chain}
                  </button>
                    <div>
                      <button 
                        className="text-xs py-1 px-2 rounded text-gray-400 hover:bg-gray-800 bg-black"
                        onClick={toggleDialog}
                        aria-haspopup="dialog"
                      >
                        Set max slippage: {slippage}%
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
                      value={tokenAmountToTrade}
                      onChange={e => setTokenAmountToTrade(e.target.value)}/>
                        <div className="flex items-center ml-2 absolute right-2">
                        <span className="text-white mr-2">
                          {buySell === 'sell' ? tokenDetails?.token_ticker : (nativeTokenBool ? nativeTokenInfo.chain : tokenDetails?.token_ticker)}
                        </span>
                        {/* Conditionally display token logo or chain logo */}
                        <img 
                          className="w-8 h-8 rounded-full bg-white" 
                          src={buySell === 'sell' ? tokenDetails?.image_url : (nativeTokenBool ? nativeTokenInfo.chainLogo : tokenDetails?.image_url)}
                          alt={buySell === 'sell' ? tokenDetails?.token_name : (nativeTokenBool ? nativeTokenInfo.chain : tokenDetails?.token_name)}
                        />
                          
                          {/* <span className="text-white mr-2">{nativeToken ? nativeTokenInfo.chain : tokenDetails?.token_ticker}</span>
                          <img className="w-8 h-8 rounded-full bg-white" src={nativeToken ?  nativeTokenInfo.chainLogo: tokenDetails?.image_url}
                                    alt={nativeToken ? nativeTokenInfo.chain: tokenDetails?.token_name} /> */}
                        </div>
                          {/* <img className="w-8 h-8 rounded-full" src="https://www.liblogo.com/img-logo/so2809s56c-solana-logo-solana-crypto-logo-png-file-png-all.png" alt="SOL"></img> */}



                    </div>
                    <div className="flex mt-2 bg-[#2e303a] p-1 rounded-lg">
                      {nativeTokenBool && (
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
                  when the market cap reaches $50,000 all the liquidity from the bonding curve will be deposited into Raydium and burned. progression increases as the price goes up.<br/><br/>there are 99,485,219 tokens still available for sale in the bonding curve and there is 54.848 {nativeTokenInfo.chain} in the bonding curve.
                </div>
                  {/* <div className="text-yellow-500 font-bold">
                    👑 Crowned king of the hill on 12/04/2024, 12:20:58
                  </div> */}
                  <div className="grid gap-2">
                    <div className="font-bold">
                      Holder distribution
                    </div>
                    <div className="text-sm">
                    {isLoading || holders.length === 0 ? (
                      <div>Loading...</div>
                     ) : (
                      <div className="grid gap-1">
                          {holders.map((holder, index) => (
                              <div key={holder.account} className="flex justify-between">
                                   <a
                                    className="hover:underline"
                                    href={getAccountUrl(params.tokenInfo[0],holder.account)}
                                    target={getAccountUrl(params.tokenInfo[0], holder.account) ? "_blank" : undefined}
                                    rel={getAccountUrl(params.tokenInfo[0], holder.account) ? "noopener noreferrer" : undefined}
                                  >
                                      {index + 1}. {holder.account.substring(2, 8)}
                                      {holder.account === tokenDetails?.creator ? ' 🤵‍♂️ (dev)' : ''}
                                      {holder.account === tokenDetails?.token_address ? ' 🏦 (bonding curve)' : ''}
                                  </a>
                                  <div>
                                      {((holder.balance / tokenSum) * 100).toFixed(2)}%
                                  </div>
                              </div>
                          ))}
                      </div>
                    )}
                    </div>
                  </div>
              </div>
            </div>
          </div>
        </div>
        

      </main>
   
    
  )
}