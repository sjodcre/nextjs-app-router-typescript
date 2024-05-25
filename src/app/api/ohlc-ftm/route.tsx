import { query } from "../db";


type ResolutionMap = {
  '1': number;
  '5': number;
  '30': number;
  '60': number;
  'D': number;
};


export async function GET(req: Request) {
  try {

    const data = await req.json() as Record<string, string>;
    let sql = '';
    const { resolution, from, to, token_address } = data; 
    let queryParams = [];
    const secondsMap:  ResolutionMap= { '1': 60, '5': 300, '30': 1800, '60': 3600 , 'D': 86400};
    const interval = secondsMap[resolution as keyof ResolutionMap];  // This tells TypeScript the resolution is definitely one of the keys in secondsMap.
    
    const tableName ='ohlc_ftm'; // Default to 'ohlc_sei' if chainid is not 2


    if (['1', '5', '30', '60'].includes(resolution)) {
    
        sql = `
        SELECT 
            ROUND(time / $1) * $2 as bucket,
            token_address,
            MAX(high) as high, 
            MIN(low) as low,
            (SELECT open FROM ${tableName} WHERE ROUND(time / $3) = ROUND(t.time / $4) AND token_address = t.token_address ORDER BY time ASC LIMIT 1) as open,
            (SELECT close FROM ${tableName} WHERE ROUND(time / $5) = ROUND(t.time / $6) AND token_address = t.token_address ORDER BY time DESC LIMIT 1) as close,
            MAX(time) as time
        FROM ${tableName} t
        WHERE time >= $7 AND time <= $8 AND token_address = $9
        GROUP BY ROUND(time / $10), token_address
        `;


        queryParams = [
            interval, interval, // for bucket
            interval, interval, // for open
            interval, interval, // for close
            parseInt(from), parseInt(to), token_address, // for time range and tokenid
            interval // for GROUP BY
        ];
        // queryParams.push(interval);
    } else {
        // Direct selection for daily and weekly without aggregation
        sql = `SELECT * FROM ${tableName} WHERE time >= $1 AND time <= $2 AND token_address = $3`;
        queryParams = [parseInt(from), parseInt(to), token_address];
        // query = 'SELECT * FROM ohlc WHERE time >= ? AND time <= ?';
    }





    const rows = await query(sql, queryParams);
    



    // If a token is found, return it as a JSON response with a 200 status code
    return new Response(JSON.stringify(rows), { status: 200 });
  } catch (error) {
    console.error('Error fetching coin:', error);
    // If an error occurs during fetching, return a 500 status code
    return new Response(JSON.stringify('Internal Server Error'), { status: 500 });
  }
}