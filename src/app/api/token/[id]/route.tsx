
import { query } from '../../db';


export async function GET(req: Request, route: { params: { id: string } }) {
  try {

    const url = new URL(req.url)

    const chain= url.searchParams.get("chain")
    const id = route.params.id;
    // Fetch token data based on the ID from the database using parameterized query
    const token = await query(`
    SELECT
    tl.TokenID,
    tl.TokenSymbol,
    tl.TokenName,
    tl.TokenAddress,
    tl.Creator,
    tl.chainid,
    tm.MarketCap,
    p.username
    FROM TokenList_${chain} tl
    JOIN TokenMarket_${chain} tm ON tl.tokenaddress = tm.tokenaddress
    JOIN TokenInfo_${chain} ti ON tl.tokenaddress = ti.tokenaddress
    JOIN Profile_${chain} p ON tl.Creator = p.walletaddress
      WHERE tl.tokenaddress = '${id}'
    `, []);

    if (token.length === 0) {
      // If no token is found with the specified ID, return a 404 status code
      return new Response(JSON.stringify('Token not found'), { status: 404 });
    }

    // If a token is found, return it as a JSON response with a 200 status code
    return new Response(JSON.stringify(token[0]), { status: 200 });
  } catch (error) {
    console.error('Error fetching token:', error);
    // If an error occurs during fetching, return a 500 status code
    return new Response(JSON.stringify('Internal Server Error'), { status: 500 });
  }
}