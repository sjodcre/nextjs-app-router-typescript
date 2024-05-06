const normalizeValue = (value: number): number => {
    return value / 1e18;
};

export const postTokenData = async (data: any) => {
    try {
        const response = await fetch('http://localhost:3001/deploytoken', {
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


export const initOHLCData = async (tokenAddress: string, creator: string, datetime:number, txHash: string) => {
    try {
        const transactionData = {
            chainid: '1', // Example static chain ID
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

        const response = await fetch('http://localhost:3001/initialize-ohlc', {
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
    const { contractAddress, account, amount, deposit, timestamp, trade, txHash } = transactionData;

    // const normalizedAmount = normalizeValue(parseFloat(amount.toString())); // Ensuring number type if needed
    // const normalizedDeposit = normalizeValue(parseFloat(deposit.toString()));
    
    // Calculate price and volume using normalized values
    // const price = normalizedDeposit / normalizedAmount; // Price per token in ether
    // const volume = normalizedAmount; // Volume in ether
    // Calculate price and volume (assumes amount and deposit are already in the smallest unit)
    const price = parseFloat(deposit) / parseFloat(amount); // This assumes both values are normalized to the same scale
    const volume = parseFloat(amount);

    try {
        const response = await fetch('http://localhost:3001/transaction-and-ohlc', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chainid: '1', // Example static chain ID
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

// export const queryDataUpdates = async (tokenAddress: string, chainId: string) => {
//     // const tokenAddress = "0x3d8be50ca75d4";
//     // const chainId = 1;
//     console.log("fetching...");
//     try {
//         const response = await fetch(`http://localhost:3001/token-info?token_address=${tokenAddress}&chainid=${chainId}`);
//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }
//         const data = await response.json();
//         return data;
//     } catch (error) {
//         console.error("Failed to fetch data:", error);
//         return null;  // Or handle error appropriately depending on your application requirements
//     }
// };

export const getTokenTrades = async (tokenAddress: string, chainId: string) => {
    // console.log("fetching...");
    try {
        const response = await fetch(`http://localhost:3001/get-trades?tokenAddress=${tokenAddress}`);
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
    // const tokenAddress = "0x9AA19CF4849c03a77877CaFBf61003aeDFDA3779";
    // const chainId = 1;
    // console.log("fetching data from database...");
    try {
        const response = await fetch(`http://localhost:3001/token-info?token_address=${tokenAddress}&chainid=${chainId}`);
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