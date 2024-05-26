import { query } from "@/app/api/db";





export async function GET(req: Request, route: { params: { id: string } }) {


  // const data = await req.json();
   
  // const { token_address } = data as { token_address: string};

  // if (!token_address ) {
  //   return new Response(JSON.stringify({error: 'Token address required'}), { status: 400 });
  //   }

  const url = new URL(req.url)

  const tokenAddress = url.searchParams.get("token_address");

  if (!tokenAddress ) {
    return new Response(JSON.stringify({error: 'Token address required'}), { status: 400 });
    }

  // Determine the appropriate table based on the chainid
  const tableName ='ohlc_ftm';

  try {

   
    const sql = `SELECT MAX(time) as latestTime FROM ${tableName} WHERE token_address = $1`;
    const row = await query(sql,[tokenAddress]);
    if (row[0].latesttime) {
      return new Response(JSON.stringify({latestTime: row[0].latesttime }), { status: 200 });
        
    } else {
      return new Response(JSON.stringify({error: 'No data available for the specified token address' }), { status: 400 });
   
    }

  } catch (error) {
    console.error('Failed to fetch latest data time:', error);
    // If an error occurs during fetching, return a 500 status code
    return new Response(JSON.stringify('Internal Server Error'), { status: 500 });
  }
}