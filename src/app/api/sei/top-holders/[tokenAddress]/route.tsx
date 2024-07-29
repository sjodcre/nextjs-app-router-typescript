// import logger from "@/app/_utils/logger";
import { query } from "@/app/api/db";
import * as Sentry from '@sentry/nextjs';




export async function GET(req: Request, route: { params: { tokenAddress: string } }) {
// export async function GET(req: NextApiRequest, res: NextApiResponse) {

  try {
    // console.log("req.query", req.url
    const tokenAddress = route.params.tokenAddress as string;
    // logger.info('fetching top holders info sei', tokenAddress)
    // console.log("tokenAddr", tokenAddress)
    // const id = route.params.id;
    // Fetch token data based on the ID from the database using parameterized query
    // console.log("id for top holders", id)
    // const holders = await query("SELECT account, balance FROM token_balances_sei WHERE token_address = $1 ORDER BY balance DESC LIMIT 20", [tokenAddress]);
    // const holders = await query("SELECT account, balance FROM sei_users_balance WHERE token_address = $1 ORDER BY balance::NUMERIC DESC LIMIT 20", [tokenAddress]);
    const sql = `
    SELECT ub.account, ub.balance, p.username
    FROM sei_users_balance ub
    LEFT JOIN profile_sei p ON ub.account = p.account
    WHERE ub.token_address = $1
    ORDER BY ub.balance::NUMERIC DESC
    LIMIT 20`;

  const holders = await query(sql, [tokenAddress]);
    
    return new Response(JSON.stringify(holders), { status: 200 });
    // res.status(200).json(holders);

  } catch (error) {
    // logger.error('Error fetching top holders sei', {error})
    // console.error('Error fetching token:', error);
    Sentry.captureException(error)
    return new Response(JSON.stringify('Internal Server Error'), { status: 500 });
    // res.status(500).json({ message: 'Internal Server Error' });

  }
}