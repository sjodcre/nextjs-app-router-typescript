import { query } from "@/app/api/db";




export async function GET(req: Request, route: { params: { tokenAddress: string } }) {
// export async function GET(req: NextApiRequest, res: NextApiResponse) {

  try {
    // console.log("req.query", req.url
    const tokenAddress = route.params.tokenAddress as string;
    // console.log("tokenAddr", tokenAddress)
    // const id = route.params.id;
    // Fetch token data based on the ID from the database using parameterized query
    // console.log("id for top holders", id)
    const holders = await query("SELECT account, balance FROM token_balances_ftm WHERE token_address = $1 ORDER BY balance DESC LIMIT 20", [tokenAddress]);
    // console.log("holders", holders)
    // If a token is found, return it as a JSON response with a 200 status code
    return new Response(JSON.stringify(holders), { status: 200 });
    // res.status(200).json(holders);

  } catch (error) {
    console.error('Error fetching token:', error);
    // If an error occurs during fetching, return a 500 status code
    return new Response(JSON.stringify('Internal Server Error'), { status: 500 });
    // res.status(500).json({ message: 'Internal Server Error' });

  }
}