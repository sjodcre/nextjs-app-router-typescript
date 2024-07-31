import { query } from "../../db";
// import logger from "@/app/_utils/logger";
import * as Sentry from '@sentry/nextjs';



export async function GET(req: Request) {
  // logger.info('getting threads data')
  const url = new URL(req.url)

  const token_address = url.searchParams.get("token_address");
  const chain = url.searchParams.get("chain");
  const tableName = `replies_${chain}`;
  const profileTableName = `profile_${chain}`;
 
  // const sql = `SELECT * FROM replies_${chain} WHERE token_address='${token_address}'`;

    const sql = `
    SELECT r.*, p.username as creator_username
    FROM ${tableName} r
    LEFT JOIN ${profileTableName} p ON r.creator = p.account
    WHERE r.token_address = $1`;
  try {

       const rows = await query(sql,[token_address]); // Correctly passing the parameter
    if (rows.length > 0) {
      // If a token is found, return it as a JSON response with a 200 status code
      // logger.info('threads data found')
      return new Response(JSON.stringify(rows), { status: 200 });
    } else {
      // logger.info('threads data not found')
      // return new Response(JSON.stringify([]), { status: 400 });
      return new Response(JSON.stringify([]), { status: 200 });

       
    }
    
  } catch (error) {
    // logger.error('Error getting thread data', {error})
    // console.error('Error fetching coin:', error);
    const comment = "Error getting thread data"
    Sentry.captureException(error, { extra: { comment } });
    return new Response(JSON.stringify('Internal Server Error'), { status: 500 });
  }
}



export async function POST(req: Request) {

 
  const data = await req.json();
  const {token_address, file_uri,text, creator, username, chain}  = data;
 

  const tableName = 'replies';
  
  try {

     await query(
      `INSERT INTO ${tableName}_${chain} (token_address, file_uri,text,creator,created_at) VALUES ($1, $2, $3,$4,NOW())`,
      [token_address, file_uri,text,creator]
    );
  
    return new Response(JSON.stringify({ message: "Successful" }), { status: 200 });
  } catch (error) {
    // console.log(error)
    const comment = "Error inserting thread data"
    Sentry.captureException(error, { extra: { comment } });
    return new Response(JSON.stringify({ error: 'Failed to add reply' }), { status: 500 });
  }
}