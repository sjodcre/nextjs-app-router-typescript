// import logger from "@/app/_utils/logger";
import { query } from "../db";
import * as Sentry from '@sentry/nextjs';

export async function GET(req: Request) {
  const url = new URL(req.url)

  const tokenAddress = url.searchParams.get("token_address");
  // logger.info('getting trades for ftm', {tokenAddress})

  if (!tokenAddress) {
    // logger.warn('token address not provided')
    return new Response(JSON.stringify({ error: 'Token address is required' }), { status: 400 });
  }

  try {
  
    // const transactions = await query(`SELECT * FROM transaction_history_ftm WHERE token_address = $1 AND tx_status = 'successful' ORDER BY timestamp DESC`, [tokenAddress]);
    // const transactions = await query(`SELECT * FROM ftm_transaction_history WHERE token_address = $1 AND tx_status = 'successful' ORDER BY timestamp DESC`, [tokenAddress]);

    const sql = `
    SELECT t.*, p.username as account_username
    FROM ftm_transaction_history t
    LEFT JOIN profile_ftm p ON t.account = p.account
    WHERE t.token_address = $1 AND t.tx_status = 'successful'
    ORDER BY t.timestamp DESC`;

    const transactions = await query(sql, [tokenAddress]);

    return new Response(JSON.stringify(transactions), { status: 200 });
    
  } catch (error) {
    // console.error('Failed to fetch latest data time:', error);
    // logger.error('failed to get trades', {error})
    const comment = "failed to get trades"
    Sentry.captureException(error, { extra: { comment } });
    return new Response(JSON.stringify('Internal Server Error'+ error ), { status: 500 });
  }
}