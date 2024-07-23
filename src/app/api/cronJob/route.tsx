import { fetchAndCachePrice } from '../../_utils/fetchAndCachePrice'

export async function POST(req: Request) {
  try {
      const url = new URL(req.url);
      const chain = url.searchParams.get("chain");

      if (!chain) {
          return new Response(JSON.stringify({ error: 'Invalid chain parameter' }), { status: 400 });
      }

      await fetchAndCachePrice(chain);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
      console.error('Error in POST /api/cronJob:', error);
      return new Response(JSON.stringify({ error: 'Failed to update and cache price' }), { status: 500 });
  }
}
