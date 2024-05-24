import { query } from "../db";






export  async function POST(req: Request) {
  const data = await req.json();
  const { tokenAddress, account, token_amount, native_amount, time, price, volume, trade, tx_hash} = data;
  

    // Validate inputs
    if (!tx_hash  || !tokenAddress || !account || typeof token_amount !== 'number' || typeof native_amount !== 'number' || typeof time !== 'number' || typeof price !== 'number' || typeof volume !== 'number' ) {
        return new Response(JSON.stringify({ error: 'Invalid input data' }), { status: 400});
    }

    // Define table names based on chain id
    const transactionTableName = 'transaction_history_ftm';
    const ohlcTableName = 'ohlc_ftm';

  try {
    let sum_token = 1E16;
        let sum_native = 1E17;

        // Insert transaction data into the transaction history table
        await query(`INSERT INTO ${transactionTableName} (token_address, account, token_amount, native_amount, price_per_token, timestamp, trade, sum_token, sum_native, tx_hash)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [tokenAddress, account, token_amount, native_amount, price, time, trade, sum_token, sum_native, tx_hash]);

        // Handle OHLC data
        const timeSlice = Math.floor(time / 300) * 300;
        const existing = await query(`SELECT * FROM ${ohlcTableName} WHERE token_address = ? AND time = ?`, [token_amount, timeSlice]);

        if (existing) {
            const updatedOHLC = {
                open: existing[0].open,
                high: Math.max(existing[0].high, price),
                low: Math.min(existing[0].low, price),
                close: price,
                volume: existing[0].volume + volume
            };
            await query(`UPDATE ${ohlcTableName} SET high = ?, low = ?, close = ?, volume = ? WHERE chartid = ?`, 
                [updatedOHLC.high, updatedOHLC.low, updatedOHLC.close, updatedOHLC.volume, existing[0].chartid]);
        } else {
            await query(`INSERT INTO ${ohlcTableName} (token_address, time, open, high, low, close, volume)
                          VALUES (?, ?, ?, ?, ?, ?, ?)`, [tokenAddress, timeSlice, price, price, price, price, volume]);
        }

        //initialize balance table
        await query("INSERT INTO token_balances_ftm (account, token_address, balance) VALUES (?, ?, ?)", [tokenAddress, tokenAddress, token_amount]);

    
    return new Response(JSON.stringify({ message: 'Transaction and OHLC data updated successfully.' }), { status: 201});
    
  } catch (error) {
   
    return new Response(JSON.stringify('Error'), { status: 500 });
    //res.status(500).json({ message: 'Internal server error' });
  }
}
