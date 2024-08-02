// export async function fetchNativeTokenPrice(chain: string): Promise<number> {
//     let url = '';
//     // console.log(chain)
//     if (chain === "sei") {
//          url = 'https://api.coingecko.com/api/v3/simple/price?ids=sei-network&vs_currencies=usd';

//     } else if (chain === "ftm") {
//         url = 'https://api.coingecko.com/api/v3/simple/price?ids=fantom&vs_currencies=usd';
//     } else {
//         throw new Error ("invalid url for native token price")
//     }

//     try {
//         const response = await fetch(url);
//         const data = await response.json();
//         return chain ==="sei" ? data['sei-network'].usd : data['fantom'].usd; // Adjust according to the actual ID and response structure
//     } catch (error) {
//         console.error('Failed to fetch native token price:', error);
//         throw new Error('Failed to fetch native token price');
//     }
// }