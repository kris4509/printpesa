// Shared singleton tick store for Dcircles digit distribution.
// Both MiniDcirclesPanel (bot-builder) and Dcircles (tab page) subscribe here
// so they always display IDENTICAL percentages — no separate subscriptions.

import { useEffect, useState, useRef, useCallback } from 'react';
import { generateDerivApiInstance } from '@/external/bot-skeleton/services/api/appId';

export interface TickData {
    price: number;
    digit: number;
    direction: 'rise' | 'fall';
}

// ─── Singleton store ────────────────────────────────────────────────────────
// Everything is module-level so it is shared across all component instances.

let currentMarket: string = localStorage.getItem('dcircles_market') || 'R_100';
let currentTickCount: number = Number(localStorage.getItem('dcircles_ticks')) || 1000;
let currentPipSize: number = 2;
let ticks: TickData[] = [];
let currentPrice: string = '---';

type Listener = () => void;
const listeners = new Set<Listener>();

let wsRef: WebSocket | null = null;
let subscriptionId: string | null = null;
let connectPromise: Promise<void> | null = null;
let activeMarketAtConnect: string = '';
let activeTickCountAtConnect: number = 0;

const notify = () => {
    listeners.forEach(fn => fn());
};

const getLastDigit = (price: number, pipSize: number): number => {
    const fixedPrice = price.toFixed(pipSize);
    return parseInt(fixedPrice.charAt(fixedPrice.length - 1), 10);
};

const doForgetSubscription = () => {
    if (subscriptionId && wsRef && wsRef.readyState === WebSocket.OPEN) {
        wsRef.send(JSON.stringify({ forget: subscriptionId }));
    }
    subscriptionId = null;
};

const connectAndSubscribe = async () => {
    const market = currentMarket;
    const tickCount = currentTickCount;

    activeMarketAtConnect = market;
    activeTickCountAtConnect = tickCount;

    try {
        const api = await generateDerivApiInstance();
        const ws = api.connection as WebSocket;

        // If market or tickCount changed while we were awaiting, restart.
        if (activeMarketAtConnect !== currentMarket || activeTickCountAtConnect !== currentTickCount) {
            connectPromise = null;
            connect();
            return;
        }

        wsRef = ws;

        // Clear state for the new market
        ticks = [];
        currentPrice = '---';
        notify();

        // Request history
        ws.send(
            JSON.stringify({
                ticks_history: market,
                adjust_start_time: 1,
                count: tickCount,
                end: 'latest',
                start: 1,
                style: 'ticks',
            })
        );

        // Subscribe to live ticks
        ws.send(JSON.stringify({ ticks: market, subscribe: 1 }));

        const handleMessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);

            // ── History response ──────────────────────────────────────────
            if (
                data.msg_type === 'history' &&
                data.echo_req?.ticks_history === market
            ) {
                // pip_size can be at top level in the history response
                const pSize: number = data.pip_size ?? 2;
                currentPipSize = pSize;

                const history = data.history;
                if (history?.prices) {
                    const rawPrices: number[] = history.prices;
                    ticks = rawPrices.map((price, idx) => {
                        const digit = getLastDigit(price, pSize);
                        const prevPrice = idx > 0 ? rawPrices[idx - 1] : price;
                        const direction: 'rise' | 'fall' =
                            price >= prevPrice ? 'rise' : 'fall';
                        return { price, digit, direction };
                    });
                    currentPrice =
                        ticks.length > 0
                            ? ticks[ticks.length - 1].price.toFixed(pSize)
                            : '---';
                    notify();
                }
            }

            // ── Live tick response ────────────────────────────────────────
            if (
                data.msg_type === 'tick' &&
                data.tick?.symbol === market
            ) {
                const tick = data.tick;
                // pip_size comes from the tick object itself
                const pSize: number = tick.pip_size ?? currentPipSize;
                currentPipSize = pSize;

                if (data.subscription) {
                    subscriptionId = data.subscription.id;
                }

                const price: number = tick.quote;
                const digit = getLastDigit(price, pSize);
                currentPrice = price.toFixed(pSize);

                const lastPrice =
                    ticks.length > 0 ? ticks[ticks.length - 1].price : price;
                const direction: 'rise' | 'fall' =
                    price >= lastPrice ? 'rise' : 'fall';

                const updated = [...ticks, { price, digit, direction }];
                // Trim to window size
                ticks =
                    updated.length > currentTickCount
                        ? updated.slice(updated.length - currentTickCount)
                        : updated;

                notify();
            }
        };

        ws.addEventListener('message', handleMessage);

        // Store cleanup on the promise so we can unsubscribe on market change
        (connectPromise as any).__cleanup = () => {
            ws.removeEventListener('message', handleMessage);
            doForgetSubscription();
        };
    } catch (err) {
        console.error('[DcirclesTicks] WebSocket error:', err);
        connectPromise = null;
    }
};

const cleanupPrevious = () => {
    if (connectPromise && (connectPromise as any).__cleanup) {
        (connectPromise as any).__cleanup();
    }
    connectPromise = null;
    ticks = [];
    currentPrice = '---';
};

const connect = () => {
    cleanupPrevious();
    connectPromise = connectAndSubscribe();
};

// ─── Public setters (used by the market/ticks selectors) ────────────────────

export const setDcirclesMarket = (market: string) => {
    if (market === currentMarket) return;
    currentMarket = market;
    localStorage.setItem('dcircles_market', market);
    window.dispatchEvent(new CustomEvent('dcircles_market_change', { detail: market }));
    connect();
};

export const setDcirclesTickCount = (count: number) => {
    if (count === currentTickCount) return;
    currentTickCount = count;
    localStorage.setItem('dcircles_ticks', String(count));
    window.dispatchEvent(new CustomEvent('dcircles_ticks_change', { detail: count }));
    connect();
};

export const getDcirclesMarket = () => currentMarket;
export const getDcirclesTickCount = () => currentTickCount;

// ─── React hook ─────────────────────────────────────────────────────────────

export interface DcirclesState {
    ticks: TickData[];
    currentPrice: string;
    pipSize: number;
    selectedMarket: string;
    selectedTicks: number;
    setMarket: (m: string) => void;
    setTickCount: (n: number) => void;
}

let globalConnectInitiated = false;

export const useDcirclesTicks = (): DcirclesState => {
    // Local state mirrors the singleton so React re-renders on change
    const [, forceUpdate] = useState(0);
    const rerender = useCallback(() => forceUpdate(n => n + 1), []);

    useEffect(() => {
        listeners.add(rerender);

        // Ensure the singleton is connected (only once globally)
        if (!globalConnectInitiated) {
            globalConnectInitiated = true;
            connect();
        }

        return () => {
            listeners.delete(rerender);
        };
    }, [rerender]);

    return {
        ticks,
        currentPrice,
        pipSize: currentPipSize,
        selectedMarket: currentMarket,
        selectedTicks: currentTickCount,
        setMarket: setDcirclesMarket,
        setTickCount: setDcirclesTickCount,
    };
};
