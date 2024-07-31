// import logger from "@/app/_utils/logger";
import { query } from "../db";
import * as Sentry from '@sentry/nextjs';




export async function GET(req: Request, route: { params: { id: string } }) {
  try {
    const url = new URL(req.url)

    const chain= url.searchParams.get("chain")
    const id= url.searchParams.get("id")
    // logger.info("getting coins held by user", {id})
    let tableName ='';
    let detailsTable = '';
    if (chain ==="sei"){
      // tableName = 'token_balances_sei'
      tableName = 'sei_users_balance'
      detailsTable = 'token_list_sei'
    } else if (chain ==="ftm") {
      // tableName = 'token_balances_ftm'
      tableName = 'ftm_users_balance'
      detailsTable = 'token_list_ftm'
    }
   // const id = route.params.id;
    // Fetch token data based on the ID from the database using parameterized query
    const sql = `SELECT * FROM ${tableName} WHERE account = $1`;
    const profiles = await query(sql,[id]);

    if (profiles.length === 0) {
      console.info("no coins held found")
      // If no token is found with the specified ID, returnq a 404 status code
      return new Response(JSON.stringify(`Coin not found: ${id}`), { status: 404 });
    }
    const tokenAddresses = profiles.map(p => p.token_address);


    const detailsSql = `
    SELECT token_address, token_ticker, token_name, image_url
    FROM ${detailsTable}
    WHERE token_address = ANY($1)
  `;    
    const details = await query(detailsSql, [tokenAddresses]);
    const response = {
      profiles,
      details
    };
    // If a token is found, return it as a JSON response with a 200 status code
    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error) {
    // console.error('Error fetching Coin:', error);
    // logger.error('Error fetching coins held:', {error});
    const comment = "Error fetching coins held"
    Sentry.captureException(error, { extra: { comment } });
    return new Response(JSON.stringify('Internal Server Error'), { status: 500 });
  }
}