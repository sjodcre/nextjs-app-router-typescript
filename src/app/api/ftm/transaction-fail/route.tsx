// import logger from "@/app/_utils/logger";
import { query } from "../../db";
import * as Sentry from '@sentry/nextjs';

export  async function POST(req: Request) {
  const data = await req.json();
  const { tx_status, time,tx_hash } = data;
  
  // logger.info('updating failed transaction ftm', {tx_hash})
 // Validate inputs
 if (!tx_hash  || !tx_status  ||  typeof time !== 'number') {
    return new Response(JSON.stringify({ error: 'Invalid input data'}), { status: 400});
   
}
 // Define table names based on chain id
  // Define table names based on chain id
  // const transactionTableName = 'transaction_history_ftm';
  const transactionTableName = 'ftm_transaction_history';

  try {
   
        // transaction_history table
        await query(`UPDATE ${transactionTableName} SET tx_status = $1 , timestamp = $2  WHERE tx_hash = $3` , [tx_status, time , tx_hash ]);

         
    return new Response(JSON.stringify({ message: 'Transaction and OHLC data updated successfully.' }), { status: 201});
    
  } catch (error) {
    // logger.error('error updating failed transaction ftm', {error})
    const comment = "error updating failed transaction ftm"
    Sentry.captureException(error, { extra: { comment } });
    return new Response(JSON.stringify('Error'), { status: 500 });
    //res.status(500).json({ message: 'Internal server error' });
  }
}
