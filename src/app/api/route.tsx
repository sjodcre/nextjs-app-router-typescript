
import { query } from "./db";


export async function GET(req: Request) {

    const url = new URL(req.url)

    const sortBy = url.searchParams.get("sortBy")
    const order = url.searchParams.get("order")

    let orderByClause = '';
    if (sortBy && order) {
        if (sortBy === 'lastUpdatedTime') {
            orderByClause = `ORDER BY lastactivity ${order}`;
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
                  tl.TokenID,
                  tl.TokenSymbol,
                  tl.TokenName,
                  tl.TokenAddress,
                  tl.Creator,
                  tl.DateTime,
                  tl.ImageURL,
                  tl.LastActivity,
                  ti.Description,
                  tm.MarketCap,
                  tm.LastReply,
                  tm.RepliesCount
                FROM TokenList tl
                JOIN TokenMarket tm ON tl.TokenID = tm.TokenID
                JOIN TokenInfo ti ON tl.TokenID = ti.TokenID
                ${orderByClause}
              `, []);

        return new Response(JSON.stringify(queryResult), {
            status: 200

        })

    }
}

