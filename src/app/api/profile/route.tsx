import { query } from "../db";




export async function GET(req: Request, route: { params: { id: string } }) {
  try {

    const url = new URL(req.url)

    const chain= url.searchParams.get("chain")
    const id= url.searchParams.get("id")
   // const id = route.params.id;
    // Fetch token data based on the ID from the database using parameterized query
    const profile = await query(`
    SELECT *
    FROM profile
      where account = '${id}'
    `, []);

    if (profile.length !== 0) {
       // If a token is found, return it as a JSON response with a 200 status code
    return new Response(JSON.stringify(profile[0]), { status: 200 });
      
    }

   // If no token is found with the specified ID, return a 404 status code
   return new Response(JSON.stringify({ message: 'Profile not found' }), { status: 404 });
    
  } catch (error) {
    console.error('Error fetching profile:', error);
    // If an error occurs during fetching, return a 500 status code
    return new Response(JSON.stringify('Internal Server Error'), { status: 500 });
  }
}