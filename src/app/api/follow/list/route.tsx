import logger from '@/app/_utils/logger';
import { query } from '../../db';

export async function GET(req: Request, route: { params: { id: string } }) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const chain = url.searchParams.get("chain");
    logger.info("getting follower/wee list", {id})

    // Fetch followers with their usernames
    const followerlist = await query(`
      SELECT 
        f.follower,
        p.username AS follower_username,
        (SELECT COUNT(*) FROM follow_${chain} WHERE followee = f.follower) AS follower_count
      FROM follow_${chain} f
      JOIN profile_${chain} p ON f.follower = p.account
      WHERE f.followee = $1`, [id]);

    // Fetch followees with their usernames
    const followeelist = await query(`
      SELECT 
        f.followee,
        p.username AS followee_username,
        (SELECT COUNT(*) FROM follow_${chain} WHERE followee = f.followee) AS followee_count
      FROM follow_${chain} f
      JOIN profile_${chain} p ON f.followee = p.account
      WHERE f.follower = $1`, [id]);

    const responseData = {
      followerlist: followerlist,
      followeelist: followeelist,
    };

    return new Response(JSON.stringify(responseData), { status: 200 });

  } catch (error) {
    // console.error('Error fetching profile:', error);
    logger.error('Error fetching follower/wee list:', {error});
    return new Response(JSON.stringify('Internal Server Error'), { status: 500 });
  }
}
