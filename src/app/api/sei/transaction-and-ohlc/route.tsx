import { query } from "../../db";






export  async function POST(req: Request) {
  const data = await req.json();
  const { tokenAddress, account, tx_status,token_amount, native_amount, time, price, volume,trade, tx_hash ,nativeTokenPrice} = data;
  console.log("updating database...")

  // Validate inputs
  if (!tx_hash || !tokenAddress || !account  || !tx_status  || typeof token_amount !== 'number' || typeof native_amount !== 'number' || typeof time !== 'number' || typeof price !== 'number' || typeof volume !== 'number' || (trade !== 'buy' && trade !== 'sell')) {
    return new Response(JSON.stringify({ error: 'Invalid input data'}), { status: 400});
   }
 // Define table names based on chain id
 const transactionTableName = 'transaction_history_sei';
 const ohlcTableName = 'ohlc_sei';



  try {
    const sql = `
            SELECT 
                (SELECT sum_token FROM ${transactionTableName} WHERE token_address = $1 ORDER BY timestamp DESC LIMIT 1) AS sum_token,
                (SELECT sum_native FROM ${transactionTableName} WHERE token_address = $2 ORDER BY timestamp DESC LIMIT 1) AS sum_native
        `;

        const result = await query(sql, [tokenAddress, tokenAddress]);

        let sum_token = result ? result[0].sum_token : 5E18; 
        if (tx_status ==="successful") {
            sum_token = trade === 'buy' ? sum_token + token_amount : sum_token - token_amount;
        }

        let sum_native = result ? result[0].sum_native : 1E17;  // Using scientific notation for the default value
        if (tx_status ==="successful") {
            sum_native = trade === 'buy' ? sum_native + native_amount : sum_native - native_amount;
        }


    // Calculate market cap if tradesData and nativeTokenPrice are available
 
        const marketCap = sum_token* price * nativeTokenPrice / 1E18;
        const formattedMarketCap = marketCap.toLocaleString('en-US', {
          style: 'decimal',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
       
      console.log(marketCap+':'+formattedMarketCap)
        // transaction_history table
        let result2 = await query(`UPDATE ${transactionTableName} SET sum_native = $1 ,sum_token = $2, tx_status = $3 , timestamp = $4 , token_amount = $5 , price_per_token = $6, marketcap = $7 WHERE tx_hash = $8 RETURNING txid` , [sum_native, sum_token, tx_status, time , token_amount, price, marketCap, tx_hash]);

        console.log("transaction&ohlc result", result2)
        // const sqlCheck = `SELECT * FROM ${transactionTableName} WHERE tx_hash = $1 `;
        // const existingRow = await query(sqlCheck, [tx_hash]);
        // let result2;
        // if (existingRow.length === 0) {
        //     const sql = `INSERT INTO ${transactionTableName} (token_address, account, token_amount, native_amount, price_per_token, timestamp, trade, sum_token, sum_native, tx_hash, tx_status)
        // VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING txid` ;
        //     // Insert transaction data into the transaction history table
        //      result2 = await query(sql, [tokenAddress, account, token_amount, native_amount, price, time, trade, sum_token, sum_native, tx_hash, tx_status]);
        // } else {
        //     result2 = await query(`UPDATE ${transactionTableName} SET sum_native = $1 ,sum_token = $2, tx_status = $3 , timestamp = $4 , token_amount = $5 WHERE tx_hash = $6 RETURNING txid` , [sum_native, sum_token, tx_status, time , token_amount, tx_hash]);
        // }
        const txid = result2[0].txid;

                          
        // ohlc table
        const timeSlice = Math.floor(time / 300) * 300;
        const existing = await query(`SELECT * FROM ${ohlcTableName} WHERE token_address = $1 AND time = $2`, [tokenAddress, timeSlice]);
        console.log("existing", existing)
        if (existing.length > 0) {
            console.log("empty but entering?")
            const updatedOHLC = {
                open: existing[0].open,
                high: Math.max(existing[0].high, price),
                low: Math.min(existing[0].low, price),
                close: price,
                volume: existing[0].volume + volume
            };
            await query(`UPDATE ${ohlcTableName} SET high = $1, low = $2, close = $3, volume = $4 WHERE chartid = $5`, 
                [updatedOHLC.high, updatedOHLC.low, updatedOHLC.close, updatedOHLC.volume, existing[0].chartid]);
        } else {
            await query(`INSERT INTO ${ohlcTableName} (token_address, time, open, high, low, close, volume)
                          VALUES ($1, $2, $3, $4, $5, $6, $7)`, [tokenAddress, timeSlice, price, price, price, price, volume]);
        }

        //token_balance table
        const queryBalance = (await query(`SELECT balance FROM token_balances_sei WHERE account = $1 AND token_address =$2`, [account, tokenAddress]));

        let currentBalance = { balance: 0 }; // Default value
        if (queryBalance.length>0){
            currentBalance = queryBalance[0]
        }
        let newBalance = currentBalance.balance;
        console.log("newBalance", newBalance)
        if (tx_status ==="successful") {
            if (trade === 'buy') {
                newBalance += token_amount;
            } else if (trade === 'sell') {
                newBalance -= token_amount;
            }
        }
        
    
        if (currentBalance.balance === 0) {
            await query("INSERT INTO token_balances_sei (account, token_address, balance) VALUES ($1, $2, $3)", [account, tokenAddress, newBalance]);
        } else {
            await query("UPDATE token_balances_sei SET balance = $1 WHERE account = $2 AND token_address = $3", [newBalance, account, tokenAddress]);
        }

         
    return new Response(JSON.stringify({ message: 'Transaction and OHLC data updated successfully.' , txid}), { status: 201});
    
  } catch (error) {
   console.log(error)
    return new Response(JSON.stringify('Error:' + error), { status: 500 });
    //res.status(500).json({ message: 'Internal server error' });
  }
}
