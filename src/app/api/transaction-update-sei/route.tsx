import { query } from "../db";






export  async function POST(req: Request) {
  const data = await req.json();
  const {tokenAddress, account,tx_status, token_amount, native_amount, time, price, volume, trade, tx_hash}  = data;
  console.log("updating database...")

  if (!tokenAddress || !account  || !tx_status  || typeof token_amount !== 'number' || typeof native_amount !== 'number' || typeof time !== 'number' || typeof price !== 'number' || typeof volume !== 'number' || (trade !== 'buy' && trade !== 'sell')) {
    return new Response(JSON.stringify({ error: 'Invalid input data'}), { status: 400});
  
}
const transactionTableName = 'transaction_history_sei';


  try {
    const sql = `
    SELECT 
        (SELECT sum_token FROM ${transactionTableName} WHERE token_address = $1 ORDER BY timestamp DESC LIMIT 1) AS sum_token,
        (SELECT sum_native FROM ${transactionTableName} WHERE token_address = $2 ORDER BY timestamp DESC LIMIT 1) AS sum_native
`;
const result = await query(sql, [tokenAddress, tokenAddress]);
let sum_token = result ? result[0].sum_token : 5E18; 
if (tx_status === 'successful'){
    sum_token = trade === 'buy' ? sum_token + token_amount : sum_token - token_amount;
}


let sum_native = result ? result[0].sum_native : 1E17;  // Using scientific notation for the default value
if (tx_status === 'successful'){
    sum_native = trade === 'buy' ? sum_native + native_amount : sum_native - native_amount;
}

/*  await db.run(`INSERT INTO ${transactionTableName} (token_address, account, tx_status, token_amount, native_amount, price_per_token, timestamp, trade, sum_token, sum_native, tx_hash)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?); SELECT last_insert_rowid();`, [tokenAddress, account, tx_status, token_amount, native_amount, price, time, trade, sum_token,sum_native, tx_hash]); */


              const sql2 = `
              INSERT INTO ${transactionTableName} (token_address, account, tx_status, token_amount, native_amount, price_per_token, timestamp, trade, sum_token, sum_native, tx_hash)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `;
          // Execute the INSERT query with placeholders for values
          let result2 = await query(sql2, [tokenAddress, account, tx_status, token_amount, native_amount, price, time, trade, sum_token, sum_native, tx_hash]);
          
          // Retrieve the last inserted row ID (primary key)
        //  const primaryKey = result2;
          // console.log("primarykey from route.tsx", result2)
          // Return the primary key as part of the response
        // const txid = result2[0].txid;  // Access the txid from the result
        // console.log("txid backend", txid)
          // return new Response(JSON.stringify({ txid }), { status: 201 });
          return new Response(JSON.stringify("Success"), { status: 201});
    
  } catch (error) {
   console.log("err:" + error)
    return new Response(JSON.stringify(error), { status: 500 });
    //res.status(500).json({ message: 'Internal server error' });
  }
}
