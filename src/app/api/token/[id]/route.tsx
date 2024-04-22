
import { query } from '../../db';


export async function GET(req: Request, route: { params: { id: string } }) {
  try {

    //const url = new URL(req.url)

    //const id = url.searchParams.get("address")
    const id = route.params.id;
    // Fetch token data based on the ID from the database using parameterized query
    const token = await query('SELECT tl.TokenID,tl.TokenSymbol,tl.TokenName,tl.creator,tm.MarketCap FROM TokenList tl JOIN TokenMarket tm ON tl.TokenID = tm.TokenID JOIN TokenInfo ti ON tl.TokenID = ti.TokenID WHERE tl.tokenaddress = $1', [id]);

    if (token.length === 0) {
      // If no token is found with the specified ID, return a 404 status code
      return new Response(JSON.stringify('Token not found'), { status: 400 });
    }

    // If a token is found, return it as a JSON response
    return new Response(JSON.stringify(token[0]), { status: 200 }); // Assuming token[0] contains the fetched token data
  } catch (error) {
    console.error('Error fetching token:', error);

  }


}