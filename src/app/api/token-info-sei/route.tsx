// import logger from "@/app/_utils/logger";
import { query } from "../db";
import * as Sentry from '@sentry/nextjs';



export async function GET(req: Request) {
  // logger.info('getting token info sei')
  const url = new URL(req.url)

  const token_address = url.searchParams.get("token_address");

  const tableName = 'token_list_sei';
  const profileTable = 'profile_sei';

  // const sql = `SELECT * FROM ${tableName} WHERE token_address = $1`;
  const sql = `
    SELECT tl.*, p.username as creator_username
    FROM ${tableName} tl
    LEFT JOIN ${profileTable} p ON tl.creator = p.account
    WHERE tl.token_address = $1`;

  try {

       const rows = await query(sql,[token_address]); // Correctly passing the parameter
    if (rows.length > 0) {
          // If a token is found, return it as a JSON response with a 200 status code
        // logger.info('token info found')
        return new Response(JSON.stringify(rows), { status: 200 });
    } else {
      // logger.info('token info not found')
      return new Response(JSON.stringify({ message: "No data found for the specified token address." }), { status: 400 });
       
    }
    
  } catch (error) {
    // console.error('Error fetching data:', error);
    // logger.error('Error fetching token info', {error})
    Sentry.captureException(error)
    return new Response(JSON.stringify('Internal Server Error'), { status: 500 });
  }
}