import { query } from '../../db';






export async function GET(req: Request, route: { params: { id: string } }) {
  try {

    const url = new URL(req.url)
//follower = people that is following
//followee = people that is being followed
    const followee= url.searchParams.get("followee")
    const follower= url.searchParams.get("follower")
    const chain =url.searchParams.get("chain")
   // const id = route.params.id;
    // Check if profile is being followed by xxx
    const isfollow = await query(`
    SELECT followee
    FROM follow_${chain}
      where follower = '${follower}' and followee = '${followee}'
    `, []);

    if (isfollow.length !== 0) {
       // If following
       return new Response(JSON.stringify({ message: 'Is Following'}), { status: 201 });
  
    }
      // If not followung, return a 404 status code
      return new Response(JSON.stringify({ message: 'Not Follower' }), { status: 202 });
    
  } catch (error) {
    console.error('Error fetching profile:', error);
    // If an error occurs during fetching, return a 500 status code
    return new Response(JSON.stringify('Internal Server Error'), { status: 500 });
  }
}





export async function POST(req: Request) {


  try {
    const url = new URL(req.url)

    const followee= url.searchParams.get("followee")
    const follower= url.searchParams.get("follower")
    const chain =url.searchParams.get("chain")
    // Update token data in the database

    const isfollow = await query(`
    SELECT followee
    FROM follow_${chain}
    where follower = '${follower}' and followee = '${followee}'
    `, []);

    if (isfollow.length === 0) {
      
      const sql3 = `INSERT INTO follow_${chain}(follower,followee,timestamp) VALUES ($1,$2,NOW())`;
      await query(sql3, [follower,followee]);
      return new Response(JSON.stringify({ message: 'Followed'}), { status: 201 });
 
   }else{
   
    const sql3 = `DELETE FROM follow_${chain} WHERE follower = $1 AND followee = $2;`;
    await query(sql3, [follower,followee]);
    return new Response(JSON.stringify({ message: 'Unfollowed'}), { status: 202 });

   }


  } catch (error) {

    return new Response(JSON.stringify('Error' + error), { status: 500 });
    //res.status(500).json({ message: 'Internal server error' });
  }
}
