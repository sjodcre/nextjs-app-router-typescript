import { ethers } from "ethers";
import { query } from "../db";
import { calculatePrice } from "@/app/_utils/helpers";
// import logger from "@/app/_utils/logger";

export  async function POST(req: Request) {
  const data = await req.json();
  const {tokenAddress, account,tx_status, token_amount, native_amount, time, price, volume, trade, tx_hash}  = data;
  // console.log("entering pending entry...")
  // logger.info("updating pending entry ftm")
  // console.log("values inside the returned data", data)
  if (!tokenAddress || !account  || !tx_status  || !token_amount || !native_amount || typeof time !== 'number' || typeof price !== 'number' || typeof volume !== 'number' || (trade !== 'buy' && trade !== 'sell')) {
    // logger.warn('Invalid input data for pending transaction ftm')
    return new Response(JSON.stringify({ error: 'Invalid input data'}), { status: 400});
  
}
// const transactionTableName = 'transaction_history_ftm';
  const transactionTableName = 'ftm_transaction_history';
  // logger.info('update pending transaction ftm', {tx_hash})

  try {
    const sql = `
    SELECT 
        (SELECT sum_token FROM ${transactionTableName} WHERE token_address = $1 ORDER BY timestamp DESC LIMIT 1) AS sum_token,
        (SELECT sum_native FROM ${transactionTableName} WHERE token_address = $2 ORDER BY timestamp DESC LIMIT 1) AS sum_native
`;
  const result = await query(sql, [tokenAddress, tokenAddress]);

// let sum_token = result ? result[0].sum_token : 5E18; 
// if (tx_status === 'successful'){
//     sum_token = trade === 'buy' ? sum_token + token_amount : sum_token - token_amount;
// }


// let sum_native = result ? result[0].sum_native : 1E17;  // Using scientific notation for the default value
// if (tx_status === 'successful'){
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

/*  await db.run(`INSERT INTO ${transactionTableName} (token_address, account, tx_status, token_amount, native_amount, price_per_token, timestamp, trade, sum_token, sum_native, tx_hash)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?); SELECT last_insert_rowid();`, [tokenAddress, account, tx_status, token_amount, native_amount, price, time, trade, sum_token,sum_native, tx_hash]); */


  const sql2 = `
    INSERT INTO ${transactionTableName} (token_address, account, tx_status, token_amount, native_amount, price_per_token, timestamp, trade, sum_token, sum_native, tx_hash, marketcap)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
  `;

  // logger.info('updated transaction data')
          // Execute the INSERT query with placeholders for values
          // let result2= await query(sql2, [tokenAddress, account, tx_status, token_amount, native_amount, price, time, trade, sum_token, sum_native, tx_hash]);
    let result2= await query(sql2, [tokenAddress, account, tx_status, token_amount, native_amount, price, time, trade, sum_token_str, sum_native_str, tx_hash, marketCapString]);
          
          // Retrieve the last inserted row ID (primary key)
         // const primaryKey = result2[0].lastID;
          
          // Return the primary key as part of the response
          // const txid = result2[0].txid;  // Access the txid from the result
          // return new Response(JSON.stringify({ txid }), { status: 201 });

    return new Response(JSON.stringify("Success"), { status: 201});
    
  } catch (error) {
  //  console.log("err:" + error)
    // logger.error('Error updating pending transaction ftm', {error})
    return new Response(JSON.stringify(error), { status: 500 });
    //res.status(500).json({ message: 'Internal server error' });
  }
}
