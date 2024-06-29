import { query } from "../../db";







export async function POST(req: Request) {
  const data = await req.json();
  const { chainid, token_address, token_ticker, token_name, token_description, image_url, creator, twitter, telegram, website, datetime } = data;

  if (chainid !== 'ftm' && chainid !== 'sei') {
    throw new Error('Invalid chain ID. Must be either "ftm" or "sei".');
  }
  // Define table names based on chain id
  // Define table names based on chain id
  const tokenListTableName = `token_list_ftm`;
  // console.log('Received chainid:', chainid, 'Using table:', tokenListTableName);



  try {


      const sql = `
      INSERT INTO ${tokenListTableName} 
      (token_address, token_ticker, token_name, token_description, image_url, creator, datetime, twitter, telegram, website, dex_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;

    // console.log('Executing query:', query);
    // console.log('With parameters:', [token_address, token_ticker, token_name, token_description, image_url, creator, datetime, twitter || '', telegram || '', website || '']);

    await query(sql, [token_address, token_ticker, token_name, token_description, image_url, creator, datetime, twitter || '', telegram || '', website || '', '']);

    return new Response(JSON.stringify({ message: 'Token data saved successfully.' }), { status: 201 });

  } catch (error) {

    return new Response(JSON.stringify('Error:' + error), { status: 500 });
    //res.status(500).json({ message: 'Internal server error' });
  }
}
