// @ts-nocheck
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { generateDerivApiInstance } from '@/external/bot-skeleton/services/api/appId';
import './mini-dcircles-panel.scss';

const MARKETS = [
    { value: 'R_10', label: 'Vol 10' },
    { value: 'R_25', label: 'Vol 25' },
    { value: 'R_50', label: 'Vol 50' },
    { value: 'R_75', label: 'Vol 75' },
    { value: 'R_100', label: 'Vol 100' },
    { value: '1HZ10V', label: 'Vol 10 (1s)' },
    { value: '1HZ25V', label: 'Vol 25 (1s)' },
    { value: '1HZ50V', label: 'Vol 50 (1s)' },
    { value: '1HZ75V', label: 'Vol 75 (1s)' },
    { value: '1HZ100V', label: 'Vol 100 (1s)' },
];

const TICK_COUNTS = [
    { value: 100, label: '100' },
    { value: 500, label: '500' },
    { value: 1000, label: '1000' },
];

const getLastDigit = (price: number, pipSize: number): number => {
    const fixedPrice = price.toFixed(pipSize);
    return parseInt(fixedPrice.charAt(fixedPrice.length - 1), 10);
};

interface TickData {
    price: number;
    digit: number;
    direction?: 'rise' | 'fall';
}

const STORAGE_KEY_MARKET = 'dcircles_market';
const STORAGE_KEY_TICKS = 'dcircles_ticks';

const MiniDcirclesPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedMarket, setSelectedMarket] = useState<string>(
        () => localStorage.getItem(STORAGE_KEY_MARKET) || 'R_100'
    );
    const [selectedTicks, setSelectedTicks] = useState<number>(
        () => Number(localStorage.getItem(STORAGE_KEY_TICKS)) || 1000
    );

    const [ticks, setTicks] = useState<TickData[]>([]);
    const [currentPrice, setCurrentPrice] = useState<string>('---');
    const [pipSize, setPipSize] = useState<number>(2);

    const subscriptionIdRef = useRef<string | null>(null);

    // Sync market selection changes back to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_MARKET, selectedMarket);
    }, [selectedMarket]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_TICKS, String(selectedTicks));
    }, [selectedTicks]);

    // Connect and fetch digit data when panel is open
    useEffect(() => {
        if (!isOpen) return;

        let active = true;

        const connectAndSubscribe = async () => {
            try {
                const api = await generateDerivApiInstance();
                if (!active) return;

                const ws = api.connection;
                setTicks([]);
                setCurrentPrice('---');

                ws.send(
                    JSON.stringify({
                        ticks_history: selectedMarket,
                        adjust_start_time: 1,
                        count: selectedTicks,
                        end: 'latest',
                        start: 1,
                        style: 'ticks',
                    })
                );

                ws.send(
                    JSON.stringify({
                        ticks: selectedMarket,
                        subscribe: 1,
                    })
                );

                const handleMessage = (event: MessageEvent) => {
                    if (!active) return;
                    const data = JSON.parse(event.data);

                    if (data.msg_type === 'history' && data.echo_req?.ticks_history === selectedMarket) {
                        const history = data.history;
                        const pSize = data.pip_size || 2;
                        setPipSize(pSize);
                        if (history && history.prices) {
                            const rawPrices: number[] = history.prices;
                            const parsedTicks: TickData[] = rawPrices.map((price, idx) => {
                                const digit = getLastDigit(price, pSize);
                                const prevPrice = idx > 0 ? rawPrices[idx - 1] : price;
                                const direction = price >= prevPrice ? 'rise' : 'fall';
                                return { price, digit, direction };
                            });
                            setTicks(parsedTicks);
                            if (parsedTicks.length > 0) {
                                setCurrentPrice(parsedTicks[parsedTicks.length - 1].price.toFixed(pSize));
                            }
                        }
                    }

                    if (data.msg_type === 'tick' && data.tick?.symbol === selectedMarket) {
                        const tick = data.tick;
                        const pSize = tick.pip_size || pipSize;
                        setPipSize(pSize);
                        const price = tick.quote;
                        const digit = getLastDigit(price, pSize);
                        if (data.subscription) {
                            subscriptionIdRef.current = data.subscription.id;
                        }
                        setCurrentPrice(price.toFixed(pSize));
                        setTicks(prev => {
                            const lastPrice = prev.length > 0 ? prev[prev.length - 1].price : price;
                            const direction = price >= lastPrice ? 'rise' : 'fall';
                            const newTick: TickData = { price, digit, direction };
                            const updated = [...prev, newTick];
                            if (updated.length > selectedTicks) {
                                return updated.slice(updated.length - selectedTicks);
                            }
                            return updated;
                        });
                    }
                };

                ws.addEventListener('message', handleMessage);

                return () => {
                    active = false;
                    ws.removeEventListener('message', handleMessage);
                    if (subscriptionIdRef.current && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ forget: subscriptionIdRef.current }));
                        subscriptionIdRef.current = null;
                    }
                };
            } catch (err) {
                console.error('MiniDcircles WebSocket error:', err);
            }
        };

        const cleanupPromise = connectAndSubscribe();
        return () => {
            active = false;
            cleanupPromise.then(cleanup => cleanup && cleanup());
        };
    }, [isOpen, selectedMarket, selectedTicks]);

    const currentLastDigit = ticks.length > 0 ? ticks[ticks.length - 1].digit : null;

    const { percentages, rankMap } = useMemo(() => {
        const countsArray = Array(10).fill(0);
        ticks.forEach(t => {
            if (t.digit >= 0 && t.digit <= 9) countsArray[t.digit]++;
        });

        const total = ticks.length || 1;
        const pcts = countsArray.map(c => ((c / total) * 100).toFixed(1));

        const uniqueCounts = Array.from(new Set(countsArray)).sort((a, b) => b - a);
        const rMap: Record<number, string> = {};

        if (uniqueCounts.length > 1) {
            const top1 = uniqueCounts[0];
            const top2 = uniqueCounts[1];
            const bot1 = uniqueCounts[uniqueCounts.length - 1];
            const bot2 = uniqueCounts.length > 2 ? uniqueCounts[uniqueCounts.length - 2] : null;

            countsArray.forEach((cnt, digit) => {
                if (cnt === top1) rMap[digit] = 'highest';
                else if (cnt === top2) rMap[digit] = 'second';
                else if (cnt === bot1 && uniqueCounts.length > 2) rMap[digit] = 'lowest';
                else if (bot2 !== null && cnt === bot2 && uniqueCounts.length > 3) rMap[digit] = 'second_low';
                else rMap[digit] = 'neutral';
            });
        } else {
            countsArray.forEach((_, digit) => { rMap[digit] = 'neutral'; });
        }

        return { percentages: pcts, rankMap: rMap };
    }, [ticks]);

    const patternMetrics = useMemo(() => {
        let evenCount = 0, oddCount = 0, overCount = 0, underCount = 0;
        ticks.forEach(t => {
            if (t.digit % 2 === 0) evenCount++; else oddCount++;
            if (t.digit >= 5) overCount++; else underCount++;
        });
        const total = ticks.length || 1;
        return {
            evenPct: ((evenCount / total) * 100).toFixed(1),
            oddPct: ((oddCount / total) * 100).toFixed(1),
            overPct: ((overCount / total) * 100).toFixed(1),
            underPct: ((underCount / total) * 100).toFixed(1),
        };
    }, [ticks]);

    const selectedMarketLabel = MARKETS.find(m => m.value === selectedMarket)?.label || selectedMarket;

    return (
        <>
            {/* Floating Toggle Button */}
            <button
                className={`mini-dc-toggle${isOpen ? ' mini-dc-toggle--active' : ''}`}
                onClick={() => setIsOpen(prev => !prev)}
                title='Digit Distribution'
                id='mini-dc-toggle-btn'
                aria-label='Toggle Digit Distribution Panel'
            >
                📊
            </button>

            {/* Slide-in Panel */}
            <div className={`mini-dc-panel${isOpen ? ' mini-dc-panel--open' : ''}`} aria-hidden={!isOpen}>
                {/* Panel Header */}
                <div className='mini-dc-panel__header'>
                    <div className='mini-dc-panel__header-info'>
                        <span className='mini-dc-panel__title'>LIVE ANALYSIS</span>
                        <span className='mini-dc-panel__subtitle'>Digit Distribution</span>
                    </div>
                    <button
                        className='mini-dc-panel__close'
                        onClick={() => setIsOpen(false)}
                        aria-label='Close digit panel'
                    >
                        ✕
                    </button>
                </div>

                {/* Market + Ticks Selectors */}
                <div className='mini-dc-panel__controls'>
                    <div className='mini-dc-panel__control-group'>
                        <label>MARKET</label>
                        <select
                            value={selectedMarket}
                            onChange={e => setSelectedMarket(e.target.value)}
                        >
                            {MARKETS.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className='mini-dc-panel__control-group'>
                        <label>TICKS</label>
                        <select
                            value={selectedTicks}
                            onChange={e => setSelectedTicks(Number(e.target.value))}
                        >
                            {TICK_COUNTS.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Selected Market + Current Price */}
                <div className='mini-dc-panel__market-row'>
                    <span className='mini-dc-panel__market-name'>{selectedMarketLabel}</span>
                    <span className='mini-dc-panel__price'>{currentPrice}</span>
                </div>

                {/* 10 Digit Circles Grid (2 rows × 5) */}
                <div className='mini-dc-panel__digit-grid'>
                    {percentages.map((pct, digit) => {
                        const rank = rankMap[digit] || 'neutral';
                        const isCurrent = currentLastDigit === digit;
                        return (
                            <div
                                key={digit}
                                className={`mini-dc-circle mini-dc-circle--${rank}${isCurrent ? ' mini-dc-circle--active' : ''}`}
                                title={`Digit ${digit}: ${pct}%`}
                            >
                                <span className='mini-dc-circle__num'>{digit}</span>
                                <span className='mini-dc-circle__pct'>{pct}%</span>
                                {isCurrent && <div className='mini-dc-circle__pointer' />}
                            </div>
                        );
                    })}
                </div>

                {/* Pattern Summary Bars */}
                <div className='mini-dc-panel__bars'>
                    <div className='mini-dc-bar-row'>
                        <span className='mini-dc-bar-row__label mini-dc-bar-row__label--green'>EVEN {patternMetrics.evenPct}%</span>
                        <div className='mini-dc-bar-track'>
                            <div className='mini-dc-bar-fill mini-dc-bar-fill--even' style={{ width: `${patternMetrics.evenPct}%` }} />
                        </div>
                        <span className='mini-dc-bar-row__label mini-dc-bar-row__label--red'>ODD {patternMetrics.oddPct}%</span>
                    </div>
                    <div className='mini-dc-bar-row'>
                        <span className='mini-dc-bar-row__label mini-dc-bar-row__label--green'>RISE</span>
                        <div className='mini-dc-bar-track'>
                            <div className='mini-dc-bar-fill mini-dc-bar-fill--rise' style={{ width: `${patternMetrics.overPct}%` }} />
                        </div>
                        <span className='mini-dc-bar-row__label mini-dc-bar-row__label--red'>FALL</span>
                    </div>
                    <div className='mini-dc-bar-row'>
                        <span className='mini-dc-bar-row__label mini-dc-bar-row__label--green'>OVER 4 {patternMetrics.overPct}%</span>
                        <div className='mini-dc-bar-track'>
                            <div className='mini-dc-bar-fill mini-dc-bar-fill--over' style={{ width: `${patternMetrics.overPct}%` }} />
                        </div>
                        <span className='mini-dc-bar-row__label mini-dc-bar-row__label--red'>UNDER 5 {patternMetrics.underPct}%</span>
                    </div>
                </div>

                {/* Footer: Ticks count */}
                <div className='mini-dc-panel__footer'>
                    <span>{ticks.length} ticks loaded</span>
                    <span className='mini-dc-panel__last-digit'>
                        LAST: <strong>{currentLastDigit !== null ? currentLastDigit : '-'}</strong>
                    </span>
                </div>
            </div>
        </>
    );
};

export default MiniDcirclesPanel;
