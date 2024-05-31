import { query } from '../../db';



export async function GET(req: Request, route: { params: { id: string } }) {
  try {

    const url = new URL(req.url)
    //follower = people that is following
    //followee = people that is being followed
    const id = url.searchParams.get("id")
    const chain =url.searchParams.get("chain")
    

    // const id = route.params.id;
    // Check if profile is being followed by xxx
    const followerlist = await query(`
    SELECT 
    f.follower,
    (SELECT COUNT(*) FROM follow_${chain} WHERE followee = f.follower) AS follower_count
    FROM follow_${chain} f
    WHERE f.followee = '${id}'`, []);

    const followeelist = await query(`
    SELECT 
    f.followee,
    (SELECT COUNT(*) FROM follow_${chain} WHERE followee = f.followee) AS followee_count
FROM follow_${chain} f
WHERE f.follower = '${id}'`, []);

   



    const responseData = {
      followerlist: followerlist,
      followeelist: followeelist,
    };

    return new Response(JSON.stringify(responseData), { status: 200 });

  } catch (error) {
    console.error('Error fetching profile:', error);
    // If an error occurs during fetching, return a 500 status code
    return new Response(JSON.stringify('Internal Server Error'), { status: 500 });
  }
}

