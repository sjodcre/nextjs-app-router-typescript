// import logger from "@/app/_utils/logger";
import { query } from "../db";
import * as Sentry from '@sentry/nextjs';




export async function GET(req: Request) {
// logger.info('getting top token')
try {
    const queryResult = await query(`
    WITH recent_trades AS (
        SELECT 
            th.token_address,
            th.marketcap,
            to_timestamp(th.timestamp)::timestamp AS trade_timestamp
        FROM 
            public.ftm_transaction_history th
        WHERE 
            th.timestamp >= extract(epoch from (now() - interval '24 hours'))
            AND th.marketcap IS NOT NULL
        ORDER BY 
            th.marketcap DESC
    ),
    reply_count AS (
        SELECT 
            token_address, 
            COUNT(*) AS reply_count
        FROM 
            public.replies_ftm
        GROUP BY 
            token_address
    )
    SELECT 
        rt.token_address,
        tl.token_ticker,
        tl.token_name,
        tl.token_description,
        tl.creator,
        tl.image_url,
        rt.marketcap,
        rt.trade_timestamp,
        rc.reply_count
    FROM 
        recent_trades rt
    LEFT JOIN 
        public.token_list_ftm tl ON rt.token_address = tl.token_address
    LEFT JOIN 
        reply_count rc ON rt.token_address = rc.token_address
    ORDER BY 
        rt.marketcap DESC
        Limit 1
        `, []);


        return new Response(JSON.stringify(queryResult), {
            status: 200

        })
    } catch (error) {
        Sentry.captureException(error)
        return new Response(JSON.stringify(error), { status: 500 });
    }

}
