// CustomDatafeed.ts
import {  HistoryCallback, PeriodParams, LibrarySymbolInfo, ResolutionString, ErrorCallback, OnReadyCallback, SubscribeBarsCallback, DatafeedConfiguration} from '../../../public/static/charting_library/charting_library';
import { subscribeOnStream, unsubscribeFromStream } from './use-socket';
// import { makeApiRequest, generateSymbol, parseFullSymbol } from './helpers';

interface Symbol {
    symbol: string; // Symbol code
    full_name: string; // Full symbol name which typically includes the exchange
    description: string; // Human-readable description
    exchange: string; // The exchange this symbol is traded on
    ticker: string; // The ticker symbol
    type: string; // Type of the symbol (stock, forex, etc.)
}

const configurationData : DatafeedConfiguration = {
    supports_marks: true,
    supports_timescale_marks: true,
    supports_time: true,
    exchanges: [
        { value: "", name: "All Exchanges", desc: "" }
    ],
  
    supported_resolutions: ["1" as ResolutionString, "5" as ResolutionString, "30" as ResolutionString, "60" as ResolutionString, "D" as ResolutionString]
}

// async function getAllSymbols(): Promise<Symbol[]> {
//     const data = await makeApiRequest('data/v3/all/exchanges');
//     let allSymbols: Symbol[] = [];

//     const exchanges = configurationData.exchanges ?? []; // Fallback to an empty array if undefined


//     for (const exchange of exchanges) {
//         const pairs = data.Data[exchange.value].pairs;

//         for (const leftPairPart of Object.keys(pairs)) {
//             const symbols = pairs[leftPairPart].map((rightPairPart: string) => {
//                 const symbol = generateSymbol(exchange.value, leftPairPart, rightPairPart);
//                 return {
//                     symbol: symbol.short,
//                     ticker: symbol.full,
//                     description: symbol.short,
//                     exchange: exchange.value,
//                     type: 'crypto',
//                     full_name: `${exchange.value}:${leftPairPart}/${rightPairPart}` // Ensuring full_name is always defined
//                 };
//             });
//             allSymbols = [...allSymbols, ...symbols];
//         }
//     }
//     return allSymbols;
// }

class CustomDatafeed {
    // private data: Bar[];
    tokenAddress: string;
    chainId: string;
    lastBarsCache;

    constructor(tokenAddress: string, chainId: string) {
        this.tokenAddress = tokenAddress;
        this.chainId = chainId
        this.lastBarsCache = new Map()
        
    }

    public onReady(callback: OnReadyCallback): void {
        setTimeout(() => callback(configurationData));
    }

    

    public getBars(
        symbolInfo: LibrarySymbolInfo, 
        resolution: ResolutionString, 
        periodParams: PeriodParams,
        onHistoryCallback: HistoryCallback, 
        onErrorCallback: ErrorCallback): void {
            setTimeout(
            () => {
                // For this piece of code only we will only return bars for the TEST symbol
                // if (symbolInfo.ticker === 'BTCUSD') {
                    
                // const to = periodParams.to;
                const { from,to, firstDataRequest, countBack} = periodParams;
                // const tokenAddress = "0x3d8be50ca75d4";
                // const chainId = this.chainId;
                // console.log("chainid:", this.chainId)
                let url = ''
                if (this.chainId === 'sei'){
                    url = `http://localhost:3001/ohlc-sei?token_address=${this.tokenAddress}&resolution=${resolution}&from=${from}&to=${to}`
                } else if (this.chainId ==='ftm') {
                    url = `http://localhost:3001/ohlc-ftm?token_address=${this.tokenAddress}&resolution=${resolution}&from=${from}&to=${to}`
                } else {
                    throw new Error('invalid chain id!')
                }

                fetch(url)
                .then(response => response.json())
                .then(data => {
                    console.log(data.length)
                    if (data.length > 0) {
                        const correctedData = data.map((d: { time: number; open: any; high: any; low: any; close: any; }) => ({
                        time: d.time * 1000, // Convert timestamp from seconds to milliseconds
                        open: d.open,
                        high: d.high,
                        low: d.low,
                        close: d.close
                        }));
                        if (data.length < countBack) {
                        console.log(`Requested ${countBack} bars, but only ${data.length} are available.`);
                        // onHistoryCallback(correctedData, { noData: length === 0 });
                        onHistoryCallback(correctedData, { noData: length === 0 });

                        } else {
                            // Return the last 'countBack' number of bars
                            const resultBars = correctedData.slice(-countBack);
                            onHistoryCallback(resultBars, { noData: false });
                        }
                    } else {
                        // onHistoryCallback([], { noData: true });
                        if (firstDataRequest){
                       
                        if (this.chainId === 'sei'){
                            url = `http://localhost:3001/sei/data/latest-time?token_address=${this.tokenAddress}`
                        } else if (this.chainId ==='ftm') {
                            url = `http://localhost:3001/ftm/data/latest-time?token_address=${this.tokenAddress}`
                        } else {
                            throw new Error('invalid chain id!')
                        }
                        fetch(url)
                        .then(response => {
                            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                            return response.json();
                        })
                        .then(lastData => {
                            const nextT = lastData.latestTime; // Convert to milliseconds
                            console.log(`Next available time: ${nextT}`);
                            onHistoryCallback([], { noData: true, nextTime: nextT });
                        }).catch(onErrorCallback);
                        } else {
                        onHistoryCallback([], { noData: true });

                        }
                    }
                })
                .catch(onErrorCallback);
                    
                // } else {
                //     // If no result, return an empty array and specify it to the library by changing the value of `noData` to true.
                //     onHistoryCallback([], {
                //         noData: true
                //     });
                // }
            },
            50
            );
    }

    public searchSymbols(userInput: string, exchange: string, symbolType: string, onResultReadyCallback: (symbols: Symbol[]) => void) {
        // getAllSymbols().then(symbols => {
        //     const filteredSymbols = symbols.filter(symbol => {
        //         return (symbol.exchange === exchange || exchange === '') &&
        //                symbol.symbol.toLowerCase().includes(userInput.toLowerCase()) &&
        //                (symbol.type === symbolType || symbolType === '');
        //     });
        //     onResultReadyCallback(filteredSymbols);
        // });
        // getAllSymbols().then(symbols => {
        //     const filteredSymbols = symbols.filter(symbol =>
        //         (symbol.exchange === exchange || exchange === '') &&
        //         symbol.symbol.toLowerCase().includes(userInput.toLowerCase()) &&
        //         (symbol.type === symbolType || symbolType === '')
        //     );
    
        //     const searchResults = filteredSymbols.map(symbol => ({
        //         symbol: symbol.symbol,
        //         full_name: `${symbol.exchange}:${symbol.symbol}`, // Ensure full_name is defined
        //         description: symbol.description,
        //         exchange: symbol.exchange,
        //         ticker: symbol.ticker,
        //         type: symbol.type
        //     }));
    
        //     onResultReadyCallback(searchResults);
        // });
        // console.log('[searchSymbols]: Method call');
    }
        
    public resolveSymbol(symbolName: string, onSymbolResolvedCallback: (symbolInfo: any) => void, onResolveErrorCallback: (error: string) => void) {
        let url = ''
        if (this.chainId === 'sei'){
            url = `http://localhost:3001/token-info-sei?token_address=${this.tokenAddress}`
        } else if (this.chainId ==='ftm') {
            url = `http://localhost:3001/token-info-ftm?token_address=${this.tokenAddress}`
        } else {
            throw new Error('invalid chain id!')
        }

        try {
            fetch(url)
            .then(response => response.json())
            .then(data => {
                // console.log(data)
                const symbolInfo: LibrarySymbolInfo = {
                    listed_exchange: '', 
                    format:'price', 
                    name: data[0].token_name,
                    ticker: data[0].token_ticker,
                    description: data[0].token_ticker,
                    type: 'crypto',
                    session: '24x7',
                    timezone: 'Etc/UTC',
                    exchange: 'Example Exchange',
                    minmov: 1,
                    // pricescale: 1000000000000000,
                    pricescale: 1000,
                    has_intraday: true,
                    visible_plots_set: 'ohlcv',
                    has_weekly_and_monthly: false,
                    supported_resolutions: ['1' as ResolutionString, '5' as ResolutionString, '30' as ResolutionString, '60' as ResolutionString, 'D' as ResolutionString],
                    volume_precision: 2,
                    data_status: 'streaming',
                };
                // onSymbolResolvedCallback(symbolInfo);
                setTimeout(() => { onSymbolResolvedCallback(symbolInfo); }, 0);

            })
            .catch(error => {
                console.error("Failed to fetch symbol info:", error);
                onResolveErrorCallback("Could not resolve the symbol.");
            });
        } catch (error) {
            console.error('Error fetching token list data:', error);
        }      
    }

    public  subscribeBars (
        symbolInfo:LibrarySymbolInfo,
        resolution: ResolutionString,
        onRealtimeCallback:SubscribeBarsCallback ,
        subscriberUID: string,
        onResetCacheNeededCallback: () => void
    ) {
        console.log('[subscribeBars]: Subscribed', subscriberUID);
        subscribeOnStream(
            symbolInfo,
            resolution,
            onRealtimeCallback,
            subscriberUID,
            onResetCacheNeededCallback,
            this.lastBarsCache.get(`${symbolInfo.exchange}:${symbolInfo.name}`)
        );
        
    }

    public unsubscribeBars(subscriberUID: string) {
        console.log('[unsubscribeBars]: Unsubscribed', subscriberUID);
        unsubscribeFromStream(subscriberUID);
    }

    public getQuotes (symbols: any, onDataCallback: any, onErrorCallback: ErrorCallback){
        console.log("get quotes")
    }

    public subscribeQuotes(symbols: any, fastSymbols: any, onRealtimeCallback: any, listenerGUID: any) {
        console.log("subscribe quotes")
        
    }

    public unsubscribeQuotes(listenerGUID: string | number) {
    }
}

export default CustomDatafeed;