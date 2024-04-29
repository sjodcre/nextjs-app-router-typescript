


import { query } from '../../db';


export  async function POST(req: Request) {
 

  try {
    const url = new URL(req.url)
    const data = await req.json();
    const chain= url.searchParams.get("chain")
    const id= url.searchParams.get("id")
    const { username} = data;
    // Update token data in the database

    const existingUser = await query(
        `SELECT * FROM profile_${chain} WHERE username = '${username}'`,
        []
      );
  
      if (existingUser.length > 0) {
        return new Response(JSON.stringify('Username already exists'), { status: 400});
      }

    await query(
      `UPDATE profile_${chain} SET username = '${username}' WHERE walletaddress = '${id}'`,
      []
    );
    
    return new Response(JSON.stringify('Username Updated'), { status: 200});
    
  } catch (error) {
   
    return new Response(JSON.stringify('Error'), { status: 500 });
    //res.status(500).json({ message: 'Internal server error' });
  }
}
