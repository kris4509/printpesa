import { useEffect, useState, useRef } from 'react';
import { generateDerivApiInstance } from '@/external/bot-skeleton/services/api/appId';

const getLastDigit = (price: number, pipSize: number): number => {
    const fixedPrice = price.toFixed(pipSize);
    return parseInt(fixedPrice.charAt(fixedPrice.length - 1), 10);
};

/**
 * Fetches last-digit frequencies for a given symbol.
 * Returns an array of 10 numbers (count per digit 0-9).
 */
export const useDigitFrequencies = (symbol: string | undefined, tickCount = 100) => {
    const [frequencies, setFrequencies] = useState<number[]>(Array(10).fill(0));
    const [total, setTotal] = useState(0);
    const subscriptionIdRef = useRef<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const activeRef = useRef(true);

    useEffect(() => {
        if (!symbol) return;
        activeRef.current = true;
        subscriptionIdRef.current = null;
        setFrequencies(Array(10).fill(0));
        setTotal(0);

        let localDigits: number[] = [];

        const connect = async () => {
            try {
                const api = await generateDerivApiInstance();
                if (!activeRef.current) return;

                const ws = api.connection as WebSocket;
                wsRef.current = ws;

                // Request history
                ws.send(JSON.stringify({
                    ticks_history: symbol,
                    adjust_start_time: 1,
                    count: tickCount,
                    end: 'latest',
                    start: 1,
                    style: 'ticks',
                }));

                // Subscribe to live ticks
                ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));

                const handleMessage = (event: MessageEvent) => {
                    if (!activeRef.current) return;
                    const data = JSON.parse(event.data);

                    if (data.msg_type === 'history' && data.echo_req?.ticks_history === symbol) {
                        const history = data.history;
                        const pipSize = data.pip_size ?? 0;
                        if (history?.prices) {
                            localDigits = history.prices.map((p: number) => getLastDigit(p, pipSize));
                            rebuildFrequencies(localDigits);
                        }
                    }

                    if (data.msg_type === 'tick' && data.tick?.symbol === symbol) {
                        const pipSize = data.tick.pip_size ?? 0;
                        const digit = getLastDigit(data.tick.quote, pipSize);
                        if (data.subscription) subscriptionIdRef.current = data.subscription.id;
                        localDigits = [...localDigits, digit].slice(-tickCount);
                        rebuildFrequencies(localDigits);
                    }
                };

                const rebuildFrequencies = (digits: number[]) => {
                    const counts = Array(10).fill(0);
                    digits.forEach(d => { if (d >= 0 && d <= 9) counts[d]++; });
                    setFrequencies(counts);
                    setTotal(digits.length);
                };

                ws.addEventListener('message', handleMessage);

                return () => {
                    ws.removeEventListener('message', handleMessage);
                    if (subscriptionIdRef.current && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ forget: subscriptionIdRef.current }));
                    }
                };
            } catch {
                // ignore connection errors silently
            }
        };

        const cleanupPromise = connect();
        return () => {
            activeRef.current = false;
            cleanupPromise.then(cleanup => cleanup?.());
        };
    }, [symbol, tickCount]);

    return { frequencies, total };
};
