"use client"
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

//redux
import { setChain } from "@/app/_redux/features/chain-slice";
import { useDispatch } from 'react-redux';
import { AppDispatch, useAppSelector } from '@/app/_redux/store';
// import logger from './_utils/logger';


interface Token {

    token_address :string,
    token_ticker :string,
    token_name :string,
    token_description :string,
    image_url :string,
    creator :string,
    twitter :string,
    telegram :string,
    website :string,
    token_datetime:number,
    txid :string,
    account :string,
    reply_count: string,
    marketcap: number,
    
    // Add other properties if available in the token object
}

const Home: React.FC = () => {
    const [tokens, setTokens] = useState<Token[]>([]);
    const [sortBy, setSortBy] = useState<string>('lastUpdatedTime');
    const [selectedChain, setSelectedChain] = useState<string>('ftm');  // Default sort by market cap
    const [order, setOrder] = useState<string>('desc'); // Default order is descending
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage] = useState<number>(15); 
    // const [isSeiActive, setIsSeiActive] = useState(true);
    // const [isFtmActive, setIsFtmActive] = useState(false);

    //resux

    const dispatch = useDispatch<AppDispatch>();
    // const chainType = useAppSelector((state) => state.chainReducer.value.chainType);

    const fetchTokens = async () => {
        try {
            const response = await fetch(`/api?sortBy=${sortBy}&order=${order}&chain=${selectedChain}`);
            if (!response.ok) {
                throw new Error('Failed to fetch tokens');
            }
            const data = await response.json();
            // console.log("data", data)
            setTokens(data);
        } catch (error) {
            console.error('Error fetching data:', error);
            // logger.error('Error fetching data:', error);

        }
    };

    // const fetchTokens = useCallback(async () => {
    //     try {
    //       const response = await fetch(`/api?sortBy=${sortBy}&order=${order}&chain=${selectedChain}`);
    //       if (!response.ok) {
    //         throw new Error('Failed to fetch tokens');
    //       }
    //       const data = await response.json();
    //       console.log("data", data);
    //       setTokens(data);
    //     } catch (error) {
    //       console.error('Error fetching data:', error);
    //     }
    //   }, [sortBy, order, selectedChain]);


    useEffect(() => {
        dispatch(setChain(selectedChain));
        fetchTokens();
    }, [sortBy, order, selectedChain]);

    // useEffect(() => {
    //     dispatch(setChain(selectedChain));
    //     console.log("infinite loop check 3")
    //     fetchTokens();
    //   }, [dispatch, fetchTokens, sortBy, order, selectedChain]);

    // Calculate pagination
    const indexOfLastToken = currentPage * itemsPerPage;
    const indexOfFirstToken = indexOfLastToken - itemsPerPage;
    const currentTokens = tokens.slice(indexOfFirstToken, indexOfLastToken);
    

    const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSortBy(event.target.value);
        setCurrentPage(1);
    };

    const handleOrderChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setOrder(event.target.value);
        setCurrentPage(1);
    };

    // const handleClicks = () => {
    //     if (isFtmActive === false) {
    //         setIsFtmActive(true);
    //         setIsSeiActive(false)
    //         setSelectedChain("ftm");
    //         dispatch(setChain(selectedChain));
    //     } else {
    //         setIsFtmActive(false);
    //         setIsSeiActive(true)
    //         setSelectedChain("sei");
    //         dispatch(setChain(selectedChain));
    //     }


    // };

    return (
        <>
  <div className="min-h-screen bg-black text-green-400 font-mono p-4">
    <div className="flex justify-center items-center py-8">
      <div className="text-9xl font-semibold border-2 border-green-400 rounded-lg shadow-lg p-4 bg-black text-white">
        HELLO
      </div>
    </div>

    <div className="flex flex-col items-center mt-4">
      <a
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 
        h-10 px-6 py-2 mb-6 text-2xl text-black bg-green-400 hover:bg-green-500"
        href="/deploy"
      >
        [start a new coin]
      </a>

      <div className="text-white max-w-[800px] grid gap-4">
        <a href="/EqcNxUzQ18C8HsG6QGL4XWVvGV3cGbs7xcfGfE3o1xye">
          <div className="p-4 flex border border-green-400 rounded-lg hover:bg-gray-800 gap-4 w-full max-h-[300px] overflow-hidden">
            <div className="min-w-20"></div>
            <div className="grid gap-2">
              <div className="text-xs text-blue-200 flex items-center gap-2">
                <span>Created by</span>
                <button type="button" className="px-1 rounded hover:underline bg-transparent">
                  FRgyc4
                </button>
              </div>
              <div className="text-xs text-green-300 flex gap-1 items-center">
                <span>market cap: 35.78K</span>
                <span className="text-green-500 ml-2">[badge: ]</span>
              </div>
              <p className="text-xs">replies: 3</p>
              <p className="text-sm font-bold">Get Money [ticker: GM]</p>
            </div>
          </div>
        </a>
      </div>
    </div>

    {/* <div className="py-6 grid gap-4 items-start justify-center">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-950 rounded-lg blur"></div>
        <div className="relative px-7 py-4 bg-black rounded-lg leading-none flex items-center divide-x divide-gray-600">
          <button
            className="pr-6 font-semibold text-gray-100 hover:text-green-400"
            disabled={isSeiActive}
            onClick={handleClicks}
          >
            SEI
          </button>
          <button
            className="pl-6 font-semibold text-purple-600 hover:text-green-400"
            disabled={isFtmActive}
            onClick={handleClicks}
          >
            FTM
          </button>
        </div>
      </div>
    </div> */}

    <div className="mt-6 mb-4 flex justify-center font-semibold text-green-400">
      <label htmlFor="sortOptions" className="mr-2">
        Sort By:
      </label>
      <select
        id="sortOptions"
        value={sortBy}
        onChange={handleSortChange}
        className="px-3 py-2 bg-black border border-green-400 rounded text-green-400"
      >
        <option value="lastUpdatedTime">Bump Order</option>
        <option value="lastReplyTime">Last Reply</option>
        <option value="replies">Replies</option>
        <option value="marketcap">Market Cap</option>
        <option value="creationTime">Creation Time</option>
      </select>
      <select
        id="orderOptions"
        value={order}
        onChange={handleOrderChange}
        className="ml-2 px-3 py-2 bg-black border border-green-400 rounded text-green-400"
      >
        <option value="asc">Ascending</option>
        <option value="desc">Descending</option>
      </select>
    </div>

            {/* Token list */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 items-center border-green-950 border-8 border-double">
                {currentTokens.map((token: Token, index: number) => (
                    <Link href={`/token/${selectedChain}/${token.token_address}`} key={index}>
                        {/* Token card */}
                        <div className="max-h-[300px] overflow-hidden h-fit p-4 flex border border-white border-dashed hover:border-green-700 gap-4 w-full rounded-lg bg-black">
                        {/* <img src={token?.image_url || "https://via.placeholder.com/150"} className="w-32 h-32 object-contain cursor-pointer" /> */}
                          <Image 
                            src={token?.image_url || "https://via.placeholder.com/150"} 
                            width={128} 
                            height={128} 
                            className="w-32 h-32 object-contain cursor-pointer" 
                            alt={token?.token_name || "Placeholder image"} 
                          />
                            <ul className="text-xs leading-4 text-green-500 font-semibold">
                                <li>Created By: {token.creator}</li>
                                <li>Market Cap:{token.marketcap !== null ? token.marketcap.toLocaleString("en-US", { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""}</li>
                                <li>Replies: {token.reply_count} </li>
                                <li>{token.token_name} (Ticker : {token.token_ticker}) : {token.token_description}</li>
                            </ul>
                        </div>
                    </Link>
                ))}
            </div>

    <div className="flex justify-center items-center mt-8 text-green-500 font-semibold">
      <button
        onClick={() => setCurrentPage(currentPage > 1 ? currentPage - 1 : currentPage)}
        disabled={currentPage === 1}
        className="mr-2 px-4 py-2 border border-green-400 rounded-md hover:bg-green-600 disabled:opacity-50"
      >
        &lt; Prev
      </button>
      <div className="mr-2">
        Page {currentPage} of {Math.ceil(tokens.length / itemsPerPage)}
      </div>
      <button
        onClick={() => setCurrentPage(currentPage < Math.ceil(tokens.length / itemsPerPage) ? currentPage + 1 : currentPage)}
        disabled={currentPage === Math.ceil(tokens.length / itemsPerPage)}
        className="px-4 py-2 border border-green-400 rounded-md hover:bg-green-600 disabled:opacity-50"
      >
        Next &gt;
      </button>
    </div>
  </div>
</>
    );
};

export default Home;
