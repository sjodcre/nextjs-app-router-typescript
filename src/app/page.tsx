"use client"
import { useState, useEffect } from 'react';
import Link from 'next/link';
//redux
import { setChain } from "@/app/_redux/features/chain-slice";
import { useDispatch } from 'react-redux';
import { AppDispatch, useAppSelector } from '@/app/_redux/store';
// import Header from './_ui/header';


interface Token {

    tokenticker: string;
    tokenname: string;
    creator: string;
    datetime: string;
    image: string;
    tokenaddress: string;
    description: string;
    username: string;
    lastactivity: string;

    marketcap: number;
    repliescount: number;
    lastreply: string;
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
            console.log("data", data)
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
            <div className="flex flex-col items-center w-full mt-4">
                <a className="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 
                disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50 h-10 px-4 py-2 mb-4 text-2xl text-slate-50 hover:font-bold hover:bg-transparent 
                hover:text-slate-50" href="/deploy">
                    [start a new coin]
                </a>
                <div className="text-white max-w-[800px] grid gap-2">
                    {/* <img alt="king of the hill" loading="lazy" width="166" height="32" decoding="async" data-nimg="1" class="h-8 justify-self-center" srcset="/_next/image?url=%2Fking-of-the-hill.png&amp;w=256&amp;q=75 1x, /_next/image?url=%2Fking-of-the-hill.png&amp;w=384&amp;q=75 2x" src="/_next/image?url=%2Fking-of-the-hill.png&amp;w=384&amp;q=75" style="color: transparent;"> */}
                    <a href="/EqcNxUzQ18C8HsG6QGL4XWVvGV3cGbs7xcfGfE3o1xye">
                        <div className="p-2 flex border border-transparent hover:border-white gap-2 w-full max-h-[300px] overflow-hidden">
                            <div className="min-w-20">
                                {/* <img alt="Get Money" loading="lazy" width="200" height="200" decoding="async" data-nimg="1" class="mr-4 w-20 h-auto" src="https://bafkreianj7sxceoziksoq73vuopuivsgumxp4qft6ijbfmmb3ay43g2mmy.ipfs.nftstorage.link/?img-width=200&amp;img-dpr=2&amp;img-onerror=redirect" style="color: transparent;"> */}
                            </div>
                            <div className="gap-1 grid h-fit">
                                <div className="text-xs text-blue-200 flex items-center gap-2">
                                    <div>
                                        Created by
                                    </div>
                                    <button type="button">
                                        <span className="flex gap-1  items-center">
                                            {/* <img alt="" loading="lazy" width="16" height="16" decoding="async" data-nimg="1" class="w-4 h-4 rounded" src="https://pump.mypinata.cloud/ipfs/QmeSzchzEPqCU1jwTnsipwcBAeH7S4bmVvFGfF65iA1BY1?img-width=16&amp;img-dpr=2&amp;img-onerror=redirect" style="color: transparent;"> */}
                                            <span className="px-1 rounded hover:underline flex gap-1 bg-transparent	" >
                                            FRgyc4 
                                            </span>
                                        </span>
                                    </button>
                                </div>
                                <div className="text-xs text-green-300 flex gap-1">
                                    market cap: 35.78K
                                    <div className="flex text-green-500">
                                        [badge: 
                                        <div>
                                            <div>
                                                <div className="cursor-pointer hover:opacity-7" aria-haspopup="dialog" aria-expanded="false" aria-controls="radix-:r11:" data-state="closed">
                                                    {/* <img alt="king of the hill badge" loading="lazy" width="18" height="18" decoding="async" data-nimg="1" class="h-4" srcset="/_next/image?url=%2Fking.png&amp;w=32&amp;q=75 1x, /_next/image?url=%2Fking.png&amp;w=48&amp;q=75 2x" src="/_next/image?url=%2Fking.png&amp;w=48&amp;q=75" style="color: transparent;"> */}
                                                </div>
                                            </div>
                                        </div>
                                        ]
                                    </div>
                                </div>
                                <p className="text-xs flex items-center gap-2">
                                    replies: 3
                                </p>
                                <p className="text-sm w-full font-bold">
                                    Get Money [ticker: GM]
                                </p>
                            </div>
                        </div>
                    </a>
                </div>
            </div>

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
                    <Link href={`/token/${token.tokenaddress}`} key={index}>
                        {/* Token card */}
                        <div className='max-h-[300px] overflow-hidden h-fit p-2 flex border border-transparent hover:border-green-700 gap-2 w-full'>
                            {/* You can replace this placeholder image with the actual token image */}
                            <ul className="text-xs leading-4 text-green-500 font-semibold">
                                <li>Created By: {token.username}</li>
                                <li>Market Cap: {token.marketcap} </li>
                                <li>Replies: {token.repliescount} </li>
                                <li>Creation : {token.datetime} </li>
                                <li>{token.tokenname} '(Ticker : {token.tokenticker}) : {token.description}"</li>
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
