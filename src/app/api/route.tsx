
import { query } from "./db";


export async function GET(req: Request) {

    const url = new URL(req.url)

    const sortBy = url.searchParams.get("sortBy")
    const order = url.searchParams.get("order")
    const chain = url.searchParams.get("chain")

    let orderByClause = '';
    if (sortBy && order) {
        if (sortBy === 'lastUpdatedTime') {
            orderByClause = `ORDER BY timestamp ${order}`;
        } else if (sortBy === 'lastReplyTime') {
            orderByClause = `ORDER BY lastreply ${order}`;
        } else if (sortBy === 'replies') {
            orderByClause = `ORDER BY repliescount ${order}`;
        } else if (sortBy === 'marketcap') {
            orderByClause = `ORDER BY marketcap ${order}`;
        } else if (sortBy === 'creationTime') {
            orderByClause = `ORDER BY datetime ${order}`;
        }

        const queryResult = await query(`
                    SELECT
                    tl.token_ticker,
                    tl.token_name,
                    tl.token_address,
                    tl.creator,
                    tl.DateTime,
                    tl.Image_URL,
                    tl.token_Description,
                    th.timestamp,
                    p.username
                    FROM token_list_${chain} tl
                    JOIN transaction_history_${chain} th ON tl.token_address = th.token_address
                    JOIN Profile_${chain} p ON tl.Creator = p.walletaddress
                ${orderByClause}
              `, []);

              

        return new Response(JSON.stringify(queryResult), {
            status: 200

        })

    }
}

