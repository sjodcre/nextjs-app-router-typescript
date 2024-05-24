import { query } from "../db";






export  async function POST(req: Request) {
  const data = await req.json();
  const { tx_status, time,tx_hash } = data;
  

 // Validate inputs
 if (!tx_hash  || !tx_status  ||  typeof time !== 'number') {
    return new Response(JSON.stringify({ error: 'Invalid input data'}), { status: 400});
   
}
 // Define table names based on chain id
  // Define table names based on chain id
  const transactionTableName = 'transaction_history_sei';



  try {
   
        // transaction_history table
        await query(`UPDATE ${transactionTableName} SET tx_status = ? , timestamp = ?  WHERE tx_hash = ?` , [tx_status, time , tx_hash ]);

         
    return new Response(JSON.stringify({ message: 'Transaction and OHLC data updated successfully.' }), { status: 201});
    
  } catch (error) {
   
    return new Response(JSON.stringify('Error'), { status: 500 });
    //res.status(500).json({ message: 'Internal server error' });
  }
}
