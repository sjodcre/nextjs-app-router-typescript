


import { user } from '@/app/_redux/features/user-slice';
import { query } from '../../db';
import logger from '@/app/_utils/logger';


export async function POST(req: Request) {

  try {
    const url = new URL(req.url)
    const data = await req.json();
    const chain = url.searchParams.get("chain")
    const id = url.searchParams.get("id")
    logger.info('updating user profile', {id})

    const { username, bio } = data;
    // Update token data in the database

    const existingUser = await query(
      `SELECT * FROM profile_${chain} WHERE username = '${username}'`,
      []
    );

    if (id !== username) {
      if (existingUser.length > 0) {
        logger.warn('username already exists')
        return new Response(JSON.stringify('Username already exists'), { status: 400 });
      }

      if (username == '' && bio !='') {
        await query(
          `UPDATE profile_${chain} SET bio = '${bio}' WHERE account = '${id}'`, []
        );
        logger.info('user username updated')
        return new Response(JSON.stringify('Updated Bio'), { status: 201 });
      }
      else if (bio == '' && username != '') {
        await query(
          `UPDATE profile_${chain} SET username = '${username}' WHERE account = '${id}'`, []
        );
        logger.info('user bio updated')
        return new Response(JSON.stringify('Updated Username'), { status: 202 });
      } else if (bio && username !== null) {
        await query(
          `UPDATE profile_${chain} SET username = '${username}' , bio = '${bio}' WHERE account = '${id}'`, []
        );
  
        logger.info('user username and bio updated')
        return new Response(JSON.stringify('Updated'), { status: 200 });
  
      }
    }

    


    return new Response(JSON.stringify(''), { status: 200 });

  } catch (error) {
    logger.error('error updating user profile', {error})
    return new Response(JSON.stringify('Error' + error), { status: 500 });
    //res.status(500).json({ message: 'Internal server error' });
  }
}
