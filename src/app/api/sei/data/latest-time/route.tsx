// import logger from "@/app/_utils/logger";
import { query } from "@/app/api/db";





export async function GET(req: Request, route: { params: { id: string } }) {


  // const data = await req.json();
   
  // const { token_address } = data as { token_address: string};

  // if (!token_address ) {
  //   return new Response(JSON.stringify({error: 'Token address required'}), { status: 400 });
  //   }
  const url = new URL(req.url)

  const tokenAddress = url.searchParams.get("token_address");
  // logger.info("fetching latest ohlc sei", {tokenAddress})

  if (!tokenAddress ) {
    // logger.warn("no token address provided")
    return new Response(JSON.stringify({error: 'Token address required'}), { status: 400 });
    }

  // Determine the appropriate table based on the chainid
  const tableName ='ohlc_sei';

  try {

   
    const sql = `SELECT MAX(time) as latestTime FROM ${tableName} WHERE token_address = $1`;
    const row = await query(sql,[tokenAddress]);
    // console.log("row", row[0].latesttime)
    if (row[0].latesttime) {
      return new Response(JSON.stringify({latestTime: row[0].latesttime }), { status: 200 });
        
    } else {
      // logger.info("No ohlc data available for the specified token address sei")
      return new Response(JSON.stringify({error: 'No data available for the specified token address' }), { status: 400 });
   
    }

  } catch (error) {
    // console.error('Failed to fetch latest data time:', error);
    // logger.error('Failed to fetch latest data time for chart sei:', {error});
    // If an error occurs during fetching, return a 500 status code
    return new Response(JSON.stringify('Internal Server Error'), { status: 500 });
  }
}