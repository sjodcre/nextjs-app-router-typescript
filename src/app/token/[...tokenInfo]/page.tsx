"use client"

import { useEffect, useMemo, useState } from "react";
import { TokenHolder, TokenPageDetails, TradeData, Reply, TokenParams } from "@/app/_utils/types";
import CandleChart from "@/app/_ui/candle-chart";
import SlippageDialog from "@/app/_ui/slippage-dialog";
import IndeterminateProgressBar from "@/app/_ui/indeterminate-progress-bar";
import { BigNumber, ethers } from "ethers";
import Image from 'next/image';
// import ERC20TestArtifact from '../../../../artifacts/contracts/ERC20Test.sol/ERC20Test.json'
import ERC20TestArtifact from '@/../artifacts/contracts/ERC20Lock.sol/ERC20Lock.json'
import { fetchTokenInfo, getTokenTrades, getTopTokenHolders, postTransactionFailed } from "@/app/_services/db-write";
import { useSwitchNetwork, useWeb3ModalAccount, useWeb3ModalProvider } from "@web3modal/ethers5/react";
import { toast } from "react-toastify";
import TradeItem from "@/app/_ui/trade-list";
import { calculatePrice, extractFirstSixCharac, formatMarketCap, formatTokenAmount, getAccountUrl } from "@/app/_utils/helpers";
import { fetchNativeTokenPrice } from "@/app/_utils/native-token-pricing";
import { useAppSelector } from "@/app/_redux/store";
//import { socket } from "src/socket";
import useSocket from "@/app/_utils/use-socket";
import { burnToken, mintToken } from "@/app/_services/blockchain";
import { checkPendingTx } from "@/app/_utils/check-pending-tx";
import {buyTokensWithFTM,calculateTokenPrice,getReserves,sellTokensForFTM} from "@/app/_utils/spooky-swap";
import handleLogs from "@/app/_utils/log-handling";
// import AddTokenButton from "@/app/_utils/add-token-to-wallet";
import dynamic from 'next/dynamic';
import axios from "axios";

const AddTokenButton = dynamic(() => import('@/app/_utils/add-token-to-wallet'), { ssr: false });


export default function TokenPage({ params }: { params: { tokenInfo: string } }) {

  const slippage = useAppSelector((state) => state.userReducer.value.slippage);
  const [tokenDetails, setTokenDetails] = useState<TokenPageDetails>();
  const [tokenAmountToTrade, setTokenAmountToTrade] = useState('');
  const [nativeTokenBool, setNativeTokenBool] = useState(true);
  const [activeTab, setActiveTab] = useState('thread');
  const [buySell, setBuySell] = useState('buy');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState(0);
  const [holders, setHolders] = useState<TokenHolder[]>([]);
  // const [tokenSum, setTokenSum] = useState(0);
  const [tokenSum, setTokenSum] = useState<string>('0');
  const [bnTokenSum, setBnTokenSum] = useState<BigNumber | null>(null);
  // const [nativeSum, setNativeSum] = useState(0);
  const [nativeSum, setNativeSum] = useState<string>('0');
  const [bnNativeSum, setBnNativeSum] = useState<BigNumber | null>(null);
  const [marketCap, setMarketCap] = useState<string>('0');
  const [tokenPrice, setTokenPrice] = useState<number | null>(null);//ignore for now not used
  const [isTokenPriceFetched, setIsTokenPriceFetched] = useState(false);
  const [providerReady, setProviderReady] = useState(false);
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [transactionDone, setTransactionDone] = useState(false);
  const { switchNetwork } = useSwitchNetwork()
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [user, setUser] = useState('');
  const [isTrading, setIsTrading] = useState(false);
  // const [lockedTokens, setLockedTokens] = useState<number>(0);
  const [lockedTokens, setLockedTokens] = useState<BigNumber | null>(null);
  const [isLiquidityPoolSetup, setIsLiquidityPoolSetup] = useState<boolean>(false);
  const [dexUrl, setDexUrl] = useState('');
  // const [finalSupply, setFinalSupply] = useState<number | null>(null);
  const [finalSupply, setFinalSupply] = useState<BigNumber | null>(null);
  const [userBalance, setUserBalance] = useState({
    token: '0',
    native: '0',
  });
  const [nativeTokenPrice, setNativeTokenPrice] = useState<number | null>(null);
  const [nativeTokenInfo, setNativeTokenInfo] = useState({
    chain: '',
    chainId: 0,
    chainLogo: '',
  })
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState({
    token_address: params.tokenInfo[1],
    file_uri: '',
    text: '',
    creator: user,
    chain: params.tokenInfo[0],
    username: ''

  });
  const [isPhaseTwo, setIsPhaseTwo] = useState<boolean>(false); // Change this based on your logic
  const [currentChart, setCurrentChart] = useState<'current' | 'pump'>('current'); // Default to "Current chart"

  const { isConnected, chainId, address } = useWeb3ModalAccount()
  // const initialTokenSum = 5E18;
  const initialTokenSum = BigNumber.from('5000000000000000000'); // 5E18 in BigNumber
  const { walletProvider } = useWeb3ModalProvider()
  const { isSocketConnected, emitEvent, onEvent, offEvent, disconnectSoc } = useSocket();
  const [currentThreadPage, setCurrentThreadPage] = useState(1);
  const itemsPerThreadPage = 15;
  const [currentTradesPage, setCurrentTradesPage] = useState(1);
  const itemsPerTradesPage = 15;
  const tokensAvailable = finalSupply && bnTokenSum
  ? (ethers.utils.formatUnits(finalSupply.sub(bnTokenSum), 18))
  : ethers.BigNumber.from('0');

  const nativeInCurve = bnNativeSum
  ? (ethers.utils.formatUnits(bnNativeSum.sub(ethers.utils.parseUnits('0.1', 18)), 18))
  : ethers.BigNumber.from('0');

  // const marketCapLimit = 10*(nativeTokenPrice);
  const priceLimit = finalSupply? calculatePrice(ethers.BigNumber.from('500000000000000000'),finalSupply,ethers.BigNumber.from('50000')): 0;
  // console.log("price at which market cap limit is reached", priceLimit)
  const marketCapLimit = nativeTokenPrice && finalSupply? priceLimit *Number(ethers.utils.formatUnits(finalSupply, 18))* nativeTokenPrice : 0;
  // console.log("market cap limit", marketCapLimit)
  // const tokenAddress = params.tokenInfo[1]
    //popup model
    const [showModal, setShowModal] = useState(false);
  
    const [file,setFile] = useState<File>();


  //fetch final supply
  // useEffect(() => {
  //   const fetchFinalSupply = async () => {
  //     try {
  //       const response = await fetch('/api/simulate-bonding-curve', {
  //         method: 'POST',
  //       });
  //       const data = await response.json();
  //       setFinalSupply(data.finalSupply);
  //     } catch (error) {
  //       console.error('Error fetching final supply:', error);
  //     }
  //   };

  //   fetchFinalSupply();
  // }, []);

  //set bonding curve %
  useEffect(() => {
    // const marketCapValue = parseFloat(marketCap.replace(/,/g, ''));
    // const newProgress = (marketCapValue / marketCapLimit) * 100;
    const newProgress = tokenSum && finalSupply
  ? Number((BigNumber.from(tokenSum).sub((BigNumber.from('5000000000000000000')))))/Number(finalSupply.sub((BigNumber.from('5000000000000000000'))))*100 
  : 0;
  //   const bnTokenSum = ethers.BigNumber.from(tokenSum)
  //   // const newProgress = tokenSum? ((tokenSum - initialTokenSum)/1E18/(finalSupply - initialTokenSum/1E18))*100 : 0;
  //   const newProgress = bnTokenSum && finalSupply 
  // ? bnTokenSum.sub(initialTokenSum).div(ethers.BigNumber.from('1000000000000000000')).mul(100).div(finalSupply.sub(initialTokenSum.div(ethers.BigNumber.from('1000000000000000000')))).toNumber() 
  // : 0;
    // const newProgress = nativeTokenPrice ? (marketCapValue / marketCapLimit) * 100 : 0;


    // Ensure the progress doesn't exceed 100%
    if (newProgress > 100) {
      setProgress(100);
    } else {
      setProgress(newProgress);
    }
  }, [marketCap, tokenSum, finalSupply]);

  // const updateProgress = () => {
  //   const initialTokenSum = BigNumber.from('5000000000000000000'); // Initial token sum in BigNumber format

  //   const newProgress = tokenSum && finalSupply
  //     ? Number(BigNumber.from(tokenSum).sub(initialTokenSum)) / Number(finalSupply.sub(initialTokenSum)) * 100 
  //     : 0;
  //   console.log("newProgress", newProgress)
  //   // Ensure the progress doesn't exceed 100%
  //   if (newProgress > 100) {
  //     setProgress(100);
  //   } else {
  //     setProgress(newProgress);
  //   }
  // };

  //fetch native token price
  useEffect(() => {
    const updatePrice = async () => {
      try {
        const fetchedPrice = await fetchNativeTokenPrice(params.tokenInfo[0]);
        // console.log("native token price", fetchedPrice)
        setNativeTokenPrice(fetchedPrice);
        setIsTokenPriceFetched(true);
      } catch (error) {
        console.error('Error getting native token price:', error)
      }

    };

    updatePrice(); // Initial fetch
    const intervalId = setInterval(updatePrice, 86400000); // Update every 24 hours

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
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
      if (walletProvider) {
        const ethersProvider = new ethers.providers.Web3Provider(walletProvider);

        fetchERC20Balance(ethersProvider, params.tokenInfo[1])
          .then(balance => {
            setUserBalance(prevState => ({
              ...prevState,
              token: balance.toString()  // Replace `newValue` with the actual new value for the token balance
            }));
            setTransactionDone(false);

          })
          .catch(error => {
            // Error handling
            // console.log("fail to fetch user balance:", error)

          });
        fetchLockedTokens(ethersProvider, params.tokenInfo[1])
        .then(lockedTokens => {
          setLockedTokens(lockedTokens)
        }) .catch(error => {
          // Error handling
          // console.log("fail to fetch locked tokens:", error)
        });

        
      } 
    }
  }, [providerReady, transactionDone, chainId, walletProvider]);

  //non signer providers
  useEffect(() => {
    const checkAndSetPauseStatus = async () => {
      try {
        await checkPauseStatus(params.tokenInfo[1]);

      } catch (error) {
        console.error("Failed to fetch contract pause status:", error);
      }
    }
    const fetchAndSetMaxSupply = async () => {
      try {
        const maxTokenSupply = await fetchMaxSupply(params.tokenInfo[1]);
        if (maxTokenSupply) {
          setFinalSupply(maxTokenSupply);
        } else {
          console.error("Failed to fetch max token supply. Returned value is undefined.");
        }
      } catch (error) {
        console.error("Failed to fetch max token supply:", error);
      }
    };
    fetchAndSetMaxSupply();
    checkAndSetPauseStatus();
  },[params.tokenInfo])

  //set native token info
  useEffect(() => {

    setNativeTokenInfo({
      // chain: params.tokenInfo[0] === 'sei' ? 'SEI' : 'FTM',
      // // chainId: params.tokenInfo[0] === 'sei' ? 713715 : 64165,
      // chainId: params.tokenInfo[0] === 'sei' ? 713715 : 250,
      // chainLogo: params.tokenInfo[0] === 'sei' ? '/sei-logo.png' : '/ftm-logo.png'
      chain: params.tokenInfo[0] === 'ftm' ? 'FTM' : 'wtf??',
      // chainId: params.tokenInfo[0] === 'sei' ? 713715 : 64165,
      chainId: params.tokenInfo[0] === 'ftm' ? 250 : 0,
      chainLogo: params.tokenInfo[0] === 'ftm' ?  '/ftm-logo.png': 'skull-head.jpg'
    });
  }, [params.tokenInfo, nativeTokenPrice])


  const fetchDataAndUpdateProgress = () => {
    fetchData();
    ReplyList(params.tokenInfo[1]);
    // updateProgress();
  };

  //Fetch Data useeffect
  useEffect(() => {

    // Initial fetch of data
    // if (isTokenPriceFetched) {
      // fetchData();
      // // listenForTransferEvents();
      // ReplyList(params.tokenInfo[1]);
      fetchDataAndUpdateProgress();
    // }

    onEvent("refresh", fetchDataAndUpdateProgress);


    // onEvent("refresh", (value: any) => {
    //   // updateData(value);
    //   fetchData();
    //   ReplyList(params.tokenInfo[1]);
    // });

    return () => {
      offEvent("refresh", fetchDataAndUpdateProgress);
    };


  }, [isTokenPriceFetched,marketCap]);

  //Fetch Reply useeffect
  useEffect(() => {

    // Initial fetch of data

    ReplyList(params.tokenInfo[1]);

    onEvent("replyGet", (value: any) => {
      ReplyList(params.tokenInfo[1]);
    });

    return () => {
      offEvent("replyGet", fetchData);
    };


  }, []);

  


  const totalTradesPages = useMemo(() => {
    return Math.ceil(trades.length / itemsPerTradesPage);
  }, [trades, itemsPerTradesPage]);

  // Get current trades to display
  const currentTrades = useMemo(() => {
    const startIndex = (currentTradesPage - 1) * itemsPerTradesPage;
    const endIndex = startIndex + itemsPerTradesPage;
    return trades.slice(startIndex, endIndex);
  }, [trades, currentTradesPage, itemsPerTradesPage]);

  const totalThreadPages = useMemo(() => {
    return Math.ceil(replies.length / itemsPerThreadPage);
  }, [replies, itemsPerThreadPage]);

  const currentThread = useMemo(() => {
    const startIndex = (currentThreadPage - 1) * itemsPerThreadPage;
    const endIndex = startIndex + itemsPerThreadPage;
    return replies.slice(startIndex, endIndex);
  }, [replies, currentThreadPage, itemsPerThreadPage]);

  //when user change wallet
  useEffect(() => {
    setTokenAmountToTrade('');
  }, [address])

  //get pending tx
  useEffect(() => {
    if (trades.length > 1 && !initialCheckDone) {
      const changes = checkPendingTx(params.tokenInfo[0], params.tokenInfo[1]);
      setInitialCheckDone(true);

    }

    // if (changes ==='true'){
    //   socket.emit("updated", "updated to db");
    // }
  }, [trades]);

  useEffect(() => {
    // Ensure that the address is defined before setting the creator
    if (address) {
      setUser(address);
      setNewReply(prevReply => ({
        ...prevReply,
        creator: address
      }));
    }
  }, [address]);

  // useEffect(() => {
  //   if (tokenAddress) {
  //     emitEvent('subscribeToToken', tokenAddress);

  //     const handleUrlUpdated = (data: { url: string }) => {
  //       setPhaseTwoUrl(data.url);
  //       setIsPhaseTwo(true);
  //     };

  //     onEvent(`urlUpdated-${tokenAddress}`, handleUrlUpdated);

  //     return () => {
  //       offEvent(`urlUpdated-${tokenAddress}`, handleUrlUpdated);
  //     };
  //   }
  // }, [tokenAddress, emitEvent, onEvent, offEvent]);

  //fetch token info once only
  const fetchTokenInfoData = async () => {
    try {
      const tokenInfo = await fetchTokenInfo(params.tokenInfo[0], params.tokenInfo[1]);
      setDexUrl(tokenInfo[0].dex_url);
      setIsPhaseTwo(tokenInfo[0].phase_two);
      setTokenDetails(tokenInfo[0]);
    } catch (error) {
      console.error("Error fetching token info:", error);
    }
  };

  useEffect(() => {
    fetchTokenInfoData();
  }, []);

  //calculate and set market cap
  const calculateAndSetMarketCap = async (tradesData) => {
    if (tradesData && tradesData.length > 0 && nativeTokenPrice !== null) {
      let marketCap = 0;
      if (!isPhaseTwo) {
        marketCap = tradesData[0].sum_token * tradesData[0].price_per_token * nativeTokenPrice / 1E18;
        console.log("marketcap from calculation", marketCap);
        console.log("marketcap from db", tradesData[0].marketcap * nativeTokenPrice);
      } else {
        try {
          const reservesData = await getReserves(dexUrl);
          const tokenPriceInUSD = calculateTokenPrice(reservesData, nativeTokenPrice);
          setTokenPrice(tokenPriceInUSD);

          marketCap =
            reservesData.reserve1 * tokenPriceInUSD +
            reservesData.reserve0 * nativeTokenPrice;
        } catch (error) {
          console.error("Error setting phase 2 market cap", error);
        }
      }

      const formattedMarketCap = formatMarketCap(marketCap);
      setMarketCap(formattedMarketCap);
    }
  };

    //fetch token holders
    const fetchHolders = async () => {
      setIsLoading(true); // Start loading
  
      const data = await getTopTokenHolders(params.tokenInfo[0], params.tokenInfo[1]); // Assume this fetches the data as shown in your example
      setHolders(data);
  
      // const sum = data.reduce((acc: any, holder: { balance: any; }) => acc + holder.balance, 0);
      setIsLoading(false); // End loading
    };
  

  // Function to fetch data
  const fetchData = async () => {
    // const tokenInfoPromise = fetchTokenInfo(params.tokenInfo[0], params.tokenInfo[1]);
    const tradesDataPromise = getTokenTrades(params.tokenInfo[0], params.tokenInfo[1]);
    // const [tokenInfo, tradesData] = await Promise.all([tokenInfoPromise, tradesDataPromise]);
    const tradesData = await tradesDataPromise;

    setTrades(tradesData);
    setTokenSum(tradesData[0].sum_token);
    // console.log("tokenSum",tradesData[0].sum_token )
    setBnTokenSum(ethers.BigNumber.from(tradesData[0].sum_token));
    setNativeSum(tradesData[0].sum_native);
    setBnNativeSum(ethers.BigNumber.from(tradesData[0].sum_native));
    fetchHolders();

    await calculateAndSetMarketCap(tradesData);
    // console.log("data fetch");
  };

  async function fetchLockedTokens (walletProvider: any, tokenAddress:string )  {
    if (walletProvider && address && nativeTokenInfo.chainId == chainId) {
      // const provider = new ethers.providers.Web3Provider(walletProvider)
      const signer = await walletProvider.getSigner()
      const signerAddr = await signer.getAddress();
      const ERC20LockContract = new ethers.Contract(tokenAddress, ERC20TestArtifact.abi, signer);
      try {
        const lockedTokens = await ERC20LockContract.getLockedTokens(signerAddr.toString());
        // const maxTokenSupply = await ERC20LockContract.getMaxTokenSupply();
        // console.log("lockedTokens", lockedTokens)
        const gasPrice1 = await walletProvider.getGasPrice();
        // console.log('Current gas price:', gasPrice1.toString());

        return lockedTokens
      } catch (error){
        console.error("Error getting locked amount:", error);
      throw error;
      }

    }

  }

  async function fetchMaxSupply (tokenAddress:string )  {
    // if ((chainId !== nativeTokenInfo.chainId)) {
    //   console.error("chainId does not match nativeTokenInfo.chainId");
    //   return undefined;
    // }
    // console.log('tokanAddress',tokenAddress)
      // const provider = new ethers.providers.Web3Provider(walletProvider)
      const provider = new ethers.providers.JsonRpcProvider('https://fantom-rpc.publicnode.com/');

      // const signer = await walletProvider.getSigner()
      const ERC20LockContract = new ethers.Contract(tokenAddress, ERC20TestArtifact.abi, provider);
      try {
        const maxTokenSupply = await ERC20LockContract.getMaxTokenSupply();
        // console.log("maxToken supply", maxTokenSupply.toString())

        return maxTokenSupply
      } catch (error){
        console.error("Error getting max supply:", error);
        throw error;
      }

    

  }

  async function checkPauseStatus(tokenAddress: string) {
    // const signer = await walletProvider.getSigner();
    // const signerAddr = await signer.getAddress();
    const provider = new ethers.providers.JsonRpcProvider('https://fantom-rpc.publicnode.com/');

    const ERC20LockContract = new ethers.Contract(tokenAddress, ERC20TestArtifact.abi, provider);
    try {
      const liquidityPoolStatus = await ERC20LockContract.isLiquidityPoolSetup();
      // console.log("liquidityPoolStatus", liquidityPoolStatus);
      // setIsLiquidityPoolSetup(liquidityPoolStatus); // Ensure setIsLiquidityPoolSetup is defined in your component
      setIsLiquidityPoolSetup(liquidityPoolStatus)

    } catch (error) {
      // console.log("error checking liquidity pool status", error);
    }
  }

  async function fetchERC20Balance(walletProvider: any, tokenAddress: string) {
    const signer = await walletProvider.getSigner();
    const signerAddr = await signer.getAddress();
    const contract = new ethers.Contract(tokenAddress, ERC20TestArtifact.abi, signer);

    try {

      if (chainId === nativeTokenInfo.chainId) {
        const balance = await contract.balanceOf(signerAddr.toString());
        const bigNumberValue = ethers.BigNumber.from(balance);

        // console.log('BigNumber Value:', bigNumberValue.toString());
        return bigNumberValue;
      } else {
        return 0;
      }

    } catch (error) {
      console.error("Failed to fetch token balance:", error);
      throw error;  // or handle error appropriately
    }
  }

  const ensureAbsoluteUrl = (url: string): string => {
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`;
    }
    return url;
  };

  //slippage dialog
  const toggleDialog = () => setDialogOpen(!dialogOpen);

  const updateReply = (property: any, value: any) => {
    setNewReply((prevReply) => ({
      ...prevReply,
      [property]: value,
    }));
  };

  const formattedLockedTokens = useMemo(() => formatTokenAmount(Number(lockedTokens? lockedTokens: 0)), [lockedTokens]);//no need precision so Number cast

  // Calculate the percentage using useMemo
  const lockedPercentage = useMemo(() => {
   if (userBalance.token === '0') return 0;
   return ((Number(lockedTokens) / Number(userBalance.token)) * 100).toFixed(2);//will lose precision either way
 }, [lockedTokens, userBalance.token]);

  // Threads Code
  const ReplyList = (token_address: string) => {
  fetch(`/api/thread/replies?token_address=${token_address}&chain=${params.tokenInfo[0]}`)
    .then((res) => res.json())
    .then((data) => {
    // console.log("data for replies", data)
      setReplies(data)})
    .catch((error) => {
      console.error('Error fetching replies:', error);
      setReplies([]);
    });
  }

  //tokena mount to buy/sell
  const handleSetAmount = (amount: string) => {
    setTokenAmountToTrade(amount);  // Assuming tokenAmount is a string, if not, convert appropriately
  };

  const handleSetPercentage = (percentage: number) => {
    // handleChainChange()
    // const fullAmount = userBalance.token; // Assuming `userBalance.token` holds the full token balance as a number
    // const amountToSet = (fullAmount * percentage / 100).toFixed(0); // Calculating the percentage and rounding it to the nearest whole number
    if (!isConnected){
      setIsTrading(false); 
      toast.error("User is not connected")
      return
    }


    handleChainChange()
      .then(async () => {
        
        // This code executes after successful network change
        const percentageBigNumber = BigNumber.from(percentage);
        const fullAmount = userBalance.token;
        const sellableAmount = ethers.BigNumber.from(fullAmount).sub(lockedTokens);
        // const amountToSet = (sellableAmount * percentage / 100).toFixed(0); // Calculating the percentage and rounding it to the nearest whole number
        const amountToSet = sellableAmount
        .mul(percentageBigNumber)
        .div(100);

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
    if (tab === 'sell') {
      setNativeTokenBool(true);
    }
  }

  //switch to native/erc20 token
  const handleToggleToken = () => {
    setNativeTokenBool(!nativeTokenBool);
  };

  async function handleChainChange() {
    return new Promise((resolve, reject) => {
      // Assuming chain IDs for 'sei' and 'ftm' as constants for clarity
      // const SEI_CHAIN_ID = 713715;
      // const FTM_CHAIN_ID = 64165;
      const FTM_CHAIN_ID = 250;


      let targetChainId = 250;

      // if (params.tokenInfo[0] === "sei" && chainId !== SEI_CHAIN_ID) {
      //   targetChainId = SEI_CHAIN_ID;
      // } else if (params.tokenInfo[0] === "ftm" && chainId !== FTM_CHAIN_ID) {
      //   targetChainId = FTM_CHAIN_ID;
      // }

      // if (targetChainId !== null) {
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

  // async function listenForTransferEvents() {
  //   const provider = new ethers.providers.JsonRpcProvider('https://fantom-rpc.publicnode.com/');
  //   const tokenAddress = params.tokenInfo[1];
  //   const tokenABI = [
  //     'event Transfer(address indexed from, address indexed to, uint256 value)',
  //   ];
  //   const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);
  //   tokenContract.on('Transfer', (from, to, value, event) => {
  //     console.log(`Transfer detected from ${from} to ${to} of ${value.toString()} tokens`);
  //     // Update your database here with the new holder information
  //     // updateHoldersDatabase(from, to, value.toString());
  //   });
  // }

  // async function listenForTransferEvents() {
  //   if (isPhaseTwo) {
  //     const provider = new ethers.providers.JsonRpcProvider('https://fantom-rpc.publicnode.com/');
  //     const tokenAddress = params.tokenInfo[1];
  //     const tokenABI = [
  //       'event Transfer(address indexed from, address indexed to, uint256 value)',
  //     ];
  //     const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);
    
  //     tokenContract.on('Transfer', async (from, to, value, event) => {
  //       console.log(`Transfer detected from ${from} to ${to} of ${value.toString()} tokens`);
  //       console.log("value used", parseFloat(ethers.utils.formatUnits(value, 0)))
  //       // Send the transfer data to the server to update balances
  //       try {
  //         await axios.post('/api/ftm/update-holders', {
  //           tokenAddress,
  //           from,
  //           to,
  //           value: parseFloat(ethers.utils.formatUnits(value, 0)) // Ensure value is a number
  //         });
  //       } catch (error) {
  //         console.error('Error updating balances:', error);
  //       }
  //     });
  //   }
    
  // }

  // async function checkPauseStatus(walletProvider: any, tokenAddress: string) {
  //   const signer = await walletProvider.getSigner();
  //   const signerAddr = await signer.getAddress();
  //   const ERC20LockContract = new ethers.Contract(tokenAddress, ERC20TestArtifact.abi, signer);
  //   try {
  //     const pauseStatue = await ERC20LockContract.paused();
  //     console.log("pauseResp", pauseStatue)
  //     setIsPaused(pauseStatue)
  //   } catch (error) {
  //     console.log("error checking pause status")
  //   }
  // }

  async function handleBuyToken(walletProvider: any, tokenAmountToTrade: { toString: () => string; }, chain: string) {
    const ERC20TestContractAddress = params.tokenInfo[1].toString();
    // const ERC20TestContract = new Contract(ERC20TestContractAddress, ERC20TestArtifact.abi, signer);
    // const toRet = mintToken(chain, ERC20TestContractAddress, walletProvider, nativeSum, tokenSum, nativeTokenBool, tokenAmountToTrade, slippage)
    let toRet;

    if (isPhaseTwo) {
      toRet =await buyTokensWithFTM(chain, walletProvider, ERC20TestContractAddress, tokenAmountToTrade, slippage);

    } else {
      toRet = mintToken(chain, ERC20TestContractAddress, walletProvider, nativeSum, tokenSum, nativeTokenBool, tokenAmountToTrade, slippage)
    }
    return toRet;

  }

  async function handleSellToken(walletProvider: any, tokenAmountToTrade: { toString: () => any | ethers.Overrides; }, chain: string) {
    const ERC20TestContractAddress = params.tokenInfo[1].toString();

    let toRet;
    if (isPhaseTwo) {
      toRet = await sellTokensForFTM(walletProvider, ERC20TestContractAddress, tokenAmountToTrade, slippage)
    } else {
      toRet = burnToken(chain, ERC20TestContractAddress, nativeSum, tokenSum, tokenAmountToTrade, slippage, walletProvider)
    }

    return toRet;
  }

  // place trade handler
  const handlePlaceTrade = async () => {
    if (isTrading) return; // Prevent further actions if already trading
    setIsTrading(true); // Set trading state to true to block further trades
    try {
      if (!isConnected){
        setIsTrading(false); 
        throw Error('User is not connected')
      }

      if(tokenAmountToTrade === "" || tokenAmountToTrade === "0") {
        toast.error("Amount cannt be less than or equal to 0")
        setIsTrading(false)
        return
      }

      let chain: string;

      await handleChainChange().then(async (updatedChainId) => {
        // if (updatedChainId === 713715) {
        //   chain = "sei"
        // // } else if (updatedChainId === 64165) {
        // } else 
        if (updatedChainId === 250) {

          chain = "ftm"
        } else {
          toast.error("Chain error! Using unsupported network")
          setIsTrading(false); // Reset trading state on error
          return
        }
        if (walletProvider) {

          // const ethersProvider = new BrowserProvider(walletProvider);
          // const signer = await ethersProvider.getSigner();
          const ERC20TestContractAddress = params.tokenInfo[1].toString();

          if (buySell === 'buy') {
            if (!nativeTokenBool) {
              const tokenAmount = parseInt(tokenAmountToTrade.toString(), 10);
              if (Number.isNaN(tokenAmount) || tokenAmount <= 0) {
                const error = new Error("Invalid token amount. Please enter a valid integer greater than 0.");
                toast.error(error.message);
                setIsTrading(false);
                return  // Reject the promise to stop further execution
              }
            }
            toast.promise(
              handleBuyToken(walletProvider, tokenAmountToTrade, chain),
              {
                pending: 'Processing buy transaction...',
                success: 'Buy transaction successful! 👌',
                error: 'Transaction Failed'
              }
            ).then(({ result, txHash }) => {
              // console.log("result status", result.status)
              if (result.status === 1) {
                // console.log("Transaction succeeded:", result);
          
                handleLogs(result, isPhaseTwo, chain, ERC20TestContractAddress, buySell, txHash, tokenDetails, emitEvent).then(() => {
                  setTokenAmountToTrade('');
                  setTransactionDone(true);
                  setIsTrading(false); // Reset trading state after success
                }).catch(error => {
                  console.error('Error handling logs:', error);
                  setIsTrading(false);

                });
          
              }
              // if (result.status === 1) {
              //   console.log("Transaction succeeded:", result);
              //   const iface = new Interface(ERC20TestArtifact.abi);

              //   result.logs.forEach((log: any) => {
              //     try {
              //       const parsedLog = iface.parseLog(log);
              //       if (parsedLog?.name === 'ContinuousMint') {
              //         console.log('ContinuousMint Event Args:', parsedLog.args);

              //         const info = {
              //           selectedChain: chain,
              //           contractAddress: ERC20TestContractAddress,
              //           account: parsedLog.args[0],
              //           status: "successful",
              //           amount: Number(parsedLog.args[1].toString()), // Ensure conversion to string before to Number if BigNumber
              //           deposit: Number(parsedLog.args[2].toString()), // Same conversion as above
              //           timestamp: Math.floor(Date.now() / 1000),
              //           trade: buySell.toString(),
              //           txHash: txHash
              //         };
              //         // console.log("Processed Event Data:", info);
              //         postTransactionAndOHLC(info, false).then(response => {
              //           console.log('Backend response:', response.message);
              //           // socket.emit("updated", "updated to db");
              //           const updatedInfo = {
              //             ...info,
              //             txid: response.txid,
              //             token_ticker: tokenDetails?.token_ticker,
              //             token_name: tokenDetails?.token_name,
              //             token_description: tokenDetails?.token_description
              //           };
              //           emitEvent("updated", updatedInfo);

              //         }).catch(error => {
              //           console.error('Error posting data to backend:', error);
              //         });
              //       }
              //     } catch (error) {
              //       // This log was not from our contract
              //       console.error("Error parsing log:", error);
              //     }
              //   });
              // } 
              else if (result.status === 0) {
                // console.log("Transaction failed with receipt:", result);
                // Handle failure case

                const info = {
                  selectedChain: chain,
                  status: "failed",
                  timestamp: Math.floor(Date.now() / 1000),
                  txHash: txHash
                };
                postTransactionFailed(info).then(response => {
                  // console.log('Backend response:', response);
                }).catch(error => {
                  console.error('Error posting data to backend:', error);
                });

              } else {
                // console.log("transaction result not found")
                // return 'Transaction not found or pending';
              }
              setTokenAmountToTrade('');
              setTransactionDone(true);
              setIsTrading(false); // Reset trading state after success
            }).catch(error => {
              // console.error("Buy transaction error:", error);
              // const info = {
              //   selectedChain: chain,
              //   status: "failed",
              //   timestamp: Math.floor(Date.now() / 1000),
              //   txHash: error.transaction.hash
              // };
              // postTransactionFailed(info).then(response => {
              //   console.log('Backend response:', response);
              //   setIsTrading(false);
              // }).catch(error => {
              //   console.error('Error posting data to backend:', error);
              //   setIsTrading(false);
              // });
              // setTransactionDone(false);
              // setIsTrading(false);
              if (error.message.includes('user rejected transaction')) {
                toast.error('Transaction rejected by user.');
                setTransactionDone(false);
                setIsTrading(false);
              } else {
                const info = {
                  selectedChain: chain,
                  status: "failed",
                  timestamp: Math.floor(Date.now() / 1000),
                  txHash: error.transaction ? error.transaction.hash : 'Unknown'
                };
                postTransactionFailed(info).then(response => {
                  // console.log('Backend response:', response);
                  setIsTrading(false);
                }).catch(error => {
                  console.error('Error posting data to backend:', error);
                  setIsTrading(false);
                });
                setTransactionDone(false);
                setIsTrading(false);
              }

            });
          } else if (buySell === 'sell') {

            const tokenAmount = parseInt(tokenAmountToTrade.toString(), 10);
            if (Number.isNaN(tokenAmount) || tokenAmount <= 0) {
              const error = new Error("Invalid token amount. Please enter a valid integer greater than 0.");
              toast.error(error.message);
              setIsTrading(false);
              return  // Reject the promise to stop further execution
            }

            toast.promise(
              handleSellToken(walletProvider, tokenAmountToTrade, chain),
              {
                pending: 'Processing sell transaction...',
                success: 'Sell transaction successful! 👌',
                error: 'Sell transaction failed! 🤯'
              }
            ).then(({ result, txHash }) => {
              if (result.status === 1) {
                // console.log("Transaction succeeded:", result);
          
                handleLogs(result, isPhaseTwo, chain, ERC20TestContractAddress, buySell, txHash, tokenDetails, emitEvent).then(() => {
                  setTokenAmountToTrade('');
                  setTransactionDone(true);
                  setIsTrading(false); // Reset trading state after success
                }).catch(error => {
                  console.error('Error handling logs:', error);
                  setIsTrading(false);

                });
          
              }
              // if (result.status === 1) {
              //   // console.log("Transaction succeeded:", result);
              //   const iface = new Interface(ERC20TestArtifact.abi);

              //   result.logs.forEach((log: any) => {
              //     try {
              //       const parsedLog = iface.parseLog(log);
              //       if (parsedLog?.name === 'ContinuousBurn') {

              //         const info = {
              //           selectedChain: chain,
              //           contractAddress: ERC20TestContractAddress,
              //           account: parsedLog.args[0],
              //           status: "successful",
              //           amount: Number(parsedLog.args[1].toString()), // Ensure conversion to string before to Number if BigNumber
              //           deposit: Number(parsedLog.args[2].toString()), // Same conversion as above
              //           timestamp: Math.floor(Date.now() / 1000),
              //           trade: buySell.toString(),
              //           txHash: txHash
              //         };
              //         postTransactionAndOHLC(info, false).then(response => {
              //           // let txid = response.primaryKey
              //           // console.log('primary key', txid)
              //           console.log('Backend response:', response.message);
              //           // socket.emit("updated", "updated to db");
              //           const updatedInfo = {
              //             ...info,
              //             txid: response.txid,
              //             token_ticker: tokenDetails?.token_ticker,
              //             token_name: tokenDetails?.token_name,
              //             token_description: tokenDetails?.token_description
              //           };
              //           emitEvent("updated", updatedInfo);
              //           // emitEvent("updated",info);

              //         }).catch(error => {
              //           console.error('Error posting data to backend:', error);
              //         });
              //       }
              //     } catch (error) {
              //       // This log was not from our contract
              //       console.error("Error parsing log:", error);
              //     }
              //   });
               else if (result.status === 0) {
                // console.log("Transaction failed with receipt:", result);
                // Handle failure case
                const info = {
                  selectedChain: chain,
                  status: "failed",
                  timestamp: Math.floor(Date.now() / 1000),
                  txHash: txHash
                };
                postTransactionFailed(info).then(response => {
                  // console.log('Backend response:', response);
                }).catch(error => {
                  console.error('Error posting data to backend:', error);
                });
              }  else {
                // console.log("transaction result not found")
                // return 'Transaction not found or pending';
              }
              // handle success, parse logs, etc.
              setTokenAmountToTrade('');
              setTransactionDone(true);
              setIsTrading(false); 
            }).catch(error => {
              // console.error("Sell transaction error:", error);
              // const info = {
              //   selectedChain: chain,
              //   status: "failed",
              //   timestamp: Math.floor(Date.now() / 1000),
              //   txHash: error.transaction.hash
              // };
              // postTransactionFailed(info).then(response => {
              //   console.log('Backend response tokeninfo:', response);
              //   setIsTrading(false);
              // }).catch(error => {
              //   console.error('Error posting data to backend:', error);
              //   setIsTrading(false);
              // });
              // setTransactionDone(false);
              // setIsTrading(false);
              if (error.message.includes('user rejected transaction')) {
                toast.error('Transaction rejected by user.');
                setTransactionDone(false);
                setIsTrading(false);
              } else {
                const info = {
                  selectedChain: chain,
                  status: "failed",
                  timestamp: Math.floor(Date.now() / 1000),
                  txHash: error.transaction ? error.transaction.hash : 'Unknown'
                };
                postTransactionFailed(info).then(response => {
                  // console.log('Backend response:', response);
                  setIsTrading(false);
                }).catch(error => {
                  console.error('Error posting data to backend:', error);
                  setIsTrading(false);
                });
                setTransactionDone(false);
                setIsTrading(false);
              }
            });
          }



        } else {
          // Handle the case where walletProvider is undefined
          console.error("Wallet provider is not available.");
          setIsTrading(false);
        }

      })




    } catch (error: any) {

      toast.error(`Transaction failed: ` + error);
      setIsTrading(false);
    }
  };

  const handleReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewReply(prevData => ({
      ...prevData,
      [name]: value,
    }));

  };

  const handleUploadImage = async (imageFile?: File): Promise<string> => {
		if (!imageFile) {
			toast.error('No image file provided');
        return Promise.reject(new Error('No image file provided'));
		}

			try{
				const data = new FormData()
				data.set('file',imageFile)
				const response = await fetch ("/api/deploy", {
					method: 'POST',
					body: data
				})
        
				const result = await response.json();
				if (response.ok) {
					toast.success(`Image uploaded. Arweave URL: ${result}`);
					return result;
				} else {
				  throw new Error(result.error || 'Upload failed');
				}

			} catch (error: any) {
				// console.error('Image upload error:', error);
    			toast.error(`Error: ${error.message}`);
				return Promise.reject(new Error(error.message || 'Upload failed'));

			}		
		
	}

  const handleChartSwitch = (chart: 'current' | 'pump') => {
    setCurrentChart(chart);
  };

  const handleReplySubmit = async (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!newReply.text.trim() || !newReply.creator.trim()) {
      toast.error("Text and creator fields cannot be empty.")
        return; // Stop the function if validation fails
    } 

    if(file){
      let url = '';
      try {
        url = await handleUploadImage(file);
        // console.log('Uploaded Image URL:', url);
        updateReply('file_uri', url);
      } catch (error) {
        console.error('Failed to upload image:', error);
        // Consider whether you want to continue or throw an error here
      }
  
    }
    
    try {
      const response = await fetch(`/api/thread/replies`, {
        method: 'POST',
        body: JSON.stringify(newReply),
      });
      const responseData = await response.json();

      if (response.ok) {
        
        emitEvent("replyPost", '');
        setShowModal(false);
      } 

    } catch (error) {
      alert(error);
      console.error('Error posting reply:', error);
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
          {/* <button className="text-xs py-1 px-2 ml-1 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                              onClick={() => handlePause()}>
                              pause 
                            </button> */}
          {/* <button className="text-xs py-1 px-2 ml-1 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300"
            onClick={() => handleSecondPhase()}>
            2nd Phase 
          </button> */}
          {/* <button className="text-xs py-1 px-2 ml-1 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300"
            onClick={() => handleWithdrawToken()}>
            withdraw token
          </button> */}
          {/* <button className="text-xs py-1 px-2 ml-1 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300"
            onClick={() => updateHolders()}>
            holders balances
          </button> */}
        </div>
        {isLiquidityPoolSetup && !isPhaseTwo && <div className="flex flex-col md:flex-row justify-center items-center space-x-8 mt-4">
          <div className="justify-center p-4 w-fit bg-green-300 rounded mt-4 mb-4">
            bonding curve complete! a spooky swap pool will be seeded in the next 5-20 minutes with $14,177
                    of liquidity. A link to the pool will be provided here once complete. Only trust the the link that is posted here.
          </div>
        </div>}
        {isPhaseTwo && <div className="justify-center p-4 w-fit bg-green-300 rounded mt-4 mb-4">
          spooky swap pool seeded! view the coin on spooky swap{' '}
          <a className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" href={`https://dexscreener.com/fantom/${dexUrl}?embed=1&theme=dark&trades=0&info=0`}>
            here
          </a>
        </div>}
        <div className="flex flex-col md:flex-row justify-center space-x-8 mt-4">
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
                {/* <div>
                  Virtual liquidity: $29,384
                </div> */}
              </div>
              <div className="inline-flex items-center gap-2 text-xs">
                <span>
                  created by
                </span>
                {/* <a href="/profile/{tokenDetails?.creator ? `${tokenDetails.creator.slice(-6)}` : 'Unknown'}"> */}
                <a href={`/profile/${tokenDetails?.creator ? tokenDetails.creator : 'Unknown'}`}>

                  <div className="flex gap-1 items-center">
                    {/* <img src="/logo.webp" className="w-4 h-4 rounded"></img> */}
                    <div className="relative w-4 h-4 rounded">
                      <Image
                        src="/logo.webp"
                        alt="Logo"
                        fill
                        sizes="32px"
                        className="rounded"
                      />
                    </div>
                    <div className="px-1 rounded hover:underline flex gap-1 text-black bg-pink-400" >
                      {/* {extractFirstSixCharac(tokenDetails?.creator_username || tokenDetails?.creator || 'unknown')} */}
                      {extractFirstSixCharac(tokenDetails?.creator_username ? tokenDetails.creator_username : (tokenDetails?.creator || 'unknown'))}

                    </div>
                  </div>
                </a>
              </div>
            </div>
            {/* <div className="flex gap-1 h-fit items-center text-white">
              <div className="cursor-pointer px-1 rounded hover:bg-gray-800 text-gray-500">
                Pump chart
              </div>
              <div className="cursor-pointer px-1 rounded bg-green-300 text-black">
                Current chart
              </div>
            </div> */}
            {isPhaseTwo && (
              <div className="flex gap-1 h-fit items-center text-white">
                <div
                  className={`cursor-pointer px-1 rounded ${currentChart === 'pump' ? 'bg-green-300 text-black' : 'hover:bg-gray-800 text-gray-500'}`}
                  onClick={() => handleChartSwitch('pump')}
                >
                  Pump chart
                </div>
                <div
                  className={`cursor-pointer px-1 rounded ${currentChart === 'current' ? 'bg-green-300 text-black' : 'hover:bg-gray-800 text-gray-500'}`}
                  onClick={() => handleChartSwitch('current')}
                >
                  Current chart
                </div>
              </div>
            )}

            {/* <div className="h-4/8">
              <div className="grid h-fit gap-2">
                <div className="chart-container ">
                  <CandleChart tokenAddress={params.tokenInfo[1]} chainId={params.tokenInfo[0]} />
                  <div className="hidden">
                    <div id="dexscreener-embed">
                      <iframe src="https://dexscreener.com/solana/null?embed=1&amp;theme=dark&amp;trades=0&amp;info=0" style="height: 400px; width: 99%;">
                      </iframe>
                    </div>
                  </div>
                </div>
              </div>
            </div> */}
            
            <div className="h-4/8">
              <div className="grid h-fit gap-2">
                <div className="chart-container">
                  {currentChart === 'current' && isPhaseTwo? (
                    <div id="dexscreener-embed">
                      <iframe
                        src={`https://dexscreener.com/fantom/${dexUrl}?embed=1&theme=dark&trades=0&info=0`}
                        style={{ height: '400px', width: '100%' }}
                        allowFullScreen
                        title="Dexscreener Chart"
                      ></iframe>
                    </div>
                  ) : (
                    <CandleChart tokenAddress={params.tokenInfo[1]} chainId={params.tokenInfo[0]} />
                  )}
                </div>
              </div>
            </div>


            <div className="flex gap-2 h-fit">
              <div
                className={`cursor-pointer px-1 rounded ${activeTab === 'thread' ? 'bg-green-300 text-black' : 'hover:bg-gray-800 text-gray-500'}`}
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
            {activeTab === 'thread' && (

              <div>
                <div className="grid grid-cols-1 gap-4 items-start border-green-950 border-8 border-double ">

                    <div className="flex flex-wrap gap-2 text-slate-400 text-xs items-start w-full">
                      <a href={`/profile/${tokenDetails?.creator}`}>
                          <span className="flex gap-1 items-center">
                              <div className="px-1 rounded hover:underline flex gap-1 text-black bg-pink-400">
                                  {extractFirstSixCharac(tokenDetails?.creator_username? tokenDetails?.creator_username: tokenDetails?.creator || 'unknown')}
                              </div>
                          </span>
                      </a>
                      <div>
                        {tokenDetails?.datetime ? new Date(tokenDetails.datetime * 1000).toLocaleString('en-US', {
                            year: 'numeric', month: '2-digit', day: '2-digit',
                            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
                        }) : 'Loading date...'}
                    </div>
                  </div>
                    
                    <div className="flex gap-4 items-start w-full">
                        {/* <img src={tokenDetails?.image_url || "https://via.placeholder.com/150"} className="w-32 h-32 object-contain cursor-pointer" /> */}
                        <div className="relative w-32 h-32 cursor-pointer">
                          <Image
                            src={tokenDetails?.image_url || "https://via.placeholder.com/150"}
                            alt="Token Image"
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                            className="object-contain"
                          />
                        </div>
                        <div className="flex flex-col justify-between">
                            <div className="font-bold text-sm text-gray-400">
                                {tokenDetails?.token_name} (ticker: {tokenDetails?.token_ticker})
                            </div>
                            <div className="text-xs text-gray-400 break-all">
                                {tokenDetails?.token_description}
                            </div>
                        </div>
                    </div>
                </div>
                {replies.length > 0 ? (
                  <div>
                    {currentThread.map((reply,index) => (
                      <div className="grid gap-4 px-1 items-center border-green-950 border-8 border-double "  key={reply.id || index}>

                        <div className="flex flex-wrap gap-2 text-slate-400 text-xs items-start w-full">
                          <a href={`/profile/${reply.creator}`}>
                            <span className="flex gap-1  items-center">
                              <span> {newReply.username ? (<div className="px-1 rounded hover:underline flex gap-1 text-black bg-pink-400" >
                                {newReply.username}
                              </div>) : (<div className="px-1 rounded hover:underline flex gap-1 text-black bg-pink-400" >
                                {extractFirstSixCharac(reply.creator_username? reply.creator_username: (reply?.creator || 'unknown'))}
                              </div>)} </span>
                            </span>
                          </a>
                          <div>{reply.created_at}</div>
                          <div className="cursor-pointer justify-self-end hover:underline">#{reply.id}
                          </div>
                        </div>
                        {reply.file_uri? (<img src={reply.file_uri} className="w-32 h-32 object-contain cursor-pointer" />) : ('')}
                        
                        <div className="text-green-500">
                          {reply.text}
                        </div>
                      </div>
                    ))} 
                    <div className="pagination">
                      <button onClick={() => setCurrentThreadPage(prev => Math.max(prev - 1, 1))} disabled={currentThreadPage === 1} 
                      className="mr-2 px-4 py-2 border border-gray-300 rounded-md text-green-500 font-semibold">
                        Prev
                      </button>
                      <button onClick={() => setCurrentThreadPage(prev => (prev < totalThreadPages ? prev + 1 : prev))} disabled={currentThreadPage === totalThreadPages}
                      className="px-4 py-2 border border-gray-300 rounded-md text-green-500 font-semibold">

                        Next
                      </button>
                    </div>

                  </div>
                ) : (
                  <p>No threads found.</p>
                )}
              </div>
            )}

            {activeTab === 'trades' && (
              <div className="w-full text-xs text-gray-400 bg-transparent rounded-lg">
                {currentChart === 'current' && isPhaseTwo ? (
                  <div id="dexscreener-embed">
                    <iframe
                      src={`https://dexscreener.com/fantom/${dexUrl}?embed=1&theme=dark&trades=1&info=0&chart=0`}
                      style={{ height: '400px', width: '100%' }}
                      allowFullScreen
                      title="Dexscreener Transactions"
                    ></iframe>
                  </div>
                ) : (
                  <div>
                    <div className="bg-[#2e303a] rounded-lg grid grid-cols-4 sm:grid-cols-6">
                      <div className="col-span-1 p-3 font-normal text-left">Account</div>
                      <div className="col-span-1 p-3 font-normal text-left hidden sm:block">Type</div>
                      <div className="col-span-1 p-3 font-normal text-left sm:hidden">txn</div>
                      <div className="col-span-1 p-3 font-normal text-left">{nativeTokenInfo.chain}</div>
                      <div className="col-span-1 p-3 font-normal text-left">{tokenDetails?.token_ticker}</div>
                      <div className="col-span-1 p-3 font-normal text-left hidden md:block">
                        <div className="flex items-center">
                          Date
                        </div>
                      </div>
                      <div className="col-span-1 p-3 font-normal text-right hidden sm:block">Transaction</div>
                    </div>
                    {trades.length > 0 ? (
                      <div>
                        {currentTrades.map(trade => (
                          <TradeItem key={trade.txid} trade={trade} networkType={params.tokenInfo[0]} />
                        ))}
                        <div className="pagination">
                          <button 
                            onClick={() => setCurrentTradesPage(prev => Math.max(prev - 1, 1))} 
                            disabled={currentTradesPage === 1}
                            className="px-4 py-2 border border-gray-300 rounded-md text-green-500 font-semibold"
                          >
                            Prev
                          </button>
                          <button 
                            onClick={() => setCurrentTradesPage(prev => (prev < totalTradesPages ? prev + 1 : prev))} 
                            disabled={currentTradesPage === totalTradesPages}
                            className="px-4 py-2 border border-gray-300 rounded-md text-green-500 font-semibold"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p>No trades found.</p>
                    )}
                  </div>
                )}
              </div>
            )}

           
            {/* Button */}
            {isConnected && activeTab ==='thread'? (<button
              onClick={() => setShowModal(true)}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-500 border border-gray-300 rounded-md 
              shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Post a reply
            </button>) : ''}


            {/* Background overlay */}
            {showModal && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75"
                onClick={() => setShowModal(false)}
              >
                {/* Modal */}
                <div
                  className="bg-white rounded-lg overflow-hidden shadow-xl max-w-md w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-4 py-5 sm:p-6">
                    <div className="items-center">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Add a comment</h3>
                        <div className="flex">
                          <textarea className="bg-[#2a2a3b] border border-slate-950 rounded-md h-24 w-full p-2 text-white" name="text" placeholder="comment" onChange={handleReplyChange}></textarea>
                        </div>
                      </div>
                      <div className="mb-4 py-5">
				<label className="block  text-gray-900 text-sm font-bold mb-2 " htmlFor="image">
					Image (OPTIONAL)
				</label>
				<input
				className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight  bg-[#2a2a3b] border-slate-950 focus:outline-none focus:shadow-outline"
				id="image"
				type="file"
				name="image"
				onChange={(e) => {setFile(e.target.files?.[0])}}
				/>
				<p className="text-gray-500 text-xs italic">{file ? file.name : 'No file chosen'}</p>
			</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">

                    <button onClick={handleReplySubmit} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2
                     bg-blue-500 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Post
                    </button>

                    {/* Cancel button */}
                    <button
                      onClick={() => setShowModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>


                </div>
              </div>
            )}
          </div>
          <div className="w-1/3 grid gap-4 h-fit w-fit">
            <div className="w-[350px] grid gap-4">
              {isPhaseTwo && <div className="bg-blue-500 p-2 rounded text-white">Trade on spooky swap via us</div>}
              {(!isLiquidityPoolSetup ||isPhaseTwo) &&<div className="bg-[#2e303a] p-4 rounded-lg border border-none text-gray-400 grid gap-4">
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    className={`p-2 text-center rounded ${buySell === 'buy' ? 'bg-green-400 text-black' : 'bg-gray-800 text-grey-600'}`}
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
                  {/* {buySell === "sell" ? (
                    <div className={`text-xs py-1 px-2 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300`}>
                      Locked: {formattedLockedTokens || 0} ({lockedPercentage}%)
                    </div>
                  ) : (
                    <button
                      className={`text-xs py-1 px-2 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300`}
                      onClick={handleToggleToken}
                      disabled={buySell === 'sell' || isPhaseTwo}
                      style={{ visibility: buySell === 'sell' || isPhaseTwo ? 'hidden' : 'visible' }}  // Use inline style for visibility
                    >
                      switch to {nativeTokenBool ? tokenDetails?.token_ticker : nativeTokenInfo.chain}
                    </button>
                  )} */}
                  {isPhaseTwo ? null : (
                    <>
                      {buySell === "sell" ? (
                        <div className={`text-xs py-1 px-2 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300`}>
                          Locked: {formattedLockedTokens|| 0} ({lockedPercentage}%)
                        </div>
                      ) : (
                        <button
                          className={`text-xs py-1 px-2 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300`}
                          onClick={handleToggleToken}
                          disabled={buySell === 'sell' || isPhaseTwo}
                        >
                          switch to {nativeTokenBool ? tokenDetails?.token_ticker : nativeTokenInfo.chain}
                        </button>
                      )}
                    </>
                  )}
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
                      onChange={e => setTokenAmountToTrade(e.target.value)} />
                    <div className="flex items-center ml-2 absolute right-2">
                      <span className="text-white mr-2">
                        {buySell === 'sell' ? tokenDetails?.token_ticker : (nativeTokenBool ? nativeTokenInfo.chain : tokenDetails?.token_ticker)}
                      </span>
                      {/* <img
                        className="w-8 h-8 rounded-full bg-white"
                        src={buySell === 'sell' ? tokenDetails?.image_url : (nativeTokenBool ? nativeTokenInfo.chainLogo : tokenDetails?.image_url)}
                        alt={buySell === 'sell' ? tokenDetails?.token_name : (nativeTokenBool ? nativeTokenInfo.chain : tokenDetails?.token_name)}
                      /> */}
                      {/* <Image
                        className="w-8 h-8 rounded-full bg-white"
                        // src={buySell === 'sell' ? (tokenDetails?.image_url || "https://via.placeholder.com/150"): (nativeTokenBool ? nativeTokenInfo.chainLogo : (tokenDetails?.image_url || "https://via.placeholder.com/150"))}
                        // src = {tokenDetails?.image_url || "https://via.placeholder.com/150"}
                        src = {nativeTokenInfo.chainLogo}
                        alt={buySell === 'sell' ? tokenDetails?.token_name : (nativeTokenBool ? nativeTokenInfo.chain : tokenDetails?.token_name)}
                        width={32} // specify width in pixels
                        height={32} // specify height in pixels
                      /> */}
                      <div className="relative w-8 h-8 rounded-full bg-white">
                      <Image
                        src={buySell === 'sell' ? (tokenDetails?.image_url || "https://via.placeholder.com/150"): (nativeTokenBool ? nativeTokenInfo.chainLogo  || "https://via.placeholder.com/150": (tokenDetails?.image_url || "https://via.placeholder.com/150"))}
                        alt={buySell === 'sell' ? tokenDetails?.token_name : (nativeTokenBool ? nativeTokenInfo.chain : tokenDetails?.token_name)}
                        fill
                        sizes="32px"
                        className="object-contain rounded-full"
                      />
                    </div>

                    </div>
                    


                  </div>
                  {buySell === 'sell' && !isPhaseTwo && <p className="text-gray-500 text-xs italic">You can only sell unlocked tokens</p>}

                  <div className="flex mt-2 bg-[#2e303a] p-1 rounded-lg">
                    {nativeTokenBool && (
                      <div>
                        <button className="text-xs py-1 -ml-1 px-2 rounded bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                          onClick={() => handleSetAmount('')}>
                          Reset
                        </button>
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
                  onClick={handlePlaceTrade}
                  disabled={isTrading}>
                  place trade
                </button>
              </div>}
            </div>
            <div className="w-[350px] bg-transparent text-gray-400 rounded-lg border border-none grid gap-4">
              <div className="flex gap-4">
                {tokenDetails?.twitter && (
                  <a href={ensureAbsoluteUrl(tokenDetails.twitter)} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:underline">
                    [twitter]
                  </a>
                )}
                {tokenDetails?.telegram && (
                  <a href={ensureAbsoluteUrl(tokenDetails?.telegram)} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:underline">
                    [telegram]
                  </a>
                )}
                {tokenDetails?.website && (
                  <a href={ensureAbsoluteUrl(tokenDetails?.website)} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:underline">
                    [website]
                  </a>
                )}
              </div>
              <div className="gap-3 h-fit items-start flex">
                {/* <img src={tokenDetails?.image_url || "https://via.placeholder.com/150"} className="w-32 object-contain cursor-pointer"></img> */}
                <div className="relative w-32 h-32 cursor-pointer">
                  <Image
                    src={tokenDetails?.image_url || "https://via.placeholder.com/150"}
                    alt="Token Image"
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                    className="object-contain"
                  />
                </div>
                <div>
                  <div className="font-bold text-sm">
                    {tokenDetails?.token_name} (ticker: {tokenDetails?.token_ticker})
                    
                  </div>
                  <AddTokenButton
                      tokenAddress={params.tokenInfo[1]}
                      tokenSymbol={tokenDetails?.token_ticker || ''}
                      tokenDecimals={18}
                      tokenImage={tokenDetails?.image_url || ''}
                      walletProvider={walletProvider}
                    />
                  <div className="text-xs text-gray-400 break-all">
                    {tokenDetails?.token_description}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">bonding curve progress: {progress.toFixed(3)} %</div>
                <IndeterminateProgressBar progress={progress} />

              </div>
              {/* <div className="text-xs text-gray-400">
                when the market cap reaches ${formatMarketCap(marketCapLimit)} all the liquidity from the bonding curve will be deposited into Spooky Swap and burned. progression increases as the price goes up.<br /><br />there are {(finalSupply - tokenSum/1E18).toFixed(3)} tokens still available for sale in the bonding curve and there is {(nativeSum/1e18 - 0.1).toFixed(3)} {nativeTokenInfo.chain} in the bonding curve.
              </div> */}
              <div className="text-xs text-gray-400">
                when the market cap reaches ${formatMarketCap(marketCapLimit)} all the liquidity from the bonding curve will be deposited into Spooky Swap and burned. progression increases as the price goes up.<br /><br />
                there are {parseFloat(tokensAvailable.toString()).toFixed(3)} tokens still available for sale in the bonding curve and there is {parseFloat(nativeInCurve.toString()).toFixed(3)} {nativeTokenInfo.chain} in the bonding curve.
              </div>
              {/* {finalSupply !== null && <p className="text-xs text-gray-400">The final supply when the market cap hits 10 is: {finalSupply}</p> } */}
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
                      {/* {holders.map((holder, index) => (
                        <div key={holder.account} className="flex justify-between">
                          <a
                            className="hover:underline"
                            href={getAccountUrl(params.tokenInfo[0], holder.account)}
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
                      ))} */}
                       {isPhaseTwo ? (
                          <div>
                            Can be seen under trades holders tab or{' '}
                            <a
                              href={`https://ftmscan.com/token/${params.tokenInfo[1]}#balances`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 underline"
                            >
                              here
                            </a>
                          </div>
                        ) : (
                          // holders.map((holder, index) => (
                          //   <div key={holder.account} className="flex justify-between">
                          //     <a
                          //       className="hover:underline"
                          //       href={getAccountUrl(params.tokenInfo[0], holder.account)}
                          //       target={getAccountUrl(params.tokenInfo[0], holder.account) ? "_blank" : undefined}
                          //       rel={getAccountUrl(params.tokenInfo[0], holder.account) ? "noopener noreferrer" : undefined}
                          //     >
                          //       {index + 1}. {holder.account.substring(2, 8)}
                          //       {holder.account === tokenDetails?.creator ? ' 🤵‍♂️ (dev)' : ''}
                          //       {holder.account === tokenDetails?.token_address ? ' 🏦 (bonding curve)' : ''}
                          //     </a>
                          //     <div>
                          //       {((holder.balance / tokenSum) * 100).toFixed(2)}%
                          //     </div>
                          //   </div>
                          // ))
                          <div>
                             {holders.filter(holder => Number(holder.balance) > 0).map((holder, index) => {
                                // const holderBalanceBig = BigNumber.from(holder.balance);
                                // const percentage = holderBalanceBig.mul(100).div(bnTokenSum).toString();

                                const holderBalance = Number(holder.balance)
                                // const percentage = ((holderBalance/Number(tokenSum)) * 100).toFixed(2)
                                let percentage;
                                if (holder.account === tokenDetails?.token_address) {
                                  const totalMinted = Number(bnTokenSum.sub(initialTokenSum));
                                  const totalMintable = Number(finalSupply? finalSupply.sub(initialTokenSum): 0);
                                  const contractIntermediate = (totalMinted / totalMintable)*100;
                                  percentage = (100 - contractIntermediate).toFixed(2);
                                } else {
                                  const totalMintable = Number(finalSupply? finalSupply.sub(initialTokenSum): 0);
                                  percentage = ((holderBalance / totalMintable) * 100).toFixed(2);
                                }

                                return (
                                  <div key={holder.account} className="flex justify-between">
                                    <a
                                      className="hover:underline"
                                      href={getAccountUrl(params.tokenInfo[0], holder.account)}
                                      target={getAccountUrl(params.tokenInfo[0], holder.account) ? "_blank" : undefined}
                                      rel={getAccountUrl(params.tokenInfo[0], holder.account) ? "noopener noreferrer" : undefined}
                                    >
                                      {index + 1}. {
                                        holder.username ? 
                                        (holder.username.startsWith('0x') ? holder.username.substring(2, 8) : holder.username.substring(0, 6)) 
                                        : holder.account.substring(2, 8)
                                        }
                                      {holder.account === tokenDetails?.creator ? ' 🤵‍♂️ (dev)' : ''}
                                      {holder.account === tokenDetails?.token_address ? ' 🏦 (bonding curve)' : ''}
                                    </a>
                                    <div>
                                      {percentage}%
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}
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