// import { query } from "../db";

// export async function GET(req: Request) {
//   const url = new URL(req.url)

//   const id = url.searchParams.get("id")
//   const chain = url.searchParams.get("chain")

//   const tableName = `profile_${chain}`;

//   const sql2 = `SELECT * FROM ${tableName} WHERE account = $1`;
//   const existing = await query(sql2, [id]);
//   try {

//     if (existing.length === 0) {

//       const sql3 = `INSERT INTO ${tableName} (account,username) VALUES ($1,$1)`;
//       await query(sql3, [id]);
//       // console.log("added ")
//       return new Response(JSON.stringify({ message: 'Init' }), { status: 201 });
//     }
//     return new Response(JSON.stringify({ message: 'Exist' }), { status: 201 });

//   }

//   catch (error) {
//     console.log(error)
//     return new Response(JSON.stringify(error), { status: 500 });
//     //res.status(500).json({ message: 'Internal server error' });
//   }
// }


// import logger from "@/app/_utils/logger";
import { query } from "../db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const chain = url.searchParams.get("chain");
  const tableName = `profile_${chain}`;

  // logger.info('initiating profile', id)
  
  const sql2 = `SELECT * FROM ${tableName} WHERE account = $1`;
  const existing = await query(sql2, [id]);

  try {
    let username;

    if (existing.length === 0) {
      const sql3 = `INSERT INTO ${tableName} (account, username) VALUES ($1, $1) RETURNING username`;
      const result = await query(sql3, [id]);
      username = result[0].username;
      // logger.info('user profile initiated')
      return new Response(JSON.stringify({ message: 'Init', username }), { status: 201 });
    } else {
      username = existing[0].username;
      // logger.info('user profile already exists ')
      return new Response(JSON.stringify({ message: 'Exist', username }), { status: 200 });
    }
  } catch (error) {
    // console.log(error);
    // logger.error('Error initializing user profile', {error})
    return new Response(JSON.stringify(error), { status: 500 });
  }
}
