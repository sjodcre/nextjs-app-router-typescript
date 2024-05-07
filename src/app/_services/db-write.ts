// import { error } from "console";

import { TokenHolder } from "../_utils/types";

const normalizeValue = (value: number): number => {
    return value / 1e18;
};

export const postTokenData = async (data: any) => {
    let url = '';
    if (data.chainid === 'ftm'){
        url = 'http://localhost:3001/ftm/deploytoken'
    } else if (data.chainid === 'sei') {
        url = 'http://localhost:3001/sei/deploytoken'
    } else {
        throw new Error('unsupported chain id!')
    }
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to post token data:", error);
        // Depending on the use case, you might want to return null or throw the error further up.
        return null; 
    }
};


export const initOHLCData = async (selectedChain: string, tokenAddress: string, creator: string, datetime:number, txHash: string) => {
    try {
        const transactionData = {
            tokenAddress: tokenAddress, // Replace with actual token address
            account: creator,
            token_amount:1E16,
            native_amount: 0,
            time: datetime,
            price :1E-15,
            volume: 0,
            trade: 'init',
            tx_hash: txHash
        };

        let url = ''
        if (selectedChain === 'ftm'){
            url = 'http://localhost:3001/initialize-ohlc-ftm'
        } else if ( selectedChain ==='sei') {
            url = 'http://localhost:3001/initialize-ohlc-sei'
        } else {
            throw new Error('incorrect chain id!')
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transactionData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to post transaction and OHLC data:", error);
        return null; 
    }

}



export const postTransactionAndOHLC = async (transactionData: any) => {
    const { selectedChain, contractAddress, account, amount, deposit, timestamp, trade, txHash } = transactionData;

    // const normalizedAmount = normalizeValue(parseFloat(amount.toString())); // Ensuring number type if needed
    // const normalizedDeposit = normalizeValue(parseFloat(deposit.toString()));
    
    // Calculate price and volume using normalized values
    // const price = normalizedDeposit / normalizedAmount; // Price per token in ether
    // const volume = normalizedAmount; // Volume in ether
    // Calculate price and volume (assumes amount and deposit are already in the smallest unit)
    const price = parseFloat(deposit) / parseFloat(amount); // This assumes both values are normalized to the same scale
    const volume = parseFloat(amount);
    let url = '';
    if (selectedChain ==='ftm'){
        url = 'http://localhost:3001/ftm/transaction-and-ohlc'
    } else if (selectedChain === 'sei') {
        url = 'http://localhost:3001/sei/transaction-and-ohlc'
    } else {
        throw new Error("incorrect chain id!")
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tokenAddress: contractAddress, 
                account,
                token_amount: amount,
                native_amount: deposit,
                time: timestamp,
                price,
                volume,
                trade: trade,
                tx_hash: txHash
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to post transaction and OHLC data:", error);
        return null;
    }
};

export const getTokenTrades = async (chainId: string, tokenAddress: string, ) => {
    let url = '';
    if (chainId === 'ftm') {
        url = `http://localhost:3001/get-trades-ftm?tokenAddress=${tokenAddress}`
    } else if (chainId === 'sei') {
        url = `http://localhost:3001/get-trades-sei?tokenAddress=${tokenAddress}`
    } else {
        throw new Error('incorrect chain id!')
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch data:", error);
        return null;  // Or handle error appropriately depending on your application requirements
    }
};

export const fetchTokenInfo = async (chainId: string, tokenAddress: string) => {
    let url = ''
    if (chainId === 'ftm') {
        url = `http://localhost:3001/token-info-ftm?token_address=${tokenAddress}`
    } else if (chainId ==='sei') {
        url = `http://localhost:3001/token-info-sei?token_address=${tokenAddress}`
    } else {
        throw new Error('incorrect chain id!')
    }
    try {
        const response = await fetch(url);
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

  export const getTopTokenHolders = async (chainId: string, tokenAddress: string) : Promise<TokenHolder[]>=> {
    let url = ''
    if (chainId ==='ftm') {
        url = `http://localhost:3001/ftm/top-holders/${tokenAddress}`
    } else if (chainId ==='sei') {
        url = `http://localhost:3001/sei/top-holders/${tokenAddress}`
    } else {
        throw new Error('incorrect chain id!')
    }

    return fetch(url)
        .then(response => response.json())
        .catch(error => {
            console.error("Failed to fetch top token holders:", error);
            return [];
        });


    // try {
    //     const response = await fetch(url);
    //     if (!response.ok) {
    //         throw new Error(`HTTP error! status: ${response.status}`);
    //     }
    //     const data = await response.json();
    //     console.log(data)
    //     return data;
    // } catch (error) {
    //     console.error("Failed to fetch top token holders:", error);
    //     return null;
    // }
};