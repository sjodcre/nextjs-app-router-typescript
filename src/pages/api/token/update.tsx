// pages/api/token/update.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { tokenid, marketcap} = req.body;

  try {
    // Update token data in the database
    await query(
      `UPDATE tokenmarket SET marketcap = $1 WHERE tokenid = $2`,
      [marketcap, tokenid]
    );
    await query(
      `UPDATE tokenlist SET lastactivity = NOW() WHERE tokenid = $1`,
      [tokenid]
    );

    res.status(200).json({ message: 'Token updated successfully' });
  } catch (error) {
    console.error('Error updating token:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
