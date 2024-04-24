// pages/api/token/update.ts


import { query } from '../../db';


export  async function POST(req: Request) {
 

  try {
    const url = new URL(req.url)
    const data = await req.json();
    const chain= url.searchParams.get("chain")
    const { tokenaddress, marketcap} = data;
    // Update token data in the database
    await query(
      `UPDATE tokenmarket_${chain} SET marketcap = ${marketcap} WHERE tokenaddress = '${tokenaddress}'`,
      []
    );
    await query(
      `UPDATE tokenlist_${chain} SET lastactivity = NOW() WHERE tokenaddress = '${tokenaddress}'`,
      []
    );

    return new Response(JSON.stringify('Token not found'), { status: 200});
    
  } catch (error) {
   
    return new Response(JSON.stringify('Token not found'), { status: 500 });
    //res.status(500).json({ message: 'Internal server error' });
  }
}
