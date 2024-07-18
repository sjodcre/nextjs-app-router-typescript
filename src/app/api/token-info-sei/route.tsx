import { query } from "../db";



export async function GET(req: Request) {

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
      return new Response(JSON.stringify(rows), { status: 200 });
    } else {
      return new Response(JSON.stringify({ message: "No data found for the specified token address." }), { status: 400 });
       
    }
    
  } catch (error) {
    console.error('Error fetching data:', error);
    // If an error occurs during fetching, return a 500 status code
    return new Response(JSON.stringify('Internal Server Error'), { status: 500 });
  }
}