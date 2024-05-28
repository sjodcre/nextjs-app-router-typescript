import { user } from "@/app/_redux/features/user-slice";
import { query } from "../../db";



export async function GET(req: Request) {

  const url = new URL(req.url)

  const token_address = url.searchParams.get("token_address");

  const tableName = 'replies';
  const sql = `SELECT * FROM ${tableName} WHERE token_address='${token_address}'`;

  try {

       const rows = await query(sql,[]); // Correctly passing the parameter
    if (rows.length > 0) {
          // If a token is found, return it as a JSON response with a 200 status code
    return new Response(JSON.stringify(rows), { status: 200 });
    } else {
      return new Response(JSON.stringify({ message: "No data found for the specified token address." }), { status: 400 });
       
    }
    
  } catch (error) {
    console.error('Error fetching coin:', error);
    // If an error occurs during fetching, return a 500 status code
    return new Response(JSON.stringify('Internal Server Error'), { status: 500 });
  }
}



export async function POST(req: Request) {

 
  const data = await req.json();
  const {token_address, file_uri,text, creator, username, chain}  = data;
 

  const tableName = 'replies';
  
  try {

     await query(
      `INSERT INTO ${tableName} (token_address, file_uri,text,creator,username,created_at) VALUES ($1, $2, $3,$4,$5,NOW())`,
      [token_address, file_uri,text,creator,username]
    );
  
   
    
    return new Response(JSON.stringify({ message: "Successful" }), { status: 200 });
  } catch (error) {
    console.log(error)
    return new Response(JSON.stringify({ error: 'Failed to add reply' }), { status: 500 });
  }
}