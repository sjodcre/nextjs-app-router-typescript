import { query } from "../../db";




export async function GET(req: Request) {
  try {
    const pendingTransactions = await query("SELECT * FROM transaction_history_ftm WHERE tx_status = 'pending'", []);

    // If a token is found, return it as a JSON response with a 200 status code
    return new Response(JSON.stringify(pendingTransactions), { status: 200 });
  } catch (error) {
    console.error('Error fetching coin:', error);
    // If an error occurs during fetching, return a 500 status code
    return new Response(JSON.stringify('Internal Server Error'), { status: 500 });
  }
}