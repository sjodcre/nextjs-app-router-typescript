// hooks/useSocket.tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { getSocket } from '../../socket';  // Adjust the path as necessary
import { LibrarySymbolInfo, ResolutionString, SubscribeBarsCallback } from 'public/static/charting_library/charting_library';
import { parseFullSymbol } from './helpers';
// import { parseFullSymbol } from './helpers';
const socket = getSocket();
interface EventListener {
    event: string;
    handler: (data: any) => void;
}

// function getNextDailyBarTime(barTime: number) {
//   const date = new Date(barTime * 1000);
//   date.setDate(date.getDate() + 1);
//   return date.getTime() / 1000;
// }

function getNextFiveMinuteBarTime(barTime: number) {
  const date = new Date(barTime * 1000);
  date.setMinutes(date.getMinutes() + 5); // Increment by 5 minutes
  return date.getTime() / 1000;
}

const channelToSubscription = new Map();

const useSocket = (listeners: EventListener[] = []) => {
  const [isSocketConnected, setIsSocketConnected] = useState(socket.connected);
  const [transport, setTransport] = useState<string>('');
  const listenersRef = useRef(listeners);


  useEffect(() => {
    listenersRef.current = listeners;
  }, [listeners]);


  useEffect(() => {
    const onConnect = () => {
        setIsSocketConnected(true);
      setTransport(socket.io.engine.transport.name);
      socket.io.engine.on("upgrade", (transport: { name: string; }) => {
        setTransport(transport.name);
      });
    };

    const onDisconnect = () => {
        setIsSocketConnected(false);
      setTransport('N/A');
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
// "selectedChain": "ftm",
    // "contractAddress": "0x1D144Ec1c7782d0c1Ec8816218EfbE4271770eB1",
    // "account": "0xf759c09456A4170DCb5603171D726C3ceBaDd3D5",
    // "status": "successful",
    // "amount": 40468786388071,
    // "deposit": 10000000000000000,
    // "timestamp": 1716625823,
    // "trade": "buy",
    // "txHash": "0xebb3fc27f430932ee895efdd98e5ae0f8dc114b52e3a0fb5270ad6205c0f08ec"

    socket.on('refresh', (data: { deposit: string; amount: string; timestamp: string; description: string; ticker: any; name: any; }) => {
      console.log('[socket] Message at refresh:', data);
      // const [
      //     eventTypeStr, // 0
      //     exchange, // Bitfinex
      //     fromSymbol, // BTC
      //     toSymbol, //USD
      //     ,
      //     ,
      //     tradeTimeStr, //1548837377
      //     ,
      //     tradePriceStr, //3504.1
      // ] = data.split('~');
  
      // if (parseInt(eventTypeStr) !== 0) {
      //     // Skip all non-trading events
      //     return;
      // }

      // const tradePrice = parseFloat(tradePriceStr);
      // const tradeTime = parseInt(tradeTimeStr);
      const tradePrice = parseFloat(data.deposit) / parseFloat(data.amount);
      const tradeTime = parseInt(data.timestamp);

      // const channelString = `0~${exchange}~${fromSymbol}~${toSymbol}`;
      let descriptionSnippet = data.description.substring(0, 10);
      const channelString = `0~${data.ticker}~${data.name}~${descriptionSnippet}`;

      const subscriptionItem = channelToSubscription.get(channelString);
      console.log("subscriptionItem", subscriptionItem)
      if (subscriptionItem === undefined) {
          return;
      }
      // const lastDailyBar = subscriptionItem.lastDailyBar;
      const lastFiveMinsBar = subscriptionItem.lastDailyBar;

      // const nextDailyBarTime = getNextDailyBarTime(lastDailyBar.time);
      const nextFiveMinsBarTime = getNextFiveMinuteBarTime(lastFiveMinsBar);
      let bar;
      if (tradeTime >= nextFiveMinsBarTime) {
          bar = {
              time: nextFiveMinsBarTime,
              open: tradePrice,
              high: tradePrice,
              low: tradePrice,
              close: tradePrice,
          };
          console.log('[socket] Generate new bar', bar);
      } else {
          bar = {
              ...lastFiveMinsBar,
              high: Math.max(lastFiveMinsBar.high, tradePrice),
              low: Math.min(lastFiveMinsBar.low, tradePrice),
              close: tradePrice,
          };
          console.log('[socket] Update the latest bar by price', tradePrice);
      }
      // let bar = {
      //     ...lastDailyBar,
      //     high: Math.max(lastDailyBar.high, tradePrice),
      //     low: Math.min(lastDailyBar.low, tradePrice),
      //     close: tradePrice,
      // };
      // console.log('[socket] Update the latest bar by price', tradePrice);


      subscriptionItem.lastDailyBar = bar;
  
      // Send data to every subscriber of that symbol
      subscriptionItem.handlers.forEach((handler: { callback: (arg0: any) => any; }) => handler.callback(bar));
  });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);

      listenersRef.current.forEach(({ event, handler }) => {
        socket.off(event, handler);
      });
    };
  }, []);

  const emitEvent = useCallback((event: string, data: any) => {
    socket.emit(event, data);
  }, []);

  const onEvent = useCallback((event: string, data: any) => {
    socket.on(event, data);
  }, []);

  const offEvent = useCallback((event: string, data: any) => {
    socket.off(event, data);
  }, []);

  return {
    isSocketConnected,
    transport,
    emitEvent,
    onEvent,
    offEvent,
  };
};


export function subscribeOnStream(
    symbolInfo:LibrarySymbolInfo,
    resolution: ResolutionString,
    onRealtimeCallback:SubscribeBarsCallback ,
    subscriberUID: string,
    onResetCacheNeededCallback: () => void,
    lastDailyBar: any
)
{
    // if (symbolInfo.base_name) {
    //     console.log(symbolInfo.base_name[0])

    // }
    // console.log("symbolInfo", symbolInfo)
    // console.log(symbolInfo.description)
    // console.log(symbolInfo.ticker)
    const parsedSymbol = parseFullSymbol(`${symbolInfo.exchange}:${symbolInfo.name}`);
    // const channelString = `0~${parsedSymbol?.exchange}~${parsedSymbol?.fromSymbol}~${parsedSymbol?.toSymbol}`;
    let descriptionSnippet = symbolInfo?.description.substring(0, 10);

    const channelString = `0~${symbolInfo?.ticker}~${symbolInfo?.name}~${descriptionSnippet}`;

    const handler = {
        id: subscriberUID,
        callback: onRealtimeCallback,
    };
    let subscriptionItem = channelToSubscription.get(channelString);
    if (subscriptionItem) {
        // Already subscribed to the channel, use the existing subscription
        subscriptionItem.handlers.push(handler);
        return;
    }
    subscriptionItem = {
        subscriberUID,
        resolution,
        lastDailyBar,
        handlers: [handler],
    };
    channelToSubscription.set(channelString, subscriptionItem);
    console.log('[subscribeBars]: Subscribe to streaming. Channel:', channelString);
    socket.emit('SubAdd', { subs: [channelString] });
}

export function unsubscribeFromStream(subscriberUID: string) {

    // Find a subscription with id === subscriberUID
    for (const channelString of channelToSubscription.keys()) {
        const subscriptionItem = channelToSubscription.get(channelString);
        const handlerIndex = subscriptionItem.handlers
            .findIndex((handler: { id: string; }) => handler.id === subscriberUID);

        if (handlerIndex !== -1) {
            // Remove from handlers
            subscriptionItem.handlers.splice(handlerIndex, 1);

            if (subscriptionItem.handlers.length === 0) {
                // Unsubscribe from the channel if it is the last handler
                console.log('[unsubscribeBars]: Unsubscribe from streaming. Channel:', channelString);
                socket.emit('SubRemove', { subs: [channelString] });
                channelToSubscription.delete(channelString);
                break;
            }
        }
    }
}

export default useSocket;