// import redis from '../_services/upstashRedis';

// export async function fetchNativeTokenPrice(chain: string): Promise<number> {
//   let url = '';
//   let cacheKey = `nativeTokenPrice_${chain}`;

//   if (chain === "sei") {
//     url = 'https://api.coingecko.com/api/v3/simple/price?ids=sei-network&vs_currencies=usd';
//   } else if (chain === "ftm") {
//     url = 'https://api.coingecko.com/api/v3/simple/price?ids=fantom&vs_currencies=usd';
//   } else {
//     throw new Error("invalid url for native token price");
//   }

//   try {
//     const response = await fetch(url);
//     const data = await response.json();
//     console.log("cachedKey is what?", cacheKey)
//     const price = chain === "sei" ? data['sei-network'].usd : data['fantom'].usd;
//     console.log(`Fetched price for ${chain}:`, price);
//     await redis.set(cacheKey, JSON.stringify(price)); // Cache for 4 hours
//     console.log(`Cached price for ${chain}:`, price);
//     return price;
//   } catch (error) {
//     console.error('Failed to fetch native token price:', error);
//     throw new Error('Failed to fetch native token price');
//   }
// }

// export async function fetchAndCachePrice(chain: string): Promise<void> {
//   try {
//     await fetchNativeTokenPrice(chain);
//     console.log(`Price for ${chain} updated and cached.`);
//   } catch (error) {
//     console.error(`Failed to update and cache price for ${chain}:`, error);
//   }
// }


// src/app/_utils/fetchAndCachePrice.ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function fetchNativeTokenPrice(chain: string): Promise<number> {
    let url = '';
    if (chain === "sei") {
        url = 'https://api.coingecko.com/api/v3/simple/price?ids=sei-network&vs_currencies=usd';
    } else if (chain === "ftm") {
        url = 'https://api.coingecko.com/api/v3/simple/price?ids=fantom&vs_currencies=usd';
    } else {
        throw new Error("invalid url for native token price");
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        const price = chain === "sei" ? data['sei-network'].usd : data['fantom'].usd;
        return price;
    } catch (error) {
        console.error('Failed to fetch native token price:', error);
        throw new Error('Failed to fetch native token price');
    }
}

export async function fetchAndCachePrice(chain: string): Promise<void> {
    const cacheKey = `nativeTokenPrice_${chain}`;
    const price = await fetchNativeTokenPrice(chain);
    await redis.set(cacheKey, JSON.stringify(price), { ex: 14400 }); // Cache for 4 hours
    console.log(`Price for ${chain} updated and cached: ${price}`);
}
