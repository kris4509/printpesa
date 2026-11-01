// Shared singleton tick store for Dcircles digit distribution.
// Both MiniDcirclesPanel (bot-builder) and Dcircles (tab page) subscribe here
// so they always display IDENTICAL percentages — no separate subscriptions.

import { useEffect, useState, useCallback } from 'react';
import { getSocketURL } from '@/components/shared';
import { getMarketPipSize, getPipSize } from '@/utils/market-pip-size';

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
let reconnectTimer: number | null = null;
let connectionGeneration = 0;
let reconnectAttempt = 0;

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

const connectAndSubscribe = async (generation: number) => {
    const market = currentMarket;
    const tickCount = currentTickCount;
    let hasReceivedHistory = false;
    let hasRequestedHistory = false;
    let pendingTicks: any[] = [];

    const requestTickHistory = (ws: WebSocket) => {
        if (hasRequestedHistory) return;
        hasRequestedHistory = true;
        ws.send(
            JSON.stringify({
                ticks_history: market,
                count: tickCount,
                end: 'latest',
                subscribe: 1,
                style: 'ticks',
            })
        );
    };

    const appendTick = (tick: any) => {
        const price = Number(tick.quote);
        const pipSize = getPipSize(tick.pip_size) ?? currentPipSize;
        if (!Number.isFinite(price)) return;

        currentPipSize = pipSize;
        const digit = getLastDigit(price, pipSize);
        currentPrice = price.toFixed(pipSize);

        const lastPrice = ticks.length > 0 ? ticks[ticks.length - 1].price : price;
        const direction: 'rise' | 'fall' = price >= lastPrice ? 'rise' : 'fall';
        const updated = [...ticks, { price, digit, direction }];
        ticks = updated.length > currentTickCount ? updated.slice(-currentTickCount) : updated;
    };

    try {
        const socketUrl = await getSocketURL();
        if (generation !== connectionGeneration) return;
        const ws = new WebSocket(socketUrl);
        wsRef = ws;

        const handleMessage = (event: MessageEvent) => {
            if (generation !== connectionGeneration || ws !== wsRef) return;

            let data: any;
            try {
                data = JSON.parse(event.data);
            } catch (error) {
                console.error('[DcirclesTicks] Invalid WebSocket message:', error);
                return;
            }

            if (data.error) {
                console.error('[DcirclesTicks] API error:', data.error);
                return;
            }

            if (data.msg_type === 'active_symbols' && Array.isArray(data.active_symbols)) {
                const symbol = data.active_symbols.find(
                    (item: any) => item.symbol === market || item.underlying_symbol === market
                );
                const pipSize = symbol ? getMarketPipSize(symbol) : null;
                if (pipSize === null) {
                    console.error(`[DcirclesTicks] Could not resolve tick precision for ${market}.`);
                    currentPrice = 'Precision unavailable';
                    notify();
                    return;
                }

                currentPipSize = pipSize;
                requestTickHistory(ws);
                return;
            }

            // ── History response ──────────────────────────────────────────
            if (
                data.msg_type === 'history' &&
                data.echo_req?.ticks_history === market
            ) {
                if (data.subscription) {
                    subscriptionId = data.subscription.id;
                }

                const pSize = data.pip_size === undefined ? currentPipSize : getPipSize(data.pip_size);
                if (pSize === null) {
                    console.error('[DcirclesTicks] History response has an invalid pip size:', data.pip_size);
                    return;
                }
                currentPipSize = pSize;

                const history = data.history;
                if (!Array.isArray(history?.prices)) {
                    console.error('[DcirclesTicks] History response did not contain tick prices:', data);
                    return;
                }
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

                hasReceivedHistory = true;
                pendingTicks.forEach(appendTick);
                pendingTicks = [];
                notify();
            }

            // ── Live tick response ────────────────────────────────────────
            if (
                data.msg_type === 'tick' &&
                data.tick?.symbol === market
            ) {
                const tick = data.tick;
                if (data.subscription) {
                    subscriptionId = data.subscription.id;
                }

                if (!hasReceivedHistory) {
                    pendingTicks.push(tick);
                    return;
                }
                appendTick(tick);
                notify();
            }
        };

        ws.addEventListener('message', handleMessage);
        ws.addEventListener('open', () => {
            if (generation !== connectionGeneration || ws !== wsRef) return;

            reconnectAttempt = 0;
            ws.send(JSON.stringify({ active_symbols: 'brief' }));
        });
        ws.addEventListener('close', () => {
            if (generation !== connectionGeneration || ws !== wsRef) return;
            ws.removeEventListener('message', handleMessage);
            wsRef = null;
            subscriptionId = null;
            scheduleReconnect();
        });
        ws.addEventListener('error', error => {
            console.error('[DcirclesTicks] WebSocket error:', error);
        });

    } catch (err) {
        console.error('[DcirclesTicks] WebSocket error:', err);
        scheduleReconnect();
    }
};

const cleanupPrevious = (closeSocket = true) => {
    if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }

    const previousSocket = wsRef;
    doForgetSubscription();
    wsRef = null;
    ticks = [];
    currentPrice = '---';

    if (closeSocket && previousSocket) {
        previousSocket.close();
    }
};

const scheduleReconnect = () => {
    if (reconnectTimer !== null) return;
    const delay = Math.min(1000 * 2 ** reconnectAttempt, 30000);
    reconnectAttempt += 1;
    reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        connect();
    }, delay);
};

const connect = () => {
    connectionGeneration += 1;
    cleanupPrevious();
    connectAndSubscribe(connectionGeneration);
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
