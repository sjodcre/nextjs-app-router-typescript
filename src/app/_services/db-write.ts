// import { error } from "console";

import { TokenHolder } from "../_utils/types";

const normalizeValue = (value: number): number => {
    return value / 1e18;
};

export const postTokenData = async (data: any) => {
    let url = '';
    if (data.chainid === 'ftm'){
        url = '/api/ftm/deploytoken'
    } else if (data.chainid === 'sei') {
        url = '/api/sei/deploytoken'
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
            url = '/api/initialize-ohlc-ftm'
        } else if ( selectedChain ==='sei') {
            url = '/api/initialize-ohlc-sei'
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

export const postTransactionData = async (transactionData: any) => {
    const { status, selectedChain, contractAddress, account, amount, deposit, timestamp, trade, txHash ,nativeTokenPrice} = transactionData;

    const price = parseFloat(deposit) / parseFloat(amount); // This assumes both values are normalized to the same scale
    const volume = parseFloat(amount);
    let url = '';
    if (selectedChain ==='ftm'){
        url = '/api/transaction-update-ftm'
    } else if (selectedChain === 'sei') {
        url = '/api/transaction-update-sei'
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
                tx_status: status,
                token_amount: amount,
                native_amount: deposit,
                time: timestamp,
                price,
                volume,
                trade: trade,
                tx_hash: txHash,
                nativeTokenPrice
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to post transaction:", error);
        return null;
    }

}

export const postTransactionAndOHLC = async (transactionData: any, initialMint: boolean) => {
    const { selectedChain, contractAddress, account, status, amount, deposit, timestamp, trade, txHash, nativeTokenPrice} = transactionData;

    // const normalizedAmount = normalizeValue(parseFloat(amount.toString())); // Ensuring number type if needed
    // const normalizedDeposit = normalizeValue(parseFloat(deposit.toString()));
    
    // Calculate price and volume using normalized values
    // const price = normalizedDeposit / normalizedAmount; // Price per token in ether
    // const volume = normalizedAmount; // Volume in ether
    // Calculate price and volume (assumes amount and deposit are already in the smallest unit)
    const price = parseFloat(deposit) / parseFloat(amount); // This assumes both values are normalized to the same scale
    const volume = parseFloat(amount);
    let url = '';
    if (selectedChain ==='ftm' && initialMint === false){
        url = '/api/ftm/transaction-and-ohlc'
    } else if (selectedChain === 'sei' && initialMint === false) {
        url = '/api/sei/transaction-and-ohlc'
    } else if (selectedChain === 'ftm' && initialMint === true) {
        url = '/api/ftm/init-mint-transaction-and-ohlc'
    }else if (selectedChain === 'sei' && initialMint === true) {
        url = '/api/sei/init-mint-transaction-and-ohlc'
    }else {
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
                tx_status: status,
                token_amount: amount,
                native_amount: deposit,
                time: timestamp,
                price,
                volume,
                trade: trade,
                tx_hash: txHash,
                nativeTokenPrice
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log("response from POST transact", response)
        return await response.json();
    } catch (error) {
        console.error("Failed to post transaction and OHLC data:", error);
        return null;
    }
};

//newly added 
export const postTransactionFailed = async (transactionData: any) => {
    const { selectedChain, status,timestamp,  txHash } = transactionData;

    // const normalizedAmount = normalizeValue(parseFloat(amount.toString())); // Ensuring number type if needed
    // const normalizedDeposit = normalizeValue(parseFloat(deposit.toString()));
    
    // Calculate price and volume using normalized values
    // const price = normalizedDeposit / normalizedAmount; // Price per token in ether
    // const volume = normalizedAmount; // Volume in ether
    // Calculate price and volume (assumes amount and deposit are already in the smallest unit)
    
    let url = '';
    if (selectedChain ==='ftm'){
        url = '/api/ftm/transaction-fail'
    } else if (selectedChain === 'sei') {
        url = '/api/sei/transaction-fail'
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
                tx_status: status,
                time: timestamp,
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
        url = `/api/get-trades-ftm?token_address=${tokenAddress}`
    } else if (chainId === 'sei') {
        url = `/api/get-trades-sei?token_address=${tokenAddress}`
    } else {
        throw new Error('incorrect chain id!')
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const rawData = await response.text();
        const data = JSON.parse(rawData);
        // console.log('Parsed JSON data:', data);
        // console.log(data[0])
        return data;
    } catch (error) {
        console.error("Failed to fetch tokentrade data:", error);
        return null;  // Or handle error appropriately depending on your application requirements
    }
};

export const fetchTokenInfo = async (chainId: string, tokenAddress: string) => {
    let url = ''
    if (chainId === 'ftm') {
        url = `/api/token-info-ftm?token_address=${tokenAddress}`
    } else if (chainId ==='sei') {
        url = `/api/token-info-sei?token_address=${tokenAddress}`
    } else {
        throw new Error('incorrect chain id!')
    }
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const rawData = await response.text();
        const data = JSON.parse(rawData);
        // console.log('Parsed JSON data:', data);
        // console.log(data[0])
        return data;
    } catch (error) {
        console.error("Failed to fetch tokeninfo data:", error);
        return null;  // Or handle error appropriately depending on your application requirements
    }
  };

  export const getTopTokenHolders = async (chainId: string, tokenAddress: string) : Promise<TokenHolder[]>=> {
    let url = ''
    if (chainId ==='ftm') {
        url = `/api/ftm/top-holders/${tokenAddress}`
    } else if (chainId ==='sei') {
        url = `/api/sei/top-holders/${tokenAddress}`
    } else {
        throw new Error('incorrect chain id!')
    }

    return fetch(url)
        .then(response => response.json())
        .catch(error => {
            console.error("Failed to fetch top token holders:", error);
            return [];
        });
};

export const getPendingTransactions = async (chainId: string, tokenAddress: string): Promise<any[]> => {
    let url = '';
    if (chainId === 'sei') {
        url = `/api/sei/pending-transactions?token_address=${tokenAddress}`;
    } else if (chainId ==='ftm') {
        url = `/api/ftm/pending-transactions?token_address=${tokenAddress}`
    }else {
        throw new Error('Unsupported chain ID or functionality not yet implemented for this chain!');
    }

    return fetch(url)
        .then(response => response.json())
        .catch(error => {
            console.error("Failed to fetch pending transactions:", error);
            return [];
        });
};