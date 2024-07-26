// import logger from "@/app/_utils/logger";
import { query } from "../../db";




export async function GET(req: Request) {
  const url = new URL(req.url)

  const token_address = url.searchParams.get("token_address");
  // logger.info('getting pending transactions ftm', {token_address})
  try {
    // const pendingTransactions = await query("SELECT * FROM transaction_history_ftm WHERE tx_status = 'pending' AND token_address = $1", [token_address]);
    const pendingTransactions = await query("SELECT * FROM ftm_transaction_history WHERE tx_status = 'pending' AND token_address = $1", [token_address]);
    // console.log("pending results from db", pendingTransactions)
    // If a token is found, return it as a JSON response with a 200 status code
    return new Response(JSON.stringify(pendingTransactions), { status: 200 });
  } catch (error) {
    // console.error('Error fetching coin:', error);
    // logger.error('Error fetching pending transactions ftm', {error})
    // If an error occurs during fetching, return a 500 status code
    return new Response(JSON.stringify('Internal Server Error'), { status: 500 });
  }
}