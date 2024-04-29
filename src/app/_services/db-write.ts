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


export const initOHLCData = async (tokenAddress: string, creator: string, datetime:number) => {
    try {
        const transactionData = {
            chainid: '1', // Example static chain ID
            tokenAddress: tokenAddress, // Replace with actual token address
            account: creator,
            amount:0,
            deposit: 0,
            time: datetime,
            price :3E-15,
            volume: 0
        };

        const response = await fetch('http://localhost:3001/transaction-and-ohlc', {
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
    const { account, amount, deposit, timestamp } = transactionData;

    const normalizedAmount = normalizeValue(parseFloat(amount.toString())); // Ensuring number type if needed
    const normalizedDeposit = normalizeValue(parseFloat(deposit.toString()));
    
    // Calculate price and volume using normalized values
    const price = normalizedDeposit / normalizedAmount; // Price per token in ether
    const volume = normalizedAmount; // Volume in ether
    // Calculate price and volume (assumes amount and deposit are already in the smallest unit)
    // const price = parseFloat(deposit) / parseFloat(amount); // This assumes both values are normalized to the same scale
    // const volume = parseFloat(amount);



    try {
        const response = await fetch('http://localhost:3001/transaction-and-ohlc', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chainid: '1', // Example static chain ID
                tokenAddress: '0xda8C4b55679AA98cBe36d4f67093247D5B93c40C', // Replace with actual token address
                account,
                amount: normalizedAmount,
                deposit: normalizedDeposit,
                time: timestamp,
                price,
                volume
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

// export const fetchData = async (tokenAddress: string, chainId: string) => {
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