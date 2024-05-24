import { query } from "../db";






export  async function POST(req: Request) {
  const data = await req.json();
  const { tokenAddress, account, tx_status,token_amount, native_amount, time, price, volume,trade, tx_hash } = data;
  console.log("updating database...")

  // Validate inputs
  if (!tx_hash || !tokenAddress || !account  || !tx_status  || typeof token_amount !== 'number' || typeof native_amount !== 'number' || typeof time !== 'number' || typeof price !== 'number' || typeof volume !== 'number' || (trade !== 'buy' && trade !== 'sell')) {
    return new Response(JSON.stringify({ error: 'Invalid input data'}), { status: 400});
   }
 // Define table names based on chain id
 const transactionTableName = 'transaction_history_ftm';
 const ohlcTableName = 'ohlc_ftm';



  try {
    const sql = `
            SELECT 
                (SELECT sum_token FROM ${transactionTableName} WHERE token_address = ? ORDER BY timestamp DESC LIMIT 1) AS sum_token,
                (SELECT sum_native FROM ${transactionTableName} WHERE token_address = ? ORDER BY timestamp DESC LIMIT 1) AS sum_native
        `;

        const result = await query(sql, [tokenAddress, tokenAddress]);

        let sum_token = result ? result.sum_token : 1E16; 
        if (tx_status ==="successful") {
            sum_token = trade === 'buy' ? sum_token + token_amount : sum_token - token_amount;
        }

        let sum_native = result ? result.sum_native : 1E17;  // Using scientific notation for the default value
        if (tx_status ==="successful") {
            sum_native = trade === 'buy' ? sum_native + native_amount : sum_native - native_amount;
        }
        // const result = await db.get(`SELECT sum_token FROM ${transactionTableName} WHERE token_address = ? ORDER BY timestamp DESC LIMIT 1`, [tokenAddress]);
        // let sum_token = result ? result.sum : 1E16;
        // sum_token = trade === 'buy' ? sum_token + token_amount : sum_token - token_amount;
        // const result2 = await db.get(`SELECT sum_native FROM ${transactionTableName} WHERE token_address = ? ORDER BY timestamp DESC LIMIT 1`, [tokenAddress]);
        // let sum_native = result2 ? result2.sum : 1E17;
        // sum_native = trade === 'buy' ? sum_native + native_amount : sum_native - native_amount;

        console.log(sum_token, sum_native);

        // transaction_history table
        await query(`UPDATE ${transactionTableName} SET sum_native = ? ,sum_token = ?, tx_status = ? , timestamp = ? , token_amount = ? WHERE tx_hash = ?` , [sum_native, sum_token, tx_status, time , token_amount, tx_hash]);

                          
        // ohlc table
        const timeSlice = Math.floor(time / 300) * 300;
        const existing = await query(`SELECT * FROM ${ohlcTableName} WHERE token_address = ? AND time = ?`, [tokenAddress, timeSlice]);
        if (existing) {

            const updatedOHLC = {
                open: existing.open,
                high: Math.max(existing.high, price),
                low: Math.min(existing.low, price),
                close: price,
                volume: existing.volume + volume
            };
            await query(`UPDATE ${ohlcTableName} SET high = ?, low = ?, close = ?, volume = ? WHERE chartid = ?`, 
                [updatedOHLC.high, updatedOHLC.low, updatedOHLC.close, updatedOHLC.volume, existing.chartid]);
        } else {
            await query(`INSERT INTO ${ohlcTableName} (token_address, time, open, high, low, close, volume)
                          VALUES (?, ?, ?, ?, ?, ?, ?)`, [tokenAddress, timeSlice, price, price, price, price, volume]);
        }

        //token_balance table
        const currentBalance = (await query(`SELECT balance FROM token_balances_ftm WHERE account = ? AND token_address =?`, [account, tokenAddress])) || {balance: 0 };
        let newBalance = currentBalance.balance;
        if (tx_status ==="successful") {
            if (trade === 'buy') {
                newBalance += token_amount;
            } else if (trade === 'sell') {
                newBalance -= token_amount;
            }
        }
        
    
        if (currentBalance.balance === 0) {
            await query("INSERT INTO token_balances_ftm (account, token_address, balance) VALUES (?, ?, ?)", [account, tokenAddress, newBalance]);
        } else {
            await query("UPDATE token_balances_ftm SET balance = ? WHERE account = ? AND token_address = ?", [newBalance, account, tokenAddress]);
        }

         
    return new Response(JSON.stringify({ message: 'Transaction and OHLC data updated successfully.' }), { status: 201});
    
  } catch (error) {
   
    return new Response(JSON.stringify('Error'), { status: 500 });
    //res.status(500).json({ message: 'Internal server error' });
  }
}
