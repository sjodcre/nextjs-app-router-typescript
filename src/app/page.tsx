"use client"
import { useState, useEffect } from 'react';
import Link from 'next/link';
//redux
import { setChain } from "@/app/_redux/features/chain-slice";
import { useDispatch } from 'react-redux';
import { AppDispatch, useAppSelector } from '@/app/_redux/store';
// import Header from './_ui/header';


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
    reply_count: string
    
    // Add other properties if available in the token object
}

const Home: React.FC = () => {
    const [tokens, setTokens] = useState<Token[]>([]);
    const [sortBy, setSortBy] = useState<string>('lastUpdatedTime');
    const [selectedChain, setSelectedChain] = useState<string>('sei');  // Default sort by market cap
    const [order, setOrder] = useState<string>('desc'); // Default order is descending
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage] = useState<number>(15); // Number of items to display per page
    const [isSeiActive, setIsSeiActive] = useState(true);
    const [isFtmActive, setIsFtmActive] = useState(false);

    //resux

    const dispatch = useDispatch<AppDispatch>();
    const chainType = useAppSelector((state) => state.chainReducer.value.chainType);

    const fetchTokens = async () => {
        try {
            const response = await fetch(`/api?sortBy=${sortBy}&order=${order}&chain=${selectedChain}`);
            if (!response.ok) {
                throw new Error('Failed to fetch tokens');
            }
            const data = await response.json();
            setTokens(data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };


    useEffect(() => {
        dispatch(setChain(selectedChain));
        fetchTokens();
    }, [sortBy, order, selectedChain]);

    // Calculate pagination
    const indexOfLastToken = currentPage * itemsPerPage;
    const indexOfFirstToken = indexOfLastToken - itemsPerPage;
    const currentTokens = tokens.slice(indexOfFirstToken, indexOfLastToken);

    const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSortBy(event.target.value);
    };

    const handleOrderChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setOrder(event.target.value);
    };

    const handleClicks = () => {
        if (isFtmActive === false) {
            setIsFtmActive(true);
            setIsSeiActive(false)
            setSelectedChain("ftm");
            dispatch(setChain(selectedChain));
        } else {
            setIsFtmActive(false);
            setIsSeiActive(true)
            setSelectedChain("sei");
            dispatch(setChain(selectedChain));
        }


    };

    return (
        <>
            {/* <Header /> */}
          
            <div className='grid gap-8 item-start justify-center '>

                <div className='  relative text-9xl justify-center bg-black text-white border-2 font-mono font-semibold rounded-lg border-green-400 shadow-[0_0_2px_#00ff00,inset_0_0_2px_#00ff00,0_0_5px_#00ff00,0_0_15px_#00ff00,0_0_30px_#08f]'>


                    HELLO

                </div>
            </div>
            {/*  <label className='text-9xl flex justify-center'>Chain : {chainType} </label> */}
            {/* <label htmlFor="sortOptions" className="mr-2 text-white">Chain:</label> */}
            {/*   <div className="inline-flex">

                <button className={` hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l ${isSeiActive ? 'bg-blue-500 disable' : 'bg-gray-300'
                    }`} onClick={handleClicks}>
                    Sei
                </button>
                <button className={` hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l ${isFtmActive ? 'bg-blue-500' : 'bg-gray-300'
                    }`} onClick={handleClicks}>
                    FTM
                </button>



                </div> */}

            <div className='py-6  grid gap-8 item-start justify-center'>
                <div className='relative'>
                    <div className='absolute -inset-1 bg-gradient-to-r  from-green-400 to-green-950 rounded-lg blur'></div>
                    <div className='relative px-7 py-4  bg-black rounded-lg leading-none flex items-center divide-x divide-gray-600'>

                        <button className={`pr-6 font-semibold text-gray-100 `} disabled={isSeiActive} onClick={handleClicks}>
                            SEI
                        </button>
                        <button className={`pl-6 font-semibold text-purple-600 `} disabled={isFtmActive} onClick={handleClicks}>
                            FTM
                        </button>




                    </div>
                </div>
            </div>

            <div className="flex justify-center">
          <a className="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50 h-10 px-4 py-2 -mt-5 text-2xl text-slate-50 hover:font-bold hover:bg-transparent hover:text-slate-50" href="/deploy">
            [Deploy a token]
          </a>
        </div>


            {/* Sorting dropdowns */}
            <div className="mb-4 flex  font-semibold ">
                <label htmlFor="sortOptions" className="mr-2">Sort By:</label>
                <select id="sortOptions" value={sortBy} onChange={handleSortChange} className="px-2 py-1 ">
                    <option value="lastUpdatedTime">Bump Order</option>
                    <option value="lastReplyTime">Last Reply</option>
                    <option value="replies">Replies</option>
                    <option value="marketcap">Market Cap</option>
                    <option value="creationTime">Creation Time</option>
                </select>
                <select id="orderOptions" value={order} onChange={handleOrderChange} className="ml-2 px-2 py-1 ">
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                </select>
            </div>

            {/* Token list */}
            <div className="grid grid-col-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-10 items-center border-green-950 border-8 border-double " >
                {currentTokens.map((token: Token, index: number) => (
                    <Link href={`/token/${selectedChain}/${token.token_address}`} key={index}>
                        {/* Token card */}
                        <div className='max-h-[300px] overflow-hidden h-fit p-2 flex border border-white border-dashed hover:border-green-700 gap-2 w-full'>
                            {/* You can replace this placeholder image with the actual token image */}
                            <ul className="text-xs leading-4 text-green-500 font-semibold">
                                <li>Created By: {token.creator}</li>
                                <li>Market Cap: {token.marketcap} </li>
                                <li>Replies: {token.reply_count} </li>
                                 <li>{token.token_name} '(Ticker : {token.token_ticker}) : {token.token_description}"</li>
                            </ul>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center mt-4  text-green-500 font-semibold">

                <button
                    onClick={() => setCurrentPage(currentPage > 1 ? currentPage - 1 : currentPage)}
                    disabled={currentPage === 1}
                    className="mr-2 px-4 py-2 border border-gray-300 rounded-md"
                >
                    &lt; Prev
                </button>
                <div className="mr-2">
                    Page {currentPage} of {Math.ceil(tokens.length / itemsPerPage)}
                </div>
                <button
                    onClick={() => setCurrentPage(currentPage < Math.ceil(tokens.length / itemsPerPage) ? currentPage + 1 : currentPage)}
                    disabled={currentPage === Math.ceil(tokens.length / itemsPerPage)}
                    className="px-4 py-2 border border-gray-300 rounded-md"
                >
                    Next &gt;
                </button>

            </div>

        </>
    );
};

export default Home;
