import { query } from "../db";






export async function GET(req: Request) {

  const url = new URL(req.url)

  const tokenAddress = url.searchParams.get("token_address");
  
  if (!tokenAddress) {
   
    return new Response(JSON.stringify({ error: 'Token address is required' }), { status: 400 });
}

  console.log(tokenAddress)
  try {
  
    // const transactions = await query(`SELECT * FROM transaction_history_ftm WHERE token_address = $1 AND tx_status = 'successful' ORDER BY timestamp DESC`, [tokenAddress]);
    const transactions = await query(`SELECT * FROM ftm_transaction_history WHERE token_address = $1 AND tx_status = 'successful' ORDER BY timestamp DESC`, [tokenAddress]);

    return new Response(JSON.stringify(transactions), { status: 200 });
    
  } catch (error) {
    console.error('Failed to fetch latest data time:', error);
    // If an error occurs during fetching, return a 500 status code
    return new Response(JSON.stringify('Internal Server Error'+ error ), { status: 500 });
  }
}