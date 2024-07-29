// import logger from "@/app/_utils/logger";
import { query } from "../db";
import * as Sentry from '@sentry/nextjs';

type ResolutionMap = {
  '1': number;
  '5': number;
  '30': number;
  '60': number;
  'D': number;
}

export async function GET(req: Request) {
  try {

    const url = new URL(req.url)
    const token_address = url.searchParams.get("token_address");
    // logger.info('getting ohlc data ftm', {token_address})

    const resolution = url.searchParams.get("resolution") || '';
    const from = url.searchParams.get("from") || '';
    const to = url.searchParams.get("to") || '';
    // const { resolution, from, to, token_address } = req.query as Record<string, string>;
    let sql = '';
    let queryParams = [];
    const secondsMap: ResolutionMap = { '1': 60, '5': 300, '30': 1800, '60': 3600, 'D': 86400 };
    const interval = secondsMap[resolution as keyof ResolutionMap];
    const tableName ='ohlc_ftm'; // Default table name, adjust as needed

    if (['1', '5', '30', '60'].includes(resolution)) {
      sql = `
        WITH ranked_data AS (
          SELECT *,
            ROW_NUMBER() OVER (PARTITION BY FLOOR(time / $1), token_address ORDER BY time ASC) as rn_asc,
            ROW_NUMBER() OVER (PARTITION BY FLOOR(time / $1), token_address ORDER BY time DESC) as rn_desc
          FROM ${tableName}
          WHERE time >= $2 AND time <= $3 AND token_address = $4
        )
        SELECT 
          FLOOR(time / $1) * $1 as bucket,
          token_address,
          MAX(high) as high,
          MIN(low) as low,
          MAX(CASE WHEN rn_asc = 1 THEN open ELSE NULL END) as open,
          MAX(CASE WHEN rn_desc = 1 THEN close ELSE NULL END) as close,
          MAX(time) as time
        FROM ranked_data
        GROUP BY 1, token_address
      `;
      queryParams = [interval, from, to, token_address];
    } else {
      sql = `SELECT * FROM ${tableName} WHERE time >= $1 AND time <= $2 AND token_address = $3`;
      queryParams = [from, to, token_address];
    }

    const rows = await query(sql, queryParams);
    return new Response(JSON.stringify(rows), { status: 200 });
  } catch (error) {
    // logger.error('Error getting ohlc data ftm', {error})
    // console.error('Error fetching data:', error);
    Sentry.captureException(error)
    return new Response(JSON.stringify('Internal Server Error'), { status: 500 });
  }
}