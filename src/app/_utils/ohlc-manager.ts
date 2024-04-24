interface OHLC {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    startTime: number;
  }
  
  const ohlcStorage: Record<number, OHLC> = {};
  
  export const updateOHLC = (price: number, timestamp: number) => {
    const timeFrame = 3600000; // 1 hour
    const currentPeriod = Math.floor(timestamp / timeFrame) * timeFrame;
  
    if (!ohlcStorage[currentPeriod]) {
        ohlcStorage[currentPeriod] = {
          open: price,
          high: price,
          low: price,
          close: price,
          volume: 0,
          startTime: currentPeriod
        };
      } else {
        const currentOHLC = ohlcStorage[currentPeriod];
        currentOHLC.high = Math.max(currentOHLC.high, price);
        currentOHLC.low = Math.min(currentOHLC.low, price);
        currentOHLC.close = price;
      }

  };