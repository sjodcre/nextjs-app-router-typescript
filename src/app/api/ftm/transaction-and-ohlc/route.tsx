import { ethers } from "ethers";
import { query } from "../../db";
import { calculatePrice } from "@/app/_utils/helpers";
// import logger from "@/app/_utils/logger";
import * as Sentry from '@sentry/nextjs';


export  async function POST(req: Request) {
  const data = await req.json();
  const { tokenAddress, account, tx_status,token_amount, native_amount, time, price, volume,trade, tx_hash } = data;
//   logger.info('updating tx and ohlc database ftm...', {tokenAddress, tx_hash})
//   console.log("updating transaction-and-ohlc database...")

  // Validate inputs
  if (!tx_hash || !tokenAddress || !account  || !tx_status  || !token_amount || !native_amount || typeof time !== 'number' || typeof price !== 'number' || typeof volume !== 'number' || (trade !== 'buy' && trade !== 'sell')) {
    // logger.warn('invalid input data for tx and ohlc db update ftm')
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
        // console.log("native sum", sum_native)
        // console.log("native amount", native_amountBN)
        if (tx_status === "successful") {
            sum_native = trade === 'buy' ? sum_native.add(native_amountBN) : sum_native.sub(native_amountBN);
        }

        //calculate price
        const bondingPrice = calculatePrice(sum_native,sum_token,ethers.BigNumber.from('50000'));
        const priceBN = ethers.utils.parseUnits(bondingPrice.toString(), 18); // Assuming price is in 18 decimal places

        const sum_token_str = sum_token.toString();
        const sum_native_str = sum_native.toString();

        const sumTokenBN = ethers.BigNumber.from(sum_token);
        // const priceBN = ethers.utils.parseUnits(price.toString(), 18); // Assuming price is in 18 decimal places
        const marketCapBN = sumTokenBN.mul(priceBN).div(ethers.BigNumber.from("1000000000000000000"));
        const marketCap = ethers.utils.formatUnits(marketCapBN, 18);
        const marketCapString = marketCap.toString();

        // console.log(marketCap+':'+marketCap.toString())

        // let result2 = await query(`UPDATE ${transactionTableName} SET sum_native = $1 ,sum_token = $2, tx_status = $3 , timestamp = $4 , token_amount = $5 , price_per_token = $6 WHERE tx_hash = $7 RETURNING txid` , [sum_native_str, sum_token_str, tx_status, time , token_amount, price, tx_hash]);
        // let result2 = await query(`UPDATE ${transactionTableName} SET sum_native = $1 ,sum_token = $2, tx_status = $3 , timestamp = $4 , token_amount = $5 , native_amount = $6, price_per_token = $7, marketcap = $8 WHERE tx_hash = $9 RETURNING txid` , [sum_native_str, sum_token_str, tx_status, time , token_amount, native_amount, price, marketCapString, tx_hash]);
        let result2 = await query(`UPDATE ${transactionTableName} SET sum_native = $1 ,sum_token = $2, tx_status = $3 , timestamp = $4 , token_amount = $5 , native_amount = $6, price_per_token = $7, marketcap = $8 WHERE tx_hash = $9 RETURNING txid` , [sum_native_str, sum_token_str, tx_status, time , token_amount, native_amount, bondingPrice, marketCapString, tx_hash]);
        // logger.info('updated transaction data ftm')
        // console.log("transaction&ohlc result", result2)
        // transaction_history table
        const txid = result2[0].txid;
                          
        // ohlc table
        // const timeSlice = Math.floor(time / 300) * 300;
        // const existing = await query(`SELECT * FROM ${ohlcTableName} WHERE token_address = $1 AND time = $2`, [tokenAddress, timeSlice]);
        // // console.log("existing", existing)
        // if (existing.length > 0) {
        //     console.log("empty but entering?")
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
        // logger.info('updated ohlc data ftm')


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
        //     await query("INSERT INTO ftm_users_balance (account, token_address, balance) VALUES ($1, $2, $3)", [account, tokenAddress, newBalance]);
        // } else {
        //     await query("UPDATE ftm_users_balance SET balance = $1 WHERE account = $2 AND token_address = $3", [newBalance, account, tokenAddress]);
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
         
        // logger.info('updated user balance ftm')
    return new Response(JSON.stringify({ message: 'Transaction and OHLC data updated successfully.' , txid, bondingPrice}), { status: 201});
    
  } catch (error) {
//    console.log(error)
    // logger.error('Error updating transaction and ohlc data ftm', {error})
    const comment = "Error updating transaction and ohlc data ftm"
    Sentry.captureException(error, { extra: { comment } });
    return new Response(JSON.stringify('Error:' + error), { status: 500 });
    //res.status(500).json({ message: 'Internal server error' });
  }
}
