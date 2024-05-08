import { useMemo } from 'react';
import { TradeData } from '../_utils/types';
import { extractFirstSixCharac } from '../_utils/helpers';

const timeSince = (date: number) => {
    const seconds = Math.floor((new Date().getTime() - date * 1000) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) {
        return `${Math.floor(interval)}yr ago`;
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        return `${Math.floor(interval)}mo ago`;
    }
    interval = seconds / 86400;
    if (interval > 1) {
        return `${Math.floor(interval)}d ago`;
    }
    interval = seconds / 3600;
    if (interval > 1) {
        return `${Math.floor(interval)}hr ago`;
    }
    interval = seconds / 60;
    if (interval > 1) {
        return `${Math.floor(interval)}m ago`;
    }
    return `${Math.floor(seconds)}s ago`;
};

const TradeItem = ({ trade, networkType }: { trade: TradeData, networkType: string }) => {
    const accountShort = useMemo(() => {
        return extractFirstSixCharac(trade.account)
    }, [trade.account]);

    const txHashShort = useMemo(() => {
        return extractFirstSixCharac(trade.tx_hash)
    }, [trade.tx_hash]);

    const formattedNativeAmount = useMemo(() => {
        return parseFloat((trade.native_amount/1E18).toString()).toFixed(4);
    }, [trade.native_amount]);

    const formattedTokenAmount = useMemo(() => {
        const amount = parseFloat((trade.token_amount/1E18).toString()) * 1e18; // Adjusting for token decimals
        // console.log(amount)
        if (amount < 1e6) {
            return `${(amount / 1e3).toFixed(1)}k`;
        } else if (amount >= 1e6 && amount < 1e9){
            return `${(amount / 1e6).toFixed(2)}m`;
        } else {
            return `${(amount / 1e9).toFixed(2)}b`
        }
    }, [trade.token_amount]);

    const transactionUrl = useMemo(() => {
        switch (networkType) {
            case 'ftm':
                return `https://public-sonic.fantom.network/tx/${trade.tx_hash}`;
            case 'sei':
                return `https://seitrace.com/tx/${trade.tx_hash}`;
            default:
                return ''; // No link if no valid network type is specified
        }
    }, [networkType, trade.tx_hash]);

    return (
        <div className="text-xs my-1 bg-[#2e303a] rounded-lg grid grid-cols-4 sm:grid-cols-6 items-start ">
            <div className="py-3 pl-2 text-left flex items-center flex-wrap break-all">
                <a href={`/profile/${trade.account}`}>
                    <div className="flex gap-1 items-center">
                        {/* You might want to re-enable the image if needed */}
                        {/* <img src="https://example.com/image.jpg" className="w-4 h-4 rounded" /> */}
                        <div className="px-1 rounded hover:underline flex gap-1 text-black bg-red-300">
                            {accountShort}
                        </div>
                    </div>
                </a>
            </div>
            <div className={`p-3 text-left ${trade.trade === 'sell' ? 'text-red-300' : 'text-green-300'} hidden sm:block`}>
                {trade.trade}
            </div>
            {/* <div className="p-3 text-left text-green-300 hidden sm:block">{trade.trade}</div> */}
            <div className="p-3 text-left sm:flex sm:items-center sm:hidden text-green-300">
                <span>
                    buy  17d
                </span>
            </div>
            <div className="p-3 text-left overflow-hidden whitespace-nowrap">
                {formattedNativeAmount}
            </div>
            <div className="p-3 text-left overflow-hidden whitespace-nowrap">
                {formattedTokenAmount}
            </div>
            <div className="p-3 text-left hidden md:block">
                {/* {new Date(trade.timestamp * 1000).toLocaleDateString()}  */}
                {timeSince(trade.timestamp)}  {/* Use the new helper function for date formatting */}

            </div>
            {/* <a href={`https://seitrace.com/tx/${trade.tx_hash}`} target="_blank" rel="noopener noreferrer" className="hidden sm:block text-right p-3 hover:text-blue-500 hover:underline">
                {txHashShort}
            </a> */}
            <a href={transactionUrl} target="_blank" rel="noopener noreferrer" className="hidden sm:block text-right p-3 hover:text-blue-500 hover:underline">
                {txHashShort}
            </a>
        </div>
    );
};

export default TradeItem;