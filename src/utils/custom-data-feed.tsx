// CustomDatafeed.ts
import {  LibrarySymbolInfo, ResolutionString, ErrorCallback, OnReadyCallback, SubscribeBarsCallback, DatafeedConfiguration} from '../../../public/static/charting_library/charting_library';
import { makeApiRequest, generateSymbol, parseFullSymbol } from './helpers';

interface Symbol {
    symbol: string; // Symbol code
    full_name: string; // Full symbol name which typically includes the exchange
    description: string; // Human-readable description
    exchange: string; // The exchange this symbol is traded on
    ticker: string; // The ticker symbol
    type: string; // Type of the symbol (stock, forex, etc.)
}

interface Bar {
    open: number;
    high: number;
    low: number;
    close: number;
    time: number; // UNIX timestamp in seconds

}

interface HistoryCallback {
    (bars: Bar[], meta: { noData: boolean }): void;
}


// const configurationData = {
//     supports_search: false,
//     supports_group_request: false,
//     supported_resolutions: ['1D', '1W', '1M'],
//     exchanges: [
//         { value: 'Bitfinex', name: 'Bitfinex', desc: 'Bitfinex'},
//         { value: 'Kraken', name: 'Kraken', desc: 'Kraken bitcoin exchange'},
//     ],
//     symbols_types: [
//         { name: 'crypto', value: 'crypto'}
//     ]
// };

const configurationData : DatafeedConfiguration = {
    supports_marks: true,
    supports_timescale_marks: true,
    supports_time: true,
    exchanges: [
        { value: "", name: "All Exchanges", desc: "" },
        { value: "NasdaqNM", name: "NasdaqNM", desc: "NasdaqNM" },
        { value: "NYSE", name: "NYSE", desc: "NYSE" }
    ],
    symbols_types: [
        { name: "All types", value: "" },
        { name: "Stock", value: "stock" },
        { name: "Index", value: "index" }
    ],
    supported_resolutions: ["5" as ResolutionString, "D" as ResolutionString,  "W" as ResolutionString, "M" as ResolutionString]
}

// interface PeriodParams {
//     from: number;
//     to: number;
//     firstDataRequest: boolean;
// }

async function getAllSymbols(): Promise<Symbol[]> {
    const data = await makeApiRequest('data/v3/all/exchanges');
    let allSymbols: Symbol[] = [];

    const exchanges = configurationData.exchanges ?? []; // Fallback to an empty array if undefined


    for (const exchange of exchanges) {
        const pairs = data.Data[exchange.value].pairs;

        for (const leftPairPart of Object.keys(pairs)) {
            const symbols = pairs[leftPairPart].map((rightPairPart: string) => {
                const symbol = generateSymbol(exchange.value, leftPairPart, rightPairPart);
                return {
                    symbol: symbol.short,
                    ticker: symbol.full,
                    description: symbol.short,
                    exchange: exchange.value,
                    type: 'crypto',
                    full_name: `${exchange.value}:${leftPairPart}/${rightPairPart}` // Ensuring full_name is always defined
                };
            });
            allSymbols = [...allSymbols, ...symbols];
        }
    }
    return allSymbols;
}

class CustomDatafeed {
    private data: Bar[];

    constructor() {
        this.data = this.generateCandlestickData();
    }

    public onReady(callback: OnReadyCallback): void {
    //     setTimeout(() => callback({
    //         supported_resolutions: ["1D", "1W", "1M"]
    //     }), 0);
        setTimeout(() => callback(configurationData));
    }

    private generateCandlestickData() {
        return [
            { time: new Date("2023-10-19").getTime(), open: 180.34, high: 180.99, low: 178.57, close: 179.85 },
            { time: new Date("2023-10-20").getTime() , open: 180.82, high: 181.4, low: 177.56, close: 178.75 },
            { time: new Date("2023-10-21").getTime() ,  open: 175.77,  high: 179.49, low: 175.44,  close: 178.53,     },
                      {
                        time: new Date("2023-10-24").getTime(),
                        open: 178.58,
                        high: 182.37,
                        low: 176.31,
                        close: 176.97,
                      },
                      {
                        time: new Date("2023-10-25").getTime(),
                        open: 177.52,
                        high: 180.5,
                        low: 176.83,
                        close: 179.07,
                      },
                      {
                        time: new Date("2023-10-26").getTime(),
                        open: 176.88,
                        high: 177.34,
                        low: 170.91,
                        close: 172.23,
                      },
                      {
                        time: new Date("2023-10-27").getTime(),
                        open: 173.74,
                        high: 175.99,
                        low: 170.95,
                        close: 173.2,
                      },
                      {
                        time: new Date("2023-10-28").getTime(),
                        open: 173.16,
                        high: 176.43,
                        low: 172.64,
                        close: 176.24,
                      },
                      {
                        time: new Date("2023-10-29").getTime(),
                        open: 177.98,
                        high: 178.85,
                        low: 175.59,
                        close: 175.88,
                      },
                      {
                        time: new Date("2023-10-30").getTime(),
                        open: 176.84,
                        high: 180.86,
                        low: 175.9,
                        close: 180.46,
                      },
                      {
                        time: new Date("2023-10-31").getTime(),
                        open: 182.47,
                        high: 183.01,
                        low: 177.39,
                        close: 179.93,
                      },
                      {
                        time: new Date("2023-11-01").getTime(),
                        open: 181.02,
                        high: 182.41,
                        low: 179.3,
                        close: 182.19,
                      },
                      {
                        time: new Date("2023-11-02").getTime(),
                        open: 181.93,
                        high: 182.65,
                        low: 180.05,
                        close: 182.01,
                      },
                      {
                        time: new Date("2023-11-03").getTime(),
                        open: 183.79,
                        high: 187.68,
                        low: 182.06,
                        close: 187.23,
                      },
                      {
                        time: new Date("2023-11-04").getTime(),
                        open: 187.13,
                        high: 188.69,
                        low: 185.72,
                        close: 188.0,
                      },
                      {
                        time: new Date("2023-11-05").getTime(),
                        open: 188.32,
                        high: 188.48,
                        low: 184.96,
                        close: 185.99,
                      },
                      {
                        time: new Date("2023-11-06").getTime(),
                        open: 185.23,
                        high: 186.95,
                        low: 179.02,
                        close: 179.43,
                      },
                      {
                        time: new Date("2023-11-07").getTime(),
                        open: 177.3,
                        high: 181.62,
                        low: 172.85,
                        close: 179.0,
                      },
                      {
                        time: new Date("2023-11-08").getTime(),
                        open: 182.61,
                        high: 182.9,
                        low: 179.15,
                        close: 179.9,
                      },
                      {
                        time: new Date("2023-11-09").getTime(),
                        open: 179.01,
                        high: 179.67,
                        low: 173.61,
                        close: 177.36,
                      },
                      {
                        time: new Date("2023-11-10").getTime(),
                        open: 173.99,
                        high: 177.6,
                        low: 173.51,
                        close: 177.02,
                      },
                     
            // Add more data points as needed
        ];
    }

    public getBars(
        symbolInfo: LibrarySymbolInfo, 
        resolution: ResolutionString, 
        periodParams: { to: number; countBack: number; },
        onHistoryCallback: HistoryCallback, 
        onErrorCallback: ErrorCallback): void {
        setTimeout(
            () => {
                // For this piece of code only we will only return bars for the TEST symbol
                if (symbolInfo.ticker === 'BTCUSD' && resolution === '1D') {
                  
                    console.log(this.data)
                    // // Once all the bars (usually countBack is around 300 bars) the array of candles is returned to the library.
                    // onHistoryCallback(this.data, { noData: false });
                    let lastAvailableTime = periodParams.to * 1000; // Convert 'to' time to milliseconds
                    console.log("last available time: "+ lastAvailableTime);
                    const filteredData = this.data.filter(bar => bar.time <= lastAvailableTime);
                    
                    // Check if the available data is less than countBack
                    if (filteredData.length < periodParams.countBack) {
                        console.log(`Requested ${periodParams.countBack} bars, but only ${filteredData.length} are available.`);
                        onHistoryCallback(filteredData, { noData: filteredData.length === 0 });
                    } else {
                        // Return the last 'countBack' number of bars
                        const resultBars = filteredData.slice(-periodParams.countBack);
                        onHistoryCallback(resultBars, { noData: false });
                    }
                } else {
                    // If no result, return an empty array and specify it to the library by changing the value of `noData` to true.
                    onHistoryCallback([], {
                        noData: true
                    });
                }
            },
            50
        );
    }
    // public getBars(
    //     symbolInfo: LibrarySymbolInfo, 
    //     resolution: ResolutionString, 
    //     periodParams: PeriodParams, 
    //     onResult: HistoryCallback, 
    //     onError: ErrorCallback
    // ): void {
    //     // Example implementation, adapt based on actual data fetching logic
    //     console.log('[getBars]: Method call', symbolInfo, resolution, periodParams);
    //     try {
    //         // Fetch data logic here
    //         const { from, to } = periodParams;
    //         // Assuming `data` is fetched from your backend or another source
    //         const bars = this.data.filter(bar => bar.time >= from && bar.time < to);
    //         if (bars.length) {
    //             onResult(bars, { noData: false });
    //         } else {
    //             onResult([], { noData: true });
    //         }
    //     } catch (error) {
    //         onError('Failed to fetch data');
    //     }
    // }



    public searchSymbols(userInput: string, exchange: string, symbolType: string, onResultReadyCallback: (symbols: Symbol[]) => void) {
        // getAllSymbols().then(symbols => {
        //     const filteredSymbols = symbols.filter(symbol => {
        //         return (symbol.exchange === exchange || exchange === '') &&
        //                symbol.symbol.toLowerCase().includes(userInput.toLowerCase()) &&
        //                (symbol.type === symbolType || symbolType === '');
        //     });
        //     onResultReadyCallback(filteredSymbols);
        // });
        getAllSymbols().then(symbols => {
            const filteredSymbols = symbols.filter(symbol =>
                (symbol.exchange === exchange || exchange === '') &&
                symbol.symbol.toLowerCase().includes(userInput.toLowerCase()) &&
                (symbol.type === symbolType || symbolType === '')
            );
    
            const searchResults = filteredSymbols.map(symbol => ({
                symbol: symbol.symbol,
                full_name: `${symbol.exchange}:${symbol.symbol}`, // Ensure full_name is defined
                description: symbol.description,
                exchange: symbol.exchange,
                ticker: symbol.ticker,
                type: symbol.type
            }));
    
            onResultReadyCallback(searchResults);
        });
        console.log('[searchSymbols]: Method call');
    }
        
    public resolveSymbol(symbolName: string, onSymbolResolvedCallback: (symbolInfo: any) => void, onResolveErrorCallback: (error: string) => void) {
        // getAllSymbols().then(symbols => {
        //     const symbol = symbols.find(s => s.full_name === symbolName || s.symbol === symbolName);
        //     if (symbol) {
        //         onSymbolResolvedCallback({
        //             name: symbol.symbol,
        //             description: symbol.description,
        //             type: symbol.type,
        //             session: '24x7',
        //             timezone: 'Etc/UTC',
        //             exchange: symbol.exchange,
        //             minmov: 1,
        //             pricescale: 100,
        //             has_intraday: true,
        //             has_no_volume: symbol.type !== 'stock',
        //             full_name: symbol.full_name,
        //             listed_exchange: symbol.exchange,
        //             supported_resolutions: configurationData.supported_resolutions
        //         });
        //     } else {
        //         onResolveErrorCallback("Symbol not found");
        //     }
        // });
        if (symbolName ==="BTCUSD") {
            const symbolInfo = {
                ticker: 'BTCUSD',
                name: 'BTCUSD',
                description: 'Bitcoin/USD',
                type: 'crypto',
                session: '24x7',
                timezone: 'Etc/UTC',
                exchange: 'Example Exchange',
                minmov: 1,
                pricescale: 100,
                has_intraday: false,
                visible_plots_set: 'ohlcv',
                has_weekly_and_monthly: false,
                supported_resolutions: ['1', '5', '30', '60', '1D', '1W'],
                volume_precision: 2,
                data_status: 'streaming',
            };
            setTimeout(() => { onSymbolResolvedCallback(symbolInfo); }, 0);
            
        }
    }

    public subscribeBars(symbolInfo: LibrarySymbolInfo, resolution: ResolutionString, onTick: SubscribeBarsCallback, listenerGuid: string, onResetCacheNeededCallback: () => void) {
        console.log('[subscribeBars]: Subscribed', listenerGuid);
    }

    public unsubscribeBars(subscriberUID: string) {
        console.log('[unsubscribeBars]: Unsubscribed', subscriberUID);
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