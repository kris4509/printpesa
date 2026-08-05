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
export const useDigitFrequencies = (symbol: string | undefined, tickCount = 1000) => {
    const [frequencies, setFrequencies] = useState<number[]>(Array(10).fill(0));
    const [total, setTotal] = useState(0);

    useEffect(() => {
        if (!symbol) return;

        let active = true;
        let digits: number[] = [];
        let pipSize = 2;
        let subscriptionId: string | null = null;
        let ws: WebSocket | null = null;

        setFrequencies(Array(10).fill(0));
        setTotal(0);

        const rebuildFrequencies = (digitsList: number[]) => {
            const counts = Array(10).fill(0);
            digitsList.forEach(d => { if (d >= 0 && d <= 9) counts[d]++; });
            setFrequencies(counts);
            setTotal(digitsList.length);
        };

        const handleMessage = (event: MessageEvent) => {
            if (!active) return;
            const data = JSON.parse(event.data);

            if (data.msg_type === 'history' && data.echo_req?.ticks_history === symbol) {
                const history = data.history;
                pipSize = data.pip_size ?? pipSize;
                if (history?.prices) {
                    digits = history.prices.map((p: number) => getLastDigit(p, pipSize));
                    rebuildFrequencies(digits);
                }
            }

            if (data.msg_type === 'tick' && data.tick?.symbol === symbol) {
                pipSize = data.tick.pip_size ?? pipSize;
                const digit = getLastDigit(data.tick.quote, pipSize);
                if (data.subscription) subscriptionId = data.subscription.id;
                digits = [...digits, digit].slice(-tickCount);
                rebuildFrequencies(digits);
            }
        };

        const connect = async () => {
            try {
                const api = await generateDerivApiInstance();
                if (!active) return;

                ws = api.connection as WebSocket;

                ws.addEventListener('message', handleMessage);

                ws.send(JSON.stringify({
                    ticks_history: symbol,
                    adjust_start_time: 1,
                    count: tickCount,
                    end: 'latest',
                    start: 1,
                    style: 'ticks',
                }));

                ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
            } catch {
                // ignore connection errors silently
            }
        };

        connect();

        return () => {
            active = false;
            if (ws) {
                ws.removeEventListener('message', handleMessage);
                if (subscriptionId && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ forget: subscriptionId }));
                }
            }
        };
    }, [symbol, tickCount]);

    return { frequencies, total };
};
