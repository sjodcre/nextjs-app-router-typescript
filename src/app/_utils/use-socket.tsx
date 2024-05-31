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

function getNextFiveMinuteBarTime(barTime: any) {
  const date = new Date(barTime.time);
  date.setMinutes(date.getMinutes() + 5); // Increment by 5 minutes
  return date.getTime() / 1000;
}

// function getNextThirtyMinuteBarTime(barTime: number) {
//   const date = new Date(barTime * 1000);
//   date.setMinutes(date.getMinutes() + 30); // Increment by 30 minutes
//   return date.getTime() / 1000;
// }

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

    socket.on('refresh', (data: { chartResolution: number; deposit: string; amount: string; timestamp: string; token_description: string; token_ticker: any; token_name: any; }) => {
      console.log('[socket] Message at refresh:', data);

      // const tradePrice = parseFloat(tradePriceStr);
      // const tradeTime = parseInt(tradeTimeStr);
      const tradePrice = parseFloat(data.deposit) / parseFloat(data.amount);
      const tradeTime = parseInt(data.timestamp);

      // const channelString = `0~${exchange}~${fromSymbol}~${toSymbol}`;
      let descriptionSnippet = data.token_description.substring(0, 10);
      const channelString = `0~${data.token_ticker}~${data.token_name}~${descriptionSnippet}`;

      const subscriptionItem = channelToSubscription.get(channelString);
      console.log("subscriptionItem", subscriptionItem)
      if (subscriptionItem === undefined) {
          return;
      }
      const lastBar = subscriptionItem.lastBar;
      // const lastFiveMinsBar = subscriptionItem.lastDailyBar;
      console.log("lastBar", lastBar)
      let nextBarTime = getNextFiveMinuteBarTime(lastBar);

      // let nextBarTime;
      // if (data.chartResolution ===5){
      //   nextBarTime = getNextFiveMinuteBarTime(lastBar);

      // } else if (data.chartResolution ===30){
      //   nextBarTime = getNextThirtyMinuteBarTime(lastBar);

      // } else {
      //   nextBarTime = getNextFiveMinuteBarTime(lastBar);

      // }
      // const nextDailyBarTime = getNextDailyBarTime(lastDailyBar.time);
      // const nextFiveMinsBarTime = getNextFiveMinuteBarTime(lastFiveMinsBar);
      console.log("nextFiveMinsBarTime", nextBarTime)
      console.log("tradeTime", tradeTime)
      let bar;
      if (tradeTime >= nextBarTime) {
          bar = {
              time: nextBarTime*1000,
              open: tradePrice,
              high: tradePrice,
              low: tradePrice,
              close: tradePrice,
          };
          console.log('[socket] Generate new bar', bar);
      } else {
          bar = {
              ...lastBar,
              high: Math.max(lastBar.high, tradePrice),
              low: Math.min(lastBar.low, tradePrice),
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
  const disconnectSoc = () => {
    socket.disconnect();
  };

  return {
    isSocketConnected,
    transport,
    emitEvent,
    onEvent,
    offEvent,
    disconnectSoc,
  };
};


export function subscribeOnStream(
  symbolInfo:LibrarySymbolInfo,
  resolution: ResolutionString,
  onRealtimeCallback:SubscribeBarsCallback ,
  subscriberUID: string,
  onResetCacheNeededCallback: () => void,
  lastBar: any
)
{
  // if (symbolInfo.base_name) {
  //     console.log(symbolInfo.base_name[0])
  // }
  // console.log("symbolInfo", symbolInfo)
  // console.log(symbolInfo.description)
  // console.log(symbolInfo.ticker)
  const parsedSymbol = parseFullSymbol(`${symbolInfo.exchange}:${symbolInfo.name}`);
  // console.log("description", symbolInfo?.description)
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
      lastBar,
      handlers: [handler],
  };
  channelToSubscription.set(channelString, subscriptionItem);
  socket.emit('SubAdd', { subs: [channelString] });

  console.log('[subscribeBars]: Subscribe to streaming. Channel:', channelString);
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