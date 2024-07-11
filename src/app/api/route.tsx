
import { query } from "./db";


export async function GET(req: Request) {

    const url = new URL(req.url)

    const sortBy = url.searchParams.get("sortBy")
    const order = url.searchParams.get("order")
    const chain = url.searchParams.get("chain")

    let orderByClause = '';
    if (sortBy && order) {
        if (sortBy === 'lastUpdatedTime') {
            orderByClause = `ORDER BY lt.transaction_timestamp ${order} NULLS LAST`;
        } else if (sortBy === 'lastReplyTime') {
            orderByClause = `ORDER BY latest_reply_timestamp ${order} NULLS LAST`;
        } else if (sortBy === 'replies') {
            orderByClause = `ORDER BY reply_count ${order} NULLS LAST`;
        } else if (sortBy === 'marketcap') {
            orderByClause = `ORDER BY lt.marketcap ${order} NULLS LAST`;
        } else if (sortBy === 'creationTime') {
            orderByClause = `ORDER BY tl.datetime ${order} NULLS LAST`;
        }

      
        // const queryResult = await query(`

        // WITH latest_transactions AS (
        //     SELECT 
        //         DISTINCT ON (th.token_address) 
        //         th.token_address,
        //         th.marketcap,
        //         to_timestamp(th.timestamp)::timestamp AS transaction_timestamp
        //         FROM 
        //         public.transaction_history_${chain} th
        //     ORDER BY 
        //         th.token_address, th.timestamp DESC
        // ),
        // latest_replies AS (
        //     SELECT 
        //         DISTINCT ON (r.token_address)
        //         r.id,
        //         r.token_address,
        //         r.file_uri,
        //         r.text,
        //         r.creator,
        //         r.created_at AS reply_timestamp
        //     FROM 
        //         public.replies_${chain} r
        //     ORDER BY 
        //         r.token_address, r.created_at DESC
        // )
        // SELECT 
        //     tl.token_address,
        //     tl.token_ticker,
        //     tl.token_name,
        //     tl.token_description,
        //     tl.image_url,
        //     tl.creator,
        //     tl.twitter,
        //     tl.telegram,
        //     tl.website,
        //     to_timestamp(tl.datetime)::timestamp AS token_datetime,
        //     lt.transaction_timestamp,
        //     lt.marketcap,
        //     lr.reply_timestamp AS latest_reply_timestamp,
        //     (SELECT COUNT(*) FROM public.replies_sei WHERE token_address = tl.token_address) AS reply_count
        // FROM 
        //     public.token_list_${chain} tl
        // LEFT JOIN 
        //     latest_transactions lt ON tl.token_address = lt.token_address
        // LEFT JOIN 
        //     latest_replies lr ON tl.token_address = lr.token_address
        //             ${orderByClause}
        //             `, []);

        const queryResult = await query(`

        WITH latest_transactions AS (
            SELECT 
                DISTINCT ON (th.token_address) 
                th.token_address,
                th.marketcap,
                to_timestamp(th.timestamp)::timestamp AS transaction_timestamp
                FROM 
                public.${chain}_transaction_history th
            ORDER BY 
                th.token_address, th.timestamp DESC
        ),
        latest_replies AS (
            SELECT 
                DISTINCT ON (r.token_address)
                r.id,
                r.token_address,
                r.file_uri,
                r.text,
                r.creator,
                r.created_at AS reply_timestamp
            FROM 
                public.replies_${chain} r
            ORDER BY 
                r.token_address, r.created_at DESC
        )
        SELECT 
            tl.token_address,
            tl.token_ticker,
            tl.token_name,
            tl.token_description,
            tl.image_url,
            tl.creator,
            tl.twitter,
            tl.telegram,
            tl.website,
            to_timestamp(tl.datetime)::timestamp AS token_datetime,
            lt.transaction_timestamp,
            lt.marketcap,
            lr.reply_timestamp AS latest_reply_timestamp,
            (SELECT COUNT(*) FROM public.replies_sei WHERE token_address = tl.token_address) AS reply_count
        FROM 
            public.token_list_${chain} tl
        LEFT JOIN 
            latest_transactions lt ON tl.token_address = lt.token_address
        LEFT JOIN 
            latest_replies lr ON tl.token_address = lr.token_address
                    ${orderByClause}
                    `, []);










        return new Response(JSON.stringify(queryResult), {
            status: 200

        })

    }
}

