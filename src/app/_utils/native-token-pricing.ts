export async function fetchSEIPrice(): Promise<number> {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=sei-network&vs_currencies=usd';
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data['sei-network'].usd; // Adjust according to the actual ID and response structure
    } catch (error) {
        console.error('Failed to fetch SEI price:', error);
        throw new Error('Failed to fetch SEI price');
    }
}