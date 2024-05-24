import { query } from "@/app/api/db";




export async function GET(req: Request, route: { params: { id: string } }) {
  try {

   
    const id = route.params.id;
    // Fetch token data based on the ID from the database using parameterized query
    
    const holders = await query("SELECT account, balance FROM token_balances_sei WHERE token_address = ? ORDER BY balance DESC LIMIT 20", [id]);

    // If a token is found, return it as a JSON response with a 200 status code
    return new Response(JSON.stringify(holders), { status: 200 });
  } catch (error) {
    console.error('Error fetching token:', error);
    // If an error occurs during fetching, return a 500 status code
    return new Response(JSON.stringify('Internal Server Error'), { status: 500 });
  }
}