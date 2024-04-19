// api/tokens.js

import { query } from "@/utils/db";
import { NextApiRequest, NextApiResponse } from "next";

 // Import your database query function

export default async function handler(req :NextApiRequest, res :NextApiResponse) {
  try {
    const { sortBy, order } = req.query;

    let orderByClause = '';
  
    // Determine the order by clause based on sortBy and order parameters
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
        orderByClause = `ORDER BY datetime   ${order}`;
      }
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

 ${orderByClause}`, []);

    res.status(200).json(queryResult);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
