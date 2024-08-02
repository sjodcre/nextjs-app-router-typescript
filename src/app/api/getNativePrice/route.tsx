import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const chain = url.searchParams.get("chain");

        if (!chain) {
            return new Response(JSON.stringify({ error: 'Invalid chain parameter' }), { status: 400 });
        }

        const cacheKey = `nativeTokenPrice_${chain}`;
        const cachedPrice = await redis.get(cacheKey);

        if (cachedPrice) {
            return new Response(JSON.stringify({ price: JSON.parse(cachedPrice as string) }), { status: 200 });
        } else {
            return new Response(JSON.stringify({ error: 'Price not found in cache' }), { status: 404 });
        }
    } catch (error) {
        console.error('Error fetching native token price from cache:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}