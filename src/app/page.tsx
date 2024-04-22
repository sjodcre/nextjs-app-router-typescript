"use client"
import { useState, useEffect } from 'react';
import Link from 'next/link';


interface Token {
    tokenid: number;
    tokensymbol: string;
    tokenname: string;
    creator: string;
    datetime: string;
    image: string;
    tokenaddress: string;
    marketcap: number;
    repliescount: number;
    description:string;
    
    // Assuming this is a string representation of a date
    lastactivity: string; // Assuming this is a string representation of a date
    lastreply: string;
    // Add other properties if available in the token object
}

const Home: React.FC = () => {
    const [tokens, setTokens] = useState<Token[]>([]);
    const [sortBy, setSortBy] = useState<string>('lastUpdatedTime'); // Default sort by market cap
    const [order, setOrder] = useState<string>('desc'); // Default order is descending
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage] = useState<number>(15); // Number of items to display per page
    
    const fetchTokens = async () => {
        try {
          const response = await fetch(`/api?sortBy=${sortBy}&order=${order}`);
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

      fetchTokens();
    }, [sortBy, order]);

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

    return (
        <>
            <label className='text-9xl flex justify-center'>HELLO </label>
            {/* Sorting dropdowns */}
            <div className="mb-4 flex ">
                <label htmlFor="sortOptions" className="mr-2">Sort By:</label>
                <select id="sortOptions" value={sortBy} onChange={handleSortChange} className="px-2 py-1 border border-gray-300 rounded-md">
                    <option value="lastUpdatedTime">Bump Order</option>
                    <option value="lastReplyTime">Last Reply</option>
                    <option value="replies">Replies</option>
                    <option value="marketcap">Market Cap</option>
                    <option value="creationTime">Creation Time</option>
                </select>
                <select id="orderOptions" value={order} onChange={handleOrderChange} className="ml-2 px-2 py-1 border border-gray-300 rounded-md">
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                </select>
            </div>

            {/* Token list */}
            <div className="grid grid-col-1 md:grid-cols-2 lg:grid-cols-3 text-gray-400 gap-4 px-10 items-center">
                {currentTokens.map((token: Token, index: number) => (
                      <Link href={`/${token.tokenaddress}`} key={index}>
                        {/* Token card */}
                        <div className='max-h-[300px] overflow-hidden h-fit p-2 flex border border-transparent hover:border-white gap-2 w-full'>
                            {/* You can replace this placeholder image with the actual token image */}
                            <img className='mr-4 w-32 h-auto flex' src="https://via.placeholder.com/150" alt="Token Image" />
                            <ul className="text-xs font-normal leading-4 text-gray-500">
                                <li>Created By: {token.creator}</li>
                                <li>Market Cap: {token.marketcap} </li>
                                <li>Replies: {token.repliescount} </li>
                                <li>Creation : {token.datetime} </li>
                                <li>{token.tokenname} '(Ticker : {token.tokensymbol}) : {token.description}"</li>
                            </ul>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center mt-4">
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
