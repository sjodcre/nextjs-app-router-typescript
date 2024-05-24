import { query } from "@/app/api/db";





export async function GET(req: Request, route: { params: { id: string } }) {


  const data = await req.json();
   
  const { tokenAddress } = data;
  if (!tokenAddress) {
   
    return new Response(JSON.stringify({ error: 'Token address is required' }), { status: 400 });
}

  
  try {
  
    const transactions = await query(`SELECT * FROM transaction_history_ftm WHERE token_address = ? ORDER BY timestamp DESC`, [tokenAddress]);
    return new Response(JSON.stringify(transactions), { status: 200 });
    
  } catch (error) {
    console.error('Failed to fetch latest data time:', error);
    // If an error occurs during fetching, return a 500 status code
    return new Response(JSON.stringify('Internal Server Error'), { status: 500 });
  }
}