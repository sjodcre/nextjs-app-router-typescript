import { ethers } from "ethers";
import { query } from "../../db";
import { calculatePrice } from "@/app/_utils/helpers";
// import logger from "@/app/_utils/logger";
import * as Sentry from '@sentry/nextjs';


export  async function POST(req: Request) {
     const data = await req.json();
    const { tokenAddress, account, tx_status,token_amount, native_amount, time, price, volume,trade, tx_hash } = data;
    //   console.log("init-mint-transac-and-ohlc database...")
    // logger.info("updating initial mint token transaction and ohlc ftm", {tokenAddress})

    // Validate inputs
    //   if (!tx_hash || !tokenAddress || !account  || !tx_status  || typeof token_amount !== 'number' || typeof native_amount !== 'number' || typeof time !== 'number' || typeof price !== 'number' || typeof volume !== 'number' || (trade !== 'buy' && trade !== 'sell')) {
    if (!tx_hash || !tokenAddress || !account  || !tx_status  || !token_amount || !native_amount || typeof time !== 'number' || typeof price !== 'number' || typeof volume !== 'number' || (trade !== 'buy' && trade !== 'sell')) {
        // logger.warn('Invalid input data initial mint token tx and ohlc ftm');
        return new Response(JSON.stringify({ error: 'Invalid input data'}), { status: 400});
   }
    // Define table names based on chain id
    //  const transactionTableName = 'transaction_history_ftm';
    const transactionTableName = 'ftm_transaction_history';
    const ohlcTableName = 'ohlc_ftm';



    try {
        const sql = `
                SELECT 
                    (SELECT sum_token FROM ${transactionTableName} WHERE token_address = $1 ORDER BY timestamp DESC LIMIT 1) AS sum_token,
                    (SELECT sum_native FROM ${transactionTableName} WHERE token_address = $2 ORDER BY timestamp DESC LIMIT 1) AS sum_native
            `;

        const result = await query(sql, [tokenAddress, tokenAddress]);

        // let sum_token = result ? result[0].sum_token : 5E18; 
        // if (tx_status ==="successful") {
        //     sum_token = trade === 'buy' ? sum_token + token_amount : sum_token - token_amount;
        // }

        // let sum_native = result ? result[0].sum_native : 1E17;  // Using scientific notation for the default value
        // if (tx_status ==="successful") {
        //     sum_native = trade === 'buy' ? sum_native + native_amount : sum_native - native_amount;
        // }

        let sum_token = result ? ethers.BigNumber.from(result[0].sum_token) : ethers.BigNumber.from("5000000000000000000"); // 5E18
        let token_amountBN = ethers.BigNumber.from(token_amount);

        if (tx_status === "successful") {
            sum_token = trade === 'buy' ? sum_token.add(token_amountBN) : sum_token.sub(token_amountBN);
        }

        let sum_native = result ? ethers.BigNumber.from(result[0].sum_native) : ethers.BigNumber.from("100000000000000000"); // 1E17
        let native_amountBN = ethers.BigNumber.from(native_amount);

        if (tx_status === "successful") {
            sum_native = trade === 'buy' ? sum_native.add(native_amountBN) : sum_native.sub(native_amountBN);
        }

        //calculate price
        const bondingPrice = calculatePrice(sum_native,sum_token,ethers.BigNumber.from('50000'));
        const priceBN = ethers.utils.parseUnits(bondingPrice.toString(), 18); // Assuming price is in 18 decimal places


        const sum_token_str = sum_token.toString();
        const sum_native_str = sum_native.toString();

        const sumTokenBN = ethers.BigNumber.from(sum_token);
        const marketCapBN = sumTokenBN.mul(priceBN).div(ethers.BigNumber.from("1000000000000000000"));
        const marketCap = ethers.utils.formatUnits(marketCapBN, 18);
        const marketCapString = marketCap.toString();


 

        // if (existingRow.length === 0) {
        //     const sql2 = `INSERT INTO ${transactionTableName} (token_address, account, token_amount, native_amount, price_per_token, timestamp, trade, sum_token, sum_native, tx_hash, tx_status)
        // VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING txid` ;
        //     let result2 = await query(sql2, [tokenAddress, account, token_amount, native_amount, price, time, trade, sum_token, sum_native, tx_hash, tx_status]);
            const sql2 = `INSERT INTO ${transactionTableName} (token_address, account, token_amount, native_amount, price_per_token, timestamp, trade, sum_token, sum_native, tx_hash, tx_status, marketcap)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING txid` ;
            let result2 = await query(sql2, [tokenAddress, account, token_amount, native_amount, bondingPrice, time, trade, sum_token_str, sum_native_str, tx_hash, tx_status, marketCapString]);
        // } else {
        //     result2 = await query(`UPDATE ${transactionTableName} SET sum_native = $1 ,sum_token = $2, tx_status = $3 , timestamp = $4 , token_amount = $5 WHERE tx_hash = $6 RETURNING txid` , [sum_native, sum_token, tx_status, time , token_amount, tx_hash]);
        // }
        // let result2 = await query(`UPDATE ${transactionTableName} SET sum_native = $1 ,sum_token = $2, tx_status = $3 , timestamp = $4 , token_amount = $5 WHERE tx_hash = $6 RETURNING txid` , [sum_native, sum_token, tx_status, time , token_amount, tx_hash]);
        // logger.info("inserted transaction ftm")
        // transaction_history table
        const txid = result2[0].txid;
                          
        // ohlc table
        // const timeSlice = Math.floor(time / 300) * 300;
        // const existing = await query(`SELECT * FROM ${ohlcTableName} WHERE token_address = $1 AND time = $2`, [tokenAddress, timeSlice]);
        // console.log("existing", existing)
        // if (existing.length > 0) {
        //     // console.log("empty but entering?")
        //     const updatedOHLC = {
        //         open: existing[0].open,
        //         high: Math.max(existing[0].high, bondingPrice),
        //         low: Math.min(existing[0].low, bondingPrice),
        //         close: bondingPrice,
        //         volume: existing[0].volume + volume
        //     };
        //     await query(`UPDATE ${ohlcTableName} SET high = $1, low = $2, close = $3, volume = $4 WHERE chartid = $5`, 
        //         [updatedOHLC.high, updatedOHLC.low, updatedOHLC.close, updatedOHLC.volume, existing[0].chartid]);
        // } else {
        //     await query(`INSERT INTO ${ohlcTableName} (token_address, time, open, high, low, close, volume)
        //                   VALUES ($1, $2, $3, $4, $5, $6, $7)`, [tokenAddress, timeSlice, bondingPrice, bondingPrice, bondingPrice, bondingPrice, volume]);
        // }

        const timeSlice = Math.floor(time / 300) * 300;
        const existing = await query(`SELECT * FROM ${ohlcTableName} WHERE token_address = $1 AND time = $2`, [tokenAddress, timeSlice]);

        if (existing.length > 0) {
            const updatedOHLC = {
                open: existing[0].open,
                high: Math.max(existing[0].high, bondingPrice),
                low: Math.min(existing[0].low, bondingPrice),
                close: bondingPrice,
                volume: existing[0].volume + volume
            };
            await query(`UPDATE ${ohlcTableName} SET high = $1, low = $2, close = $3, volume = $4 WHERE chartid = $5`, 
                [updatedOHLC.high, updatedOHLC.low, updatedOHLC.close, updatedOHLC.volume, existing[0].chartid]);

        } else {
            // Fetch the most recent close price within a reasonable range
            const recentClose = await query(`
                SELECT close FROM ${ohlcTableName} 
                WHERE token_address = $1 AND time < $2 
                ORDER BY time DESC 
                LIMIT 1`, 
                [tokenAddress, timeSlice]
            );
            
            let openPrice = bondingPrice; // Default to current bonding price if no recent close price
            if (recentClose.length > 0) {
                openPrice = recentClose[0].close;
            }

            await query(`INSERT INTO ${ohlcTableName} (token_address, time, open, high, low, close, volume)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)`, [tokenAddress, timeSlice, openPrice, bondingPrice, bondingPrice, bondingPrice, volume]);
        }
        // logger.info("inserted ohlc data ftm")


        //token_balance table
        // const queryBalance = (await query(`SELECT balance FROM token_balances_ftm WHERE account = $1 AND token_address =$2`, [account, tokenAddress]));
        const queryBalance = (await query(`SELECT balance FROM ftm_users_balance WHERE account = $1 AND token_address =$2`, [account, tokenAddress]));

        // let currentBalance = { balance: 0 }; // Default value
        // if (queryBalance.length>0){
        //     currentBalance = queryBalance[0]
        // }
        // let newBalance = currentBalance.balance;
        // console.log("newBalance", newBalance)
        // if (tx_status ==="successful") {
        //     if (trade === 'buy') {
        //         newBalance += token_amount;
        //     } else if (trade === 'sell') {
        //         newBalance -= token_amount;
        //     }
        // }
        let currentBalance = ethers.BigNumber.from("0"); // Default value
        if (queryBalance.length > 0) {
            currentBalance = ethers.BigNumber.from(queryBalance[0].balance);
        }
        
        let newBalance = currentBalance;
        
        if (tx_status === "successful") {
            const tokenAmountBN = ethers.BigNumber.from(token_amount);
        
            if (trade === 'buy') {
                newBalance = newBalance.add(tokenAmountBN);
            } else if (trade === 'sell') {
                newBalance = newBalance.sub(tokenAmountBN);
            }
        }

        const newBalanceStr = newBalance.toString();

        
    
        // if (currentBalance.balance === 0) {
        //     await query("INSERT INTO token_balances_ftm (account, token_address, balance) VALUES ($1, $2, $3)", [account, tokenAddress, newBalance]);
        // } else {
        //     await query("UPDATE token_balances_ftm SET balance = $1 WHERE account = $2 AND token_address = $3", [newBalance, account, tokenAddress]);
        // }
        // if (currentBalance.isZero()) {
        //     await query("INSERT INTO ftm_users_balance (account, token_address, balance) VALUES ($1, $2, $3)", [account, tokenAddress, newBalanceStr]);
        // } else {
        //     await query("UPDATE ftm_users_balance SET balance = $1 WHERE account = $2 AND token_address = $3", [newBalanceStr, account, tokenAddress]);
        // }

        await query(`
        INSERT INTO ftm_users_balance (account, token_address, balance)
        VALUES ($1, $2, $3)
        ON CONFLICT (account, token_address)
        DO UPDATE SET balance = EXCLUDED.balance
    `, [account, tokenAddress, newBalanceStr]);

    // logger.info("inserted user balance ftm")
         
    return new Response(JSON.stringify({ message: 'Transaction and OHLC data updated successfully.' , txid, bondingPrice}), { status: 201});
    
  } catch (error) {
//    console.log(error)
    const comment = "Error initializing new token transaction and ohlc ftm"
    Sentry.captureException(error, { extra: { comment } });
// logger.error("Error initializing new token transaction and ohlc ftm", {error})
    return new Response(JSON.stringify('Error:' + error), { status: 500 });
    //res.status(500).json({ message: 'Internal server error' });
  }
}
