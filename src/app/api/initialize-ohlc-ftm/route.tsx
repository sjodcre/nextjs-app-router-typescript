import { access } from "fs";
import { query } from "../db";
import { ethers } from "ethers";
import { calculatePrice } from "@/app/_utils/helpers";
// import logger from "@/app/_utils/logger";
import * as Sentry from '@sentry/nextjs';


export async function POST(req: Request) {
  const data = await req.json();
  const { tokenAddress, account, token_amount, native_amount, time, price, volume, trade, tx_hash } = data;
  // logger.info('initializing ohlc for new token ftm', {tokenAddress})


  // Validate inputs
  if (!tx_hash || !tokenAddress || !account || !token_amount || !native_amount || typeof time !== 'number' || typeof price !== 'number' || typeof volume !== 'number') {
    return new Response(JSON.stringify({ error: 'Invalid input data' }), { status: 400 });
  }

  // Define table names based on chain id
  // const transactionTableName = 'transaction_history_ftm';
  const transactionTableName = 'ftm_transaction_history';
  const ohlcTableName = 'ohlc_ftm';

  try {
    // let sum_token = 5E18;
    // let sum_native = 1E17;
    let sum_token = "5000000000000000000";
    let sum_native = "100000000000000000";
    let tx_status = 'successful'

    //calculate price
    const sumTokenBN = ethers.BigNumber.from(sum_token);
    const nativeSumBN = ethers.BigNumber.from(sum_native)
    const bondingPrice = calculatePrice(nativeSumBN,sumTokenBN,ethers.BigNumber.from('50000'));
    const priceBN = ethers.utils.parseUnits(bondingPrice.toString(), 18); // Assuming price is in 18 decimal places
    // console.log("bonding price",bondingPrice)
    // console.log("priceBN", priceBN)
    const marketCapBN = sumTokenBN.mul(priceBN).div(ethers.BigNumber.from("1000000000000000000"));
    const marketCap = ethers.utils.formatUnits(marketCapBN, 18);
    const marketCapString = marketCap.toString();
// console.log("marketcapString", marketCapString)

    const sql = `INSERT INTO ${transactionTableName} (token_address, account, token_amount, native_amount, price_per_token, timestamp, trade, sum_token, sum_native, tx_hash, tx_status, marketcap)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)` ;
    // Insert transaction data into the transaction history table
    await query(sql, [tokenAddress, account, token_amount, native_amount, bondingPrice, time, trade, sum_token, sum_native, tx_hash, tx_status, marketCapString]);

    // logger.info('done initializing transaction data')
    
    // Handle OHLC data
    const timeSlice = Math.floor(time / 300) * 300;
    const sql2 = `SELECT * FROM ${ohlcTableName} WHERE token_address = $1 AND time = $2`;
    const existing = await query(sql2, [account, timeSlice]);

    if (existing.length === 0) {

      const sql3 = `INSERT INTO ${ohlcTableName} (token_address, time, open, high, low, close, volume)
      VALUES ($1, $2, $3, $4, $5, $6 ,$7)`;
  await query(sql3, [tokenAddress, timeSlice, bondingPrice, bondingPrice, bondingPrice, bondingPrice, volume]);
  // console.log("'No data available for the specified token address and time' ")
    } else {
          const updatedOHLC = {
        open: existing[0].open,
        high: Math.max(existing[0].high, bondingPrice),
        low: Math.min(existing[0].low, bondingPrice),
        close: bondingPrice,
        volume: existing[0].volume + volume
      };
      const sql3 = `UPDATE ${ohlcTableName} SET high = $1, low = $2, close = $3, volume = $4 WHERE chartid = $5`;
      await query(sql3, [updatedOHLC.high, updatedOHLC.low, updatedOHLC.close, updatedOHLC.volume, existing[0].chartid]);
    }

    //initialize balance table
    // const sql4 = 'INSERT INTO token_balances_ftm (account, token_address, balance) VALUES ($1, $2, $3)';
    const sql4 = 'INSERT INTO ftm_users_balance (account, token_address, balance) VALUES ($1, $2, $3)';
    await query(sql4, [tokenAddress, tokenAddress, token_amount]);
    // logger.info('done initializing ohlc')

    return new Response(JSON.stringify({ message: 'Transaction and OHLC data updated successfully.' }), { status: 201 });

  } catch (error) {
    // console.log("error at server for initialize-ohlc-ftm", error)
    // logger.error('Error initializing transaction and ohlc data', {error})
    Sentry.captureException(error)
    return new Response(JSON.stringify(error), { status: 500 });
    //res.status(500).json({ message: 'Internal server error' });
  }
}
