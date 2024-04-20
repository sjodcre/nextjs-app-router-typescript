import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query; // Extract the ID from the request query parameters

  try {
    // Fetch token data based on the ID from the database using parameterized query
    const token = await query('SELECT tl.TokenID,tl.TokenSymbol,tl.TokenName,tl.creator,tm.MarketCap FROM TokenList tl JOIN TokenMarket tm ON tl.TokenID = tm.TokenID JOIN TokenInfo ti ON tl.TokenID = ti.TokenID WHERE tl.tokenaddress = $1', [id]);

    if (token.length === 0) {
      // If no token is found with the specified ID, return a 404 status code
      return res.status(404).json({ message: 'Token not found' });
    }

    // If a token is found, return it as a JSON response
    res.status(200).json(token[0]); // Assuming token[0] contains the fetched token data
  } catch (error) {
    console.error('Error fetching token:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
