// import logger from "@/app/_utils/logger";
import { query } from "../db";
import * as Sentry from '@sentry/nextjs';




export async function GET(req: Request, route: { params: { id: string } }) {
  try {
    const url = new URL(req.url)

    const chain= url.searchParams.get("chain")
    const id= url.searchParams.get("id")
    // logger.info("fetching coins created by user", {id})
    let tableName ='';
    if (chain ==="sei"){
      tableName = 'token_list_sei'
    } else if (chain ==="ftm") {
      tableName = 'token_list_ftm'
    }
   // const id = route.params.id;
    // Fetch token data based on the ID from the database using parameterized query
    const sql = `SELECT token_address, token_ticker, token_name, image_url, creator, token_description
    FROM ${tableName} 
    WHERE creator = $1`;
    const created = await query(sql,[id]);
    
    if (created.length === 0) {
      // logger.info("no coins created found")
      // If no token is found with the specified ID, return a 404 status code
      return new Response(JSON.stringify(`Coins not found: ${id}`), { status: 404 });
    }

    // If a token is found, return it as a JSON response with a 200 status code
    return new Response(JSON.stringify(created), { status: 200 });
  } catch (error) {
    // console.error('Error fetching coin:', error);
    // logger.error('Error fetching coins created', {error});
    Sentry.captureException(error); // Capture the error with Sentry
    return new Response(JSON.stringify('Internal Server Error'), { status: 500 });
  }
}