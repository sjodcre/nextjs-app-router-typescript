// import logger from "@/app/_utils/logger";
import { query } from "../../db";
import * as Sentry from '@sentry/nextjs';


export async function POST(req: Request) {
  const data = await req.json();
  const { chainid, token_address, token_ticker, token_name, token_description, image_url, creator, twitter, telegram, website, datetime } = data;
  // logger.info('storing deployed token data ftm', {token_address})
  if (chainid !== 'ftm' && chainid !== 'sei') {
    // logger.warn('Invalid chain ID. Must be either "ftm" or "sei".');
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

    // logger.error('Error after deploy token save token data', {error});
    const comment = "Error after deploy token save token data"
    Sentry.captureException(error, { extra: { comment } });
    return new Response(JSON.stringify('Error:' + error), { status: 500 });
    //res.status(500).json({ message: 'Internal server error' });
  }
}
