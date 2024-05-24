import { access } from "fs";
import { query } from "../db";






export async function POST(req: Request) {
  const data = await req.json();
  const { tokenAddress, account, token_amount, native_amount, time, price, volume, trade, tx_hash } = data;


  // Validate inputs
  if (!tx_hash || !tokenAddress || !account || typeof token_amount !== 'number' || typeof native_amount !== 'number' || typeof time !== 'number' || typeof price !== 'number' || typeof volume !== 'number') {
    return new Response(JSON.stringify({ error: 'Invalid input data' }), { status: 400 });
  }

  // Define table names based on chain id
  const transactionTableName = 'transaction_history_sei';
  const ohlcTableName = 'ohlc_sei';

  try {
    let sum_token = 1E16;
    let sum_native = 1E17;


    const sql = `INSERT INTO ${transactionTableName} (token_address, account, token_amount, native_amount, price_per_token, timestamp, trade, sum_token, sum_native, tx_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)` ;
    // Insert transaction data into the transaction history table
    await query(sql, [tokenAddress, account, token_amount, native_amount, price, time, trade, sum_token, sum_native, tx_hash]);

    // Handle OHLC data
    const timeSlice = Math.floor(time / 300) * 300;
    const sql2 = `SELECT * FROM ${ohlcTableName} WHERE token_address = $1 AND time = $2`;
    const existing = await query(sql2, [account, timeSlice]);

    if (existing.length === 0) {

      const sql3 = `INSERT INTO ${ohlcTableName} (token_address, time, open, high, low, close, volume)
      VALUES ($1, $2, $3, $4, $5, $6 ,$7)`;
  await query(sql3, [tokenAddress, timeSlice, price, price, price, price, volume]);
  console.log("'No data available for the specified token address and time' ")
    } else {
          const updatedOHLC = {
        open: existing[0].open,
        high: Math.max(existing[0].high, price),
        low: Math.min(existing[0].low, price),
        close: price,
        volume: existing[0].volume + volume
      };
      const sql3 = `UPDATE ${ohlcTableName} SET high = $1, low = $2, close = $3, volume = $4 WHERE chartid = $5`;
      await query(sql3, [updatedOHLC.high, updatedOHLC.low, updatedOHLC.close, updatedOHLC.volume, existing[0].chartid]);
    }

    //initialize balance table
    const sql4 = 'INSERT INTO token_balances_sei (account, token_address, balance) VALUES ($1, $2, $3)';
    await query(sql4, [account, tokenAddress, token_amount]);


    return new Response(JSON.stringify({ message: 'Transaction and OHLC data updated successfully.' }), { status: 201 });

  } catch (error) {

    return new Response(JSON.stringify(error), { status: 500 });
    //res.status(500).json({ message: 'Internal server error' });
  }
}
