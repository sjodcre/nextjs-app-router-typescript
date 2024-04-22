// pages/api/token/update.ts


import { query } from '../../db';


export  async function POST(req: Request) {
 

  try {
    const data = await req.json();

    const { tokenid, marketcap} = data;
    // Update token data in the database
    await query(
      `UPDATE tokenmarket SET marketcap = $1 WHERE tokenid = $2`,
      [marketcap, tokenid]
    );
    await query(
      `UPDATE tokenlist SET lastactivity = NOW() WHERE tokenid = $1`,
      [tokenid]
    );

    return new Response(JSON.stringify('Token not found'), { status: 200});
    
  } catch (error) {
   
    return new Response(JSON.stringify('Token not found'), { status: 500 });
    //res.status(500).json({ message: 'Internal server error' });
  }
}
