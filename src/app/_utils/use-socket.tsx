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

    // socket.on('refresh', data => {
    //     console.log('[socket] Message at refresh:', data);
    //     const [
    //         eventTypeStr,
    //         exchange,
    //         fromSymbol,
    //         toSymbol,
    //         ,
    //         ,
    //         tradeTimeStr,
    //         ,
    //         tradePriceStr,
    //     ] = data.split('~');
    
    //     if (parseInt(eventTypeStr) !== 0) {
    //         // Skip all non-trading events
    //         return;
    //     }
    //     const tradePrice = parseFloat(tradePriceStr);
    //     const tradeTime = parseInt(tradeTimeStr);
    //     const channelString = `0~${exchange}~${fromSymbol}~${toSymbol}`;
    //     const subscriptionItem = channelToSubscription.get(channelString);
    //     console.log("subscriptionItem", subscriptionItem)
    //     if (subscriptionItem === undefined) {
    //         return;
    //     }
    //     const lastDailyBar = subscriptionItem.lastDailyBar;
    //     let bar = {
    //         ...lastDailyBar,
    //         high: Math.max(lastDailyBar.high, tradePrice),
    //         low: Math.min(lastDailyBar.low, tradePrice),
    //         close: tradePrice,
    //     };
    //     console.log('[socket] Update the latest bar by price', tradePrice);
    //     subscriptionItem.lastDailyBar = bar;
    
    //     // Send data to every subscriber of that symbol
    //     subscriptionItem.handlers.forEach((handler: { callback: (arg0: any) => any; }) => handler.callback(bar));
    // });

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

const channelToSubscription = new Map();

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
    const channelString = `0~${symbolInfo?.ticker}~${symbolInfo?.base_name?.[0] ?? 'No Name'}~${symbolInfo?.description}`;

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