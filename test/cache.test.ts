// src/lib/cache.test.ts
import { fetchNativeTokenPrice, fetchAndCachePrice } from '../src/app/_utils/fetchAndCachePrice';
import dotenv from 'dotenv';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
dotenv.config();  // Load environment variables from .env file


jest.mock('../src/app/_services/upstashRedis', () => {
  const actualRedis = jest.requireActual('@upstash/redis');
  return {
    ...actualRedis,
    set: jest.fn(),
    get: jest.fn(),
    flushall: jest.fn(),
  };
});

describe('Caching Mechanism', () => {
  beforeAll(async () => {
    // Clear the Redis database before running tests
    await (redis.flushall as jest.Mock)();
  });

  afterAll(async () => {
    // Clean up after tests
    jest.clearAllMocks();
  });

  test('should fetch and cache price for sei', async () => {
    const mockPrice = 1.23;
    const mockResponse = { 'sei-network': { usd: mockPrice } };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse),
      })
    ) as jest.Mock;

    const price = await fetchNativeTokenPrice('sei');
    expect(price).toBe(mockPrice);

    expect(redis.set).toHaveBeenCalledWith(
      'nativeTokenPrice_sei',
      JSON.stringify(mockPrice),
    );
  });

  test('should fetch and cache price for ftm', async () => {
    const mockPrice = 0.56;
    const mockResponse = { fantom: { usd: mockPrice } };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse),
      })
    ) as jest.Mock;

    const price = await fetchNativeTokenPrice('ftm');
    expect(price).toBe(mockPrice);

    expect(redis.set).toHaveBeenCalledWith(
      'nativeTokenPrice_ftm',
      JSON.stringify(mockPrice),
    );
  });

  test('should update cache on consecutive fetchAndCachePrice calls', async () => {
    const initialPrice = 1.23;
    const newPrice = 2.23;

    // First call to fetchAndCachePrice with initialPrice
    const initialResponse = { 'sei-network': { usd: initialPrice } };
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(initialResponse),
      })
    ) as jest.Mock;

    await fetchAndCachePrice('sei');

    // Check the cached price after the first call
    let cachedPriceAfterFirstCall = await redis.get('nativeTokenPrice_sei');
    console.log(`Cached price after first call: ${cachedPriceAfterFirstCall}`);
    expect(cachedPriceAfterFirstCall).not.toBeNull();
    if (cachedPriceAfterFirstCall) {
      let cachedPrice = JSON.parse(cachedPriceAfterFirstCall as string);
      console.log(`Parsed cached price after first call: ${cachedPrice}`);
      expect(cachedPrice).toBe(initialPrice);
    }

    // Second call to fetchAndCachePrice with newPrice
    const newResponse = { 'sei-network': { usd: newPrice } };
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(newResponse),
      })
    ) as jest.Mock;

    await fetchAndCachePrice('sei');

    // Check the cached price after the second call
    const cachedPriceAfterSecondCall = await redis.get('nativeTokenPrice_sei');
    console.log(`Cached price after second call: ${cachedPriceAfterSecondCall}`);
    expect(cachedPriceAfterSecondCall).not.toBeNull();
    if (cachedPriceAfterSecondCall) {
      const cachedPrice = JSON.parse(cachedPriceAfterSecondCall as string);
      console.log(`Parsed cached price after second call: ${cachedPrice}`);
      expect(cachedPrice).toBe(newPrice);
    }
  });
});