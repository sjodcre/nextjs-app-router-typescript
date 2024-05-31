import { query } from "../db";






export async function GET(req: Request) {
  const url = new URL(req.url)

  const id = url.searchParams.get("id")
  const chain = url.searchParams.get("chain")

  const tableName = `profile_${chain}`;




  const sql2 = `SELECT * FROM ${tableName} WHERE account = $1`;
  const existing = await query(sql2, [id]);
  try {

    if (existing.length === 0) {

      const sql3 = `INSERT INTO ${tableName} (account,username) VALUES ($1,$1)`;
      await query(sql3, [id]);
      console.log("added ")
      return new Response(JSON.stringify({ message: 'Init' }), { status: 201 });
    }
    return new Response(JSON.stringify({ message: 'Exist' }), { status: 201 });

  }




  catch (error) {
    console.log(error)
    return new Response(JSON.stringify(error), { status: 500 });
    //res.status(500).json({ message: 'Internal server error' });
  }
}
