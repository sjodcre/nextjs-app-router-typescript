// // src/app/api/update-holders/route.tsx
// import { query } from "../../db";

// export async function POST(req: Request) {
//   try {
//     const data = await req.json();
//     const { tokenAddress, from, to, value } = data;

//     // Validate inputs
//     if (!tokenAddress || !from || !to || typeof value !== 'number') {
//       return new Response(JSON.stringify({ error: 'Invalid input data' }), { status: 400 });
//     }

//     // Update balance for the sender (from)
//     await updateBalance(tokenAddress, from, -value);

//     // Update balance for the receiver (to)
//     await updateBalance(tokenAddress, to, value);

//     return new Response(JSON.stringify({ message: 'Balances updated successfully.' }), { status: 201 });
//   } catch (error) {
//     console.error('Error updating balances:', error);
//     return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
//   }
// }

// async function updateBalance(tokenAddress: string, account: string, delta: number) {
//   // const result = await query(
//   //   `SELECT balance FROM token_balances_sei WHERE account = $1 AND token_address = $2`,
//   //   [account, tokenAddress]
//   // );
//   const result = await query(
//     `SELECT balance FROM sei_users_balance WHERE account = $1 AND token_address = $2`,
//     [account, tokenAddress]
//   );

//   let currentBalance = result.length > 0 ? result[0].balance : 0;
//   let newBalance = currentBalance + delta;

//   if (currentBalance === 0) {
//     // await query(
//     //   `INSERT INTO token_balances_sei (account, token_address, balance) VALUES ($1, $2, $3)`,
//     //   [account, tokenAddress, newBalance]
//     // );
//     await query(
//       `INSERT INTO sei_users_balance (account, token_address, balance) VALUES ($1, $2, $3)`,
//       [account, tokenAddress, newBalance]
//     );
//   } else {
//     // await query(
//     //   `UPDATE token_balances_sei SET balance = $1 WHERE account = $2 AND token_address = $3`,
//     //   [newBalance, account, tokenAddress]
//     // );
//     await query(
//       `UPDATE sei_users_balance SET balance = $1 WHERE account = $2 AND token_address = $3`,
//       [newBalance, account, tokenAddress]
//     );

//   }
// }


// // // src/app/api/update-holders/route.tsx
// // import { NextResponse } from 'next/server';
// // import { ethers } from 'ethers';

// // // Set up your Ethereum provider
// // const provider = new ethers.providers.JsonRpcProvider('https://fantom-rpc.publicnode.com/');

// // // Function to get token balance for a given address
// // async function getTokenBalance(tokenContract: ethers.Contract, address: string) {
// //   const balance = await tokenContract.balanceOf(address);
// //   return balance.toString();
// // }

// // // Function to get the list of token holders (replace with actual logic to get holders' addresses)
// // async function getHolders() {
// //   // Replace this with actual logic to fetch the holders' addresses
// //   return ['0xf759c09456A4170DCb5603171D726C3ceBaDd3D5'];
// // }

// // // Function to update holders' balances
// // async function updateHoldersBalances(tokenAddress: string) {
// //   const tokenABI = ['function balanceOf(address account) view returns (uint256)'];
// //   const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);
// //   const holders = await getHolders();
// //   const balances = await Promise.all(holders.map(holder => getTokenBalance(tokenContract, holder)));

// //   // Construct the response with holders and their balances
// //   const holdersBalances = holders.map((holder, index) => ({
// //     address: holder,
// //     balance: balances[index],
// //   }));

// //   return holdersBalances;
// // }

// // export async function POST(req: Request) {
// //   try {
// //     const { tokenAddress } = await req.json();
// //     if (!tokenAddress) {
// //       return NextResponse.json({ error: 'Token address is required' }, { status: 400 });
// //     }

// //     const holdersBalances = await updateHoldersBalances(tokenAddress);
// //     return NextResponse.json(holdersBalances);
// //   } catch (error) {
// //     console.error('Error updating holders balances:', error);
// //     return NextResponse.json({ error: 'Failed to update holders balances' }, { status: 500 });
// //   }
// // }

