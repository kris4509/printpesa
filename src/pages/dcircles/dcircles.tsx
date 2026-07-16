import React, { useEffect, useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { Localize } from '@deriv-com/translations';
import { generateDerivApiInstance } from '@/external/bot-skeleton/services/api/appId';
import './dcircles.scss';

const MARKETS = [
    { value: 'R_10', label: 'Volatility 10 Index' },
    { value: 'R_25', label: 'Volatility 25 Index' },
    { value: 'R_50', label: 'Volatility 50 Index' },
    { value: 'R_75', label: 'Volatility 75 Index' },
    { value: 'R_100', label: 'Volatility 100 Index' },
    { value: '1HZ10V', label: 'Volatility 10 (1s) Index' },
    { value: '1HZ25V', label: 'Volatility 25 (1s) Index' },
    { value: '1HZ50V', label: 'Volatility 50 (1s) Index' },
    { value: '1HZ75V', label: 'Volatility 75 (1s) Index' },
    { value: '1HZ100V', label: 'Volatility 100 (1s) Index' },
];

const TICK_COUNTS = [
    { value: 100, label: '100 ticks' },
    { value: 500, label: '500 ticks' },
    { value: 1000, label: '1000 ticks' },
];

const getLastDigit = (price: number, pipSize: number): number => {
    const fixedPrice = price.toFixed(pipSize);
    return parseInt(fixedPrice.charAt(fixedPrice.length - 1), 10);
};

const Dcircles = observer(() => {
    const [selectedMarket, setSelectedMarket] = useState('R_100');
    const [selectedTicks, setSelectedTicks] = useState(1000);
    const [lastDigits, setLastDigits] = useState<number[]>([]);
    const [currentLastDigit, setCurrentLastDigit] = useState<number | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const subscriptionIdRef = useRef<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        let active = true;

        const connectAndSubscribe = async () => {
            try {
                const api = await generateDerivApiInstance();
                if (!active) return;

                const ws = api.connection;
                wsRef.current = ws;
                setIsConnected(true);

                // Send request for history
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

                // Send request for subscription
                ws.send(
                    JSON.stringify({
                        ticks: selectedMarket,
                        subscribe: 1,
                    })
                );

                const handleMessage = (event: MessageEvent) => {
                    if (!active) return;
                    const data = JSON.parse(event.data);

                    // Handle History
                    if (data.msg_type === 'history' && data.echo_req.ticks_history === selectedMarket) {
                        const history = data.history;
                        const pipSize = data.pip_size || 0;
                        if (history && history.prices) {
                            const digits = history.prices.map((price: number) => getLastDigit(price, pipSize));
                            setLastDigits(digits);
                            if (digits.length > 0) {
                                setCurrentLastDigit(digits[digits.length - 1]);
                            }
                        }
                    }

                    // Handle Tick
                    if (data.msg_type === 'tick' && data.tick?.symbol === selectedMarket) {
                        const tick = data.tick;
                        const pipSize = tick.pip_size || 0;
                        const digit = getLastDigit(tick.quote, pipSize);

                        if (data.subscription) {
                            subscriptionIdRef.current = data.subscription.id;
                        }

                        setCurrentLastDigit(digit);
                        setLastDigits(prev => {
                            const updated = [...prev, digit];
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
                    // Unsubscribe
                    if (subscriptionIdRef.current && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ forget: subscriptionIdRef.current }));
                    }
                };
            } catch (err) {
                console.error('Dcircles WebSocket connection failed:', err);
            }
        };

        const cleanupPromise = connectAndSubscribe();

        return () => {
            active = false;
            cleanupPromise.then(cleanup => cleanup && cleanup());
        };
    }, [selectedMarket, selectedTicks]);

    // Calculate percentage distributions
    const counts = Array(10).fill(0);
    lastDigits.forEach(digit => {
        if (digit >= 0 && digit <= 9) {
            counts[digit]++;
        }
    });

    const total = lastDigits.length || 1;
    const percentages = counts.map(count => ((count / total) * 100).toFixed(1));

    // Rank-based color assignment:
    // most appearing -> green, 2nd most -> blue, 2nd least -> yellow, least -> red, others -> neutral
    const sortedByCount = counts
        .map((count, digit) => ({ digit, count }))
        .sort((a, b) => b.count - a.count);

    const digitColorMap: Record<number, string> = {};
    const n = sortedByCount.length; // always 10
    sortedByCount.forEach(({ digit }, rank) => {
        if (rank === 0) {
            digitColorMap[digit] = '#4CAF50'; // most appearing - green
        } else if (rank === 1) {
            digitColorMap[digit] = '#2196F3'; // 2nd most - blue
        } else if (rank === n - 2) {
            digitColorMap[digit] = '#FFEB3B'; // 2nd least - yellow
        } else if (rank === n - 1) {
            digitColorMap[digit] = '#F44336'; // least - red
        } else {
            digitColorMap[digit] = '#555770'; // neutral for all others
        }
    });

    const getDigitColor = (digit: number) => digitColorMap[digit] ?? '#555770';

    return (
        <div className='dcircles'>
            {/* Fixed Header */}
            <div className='dcircles__header'>
                <h1 className='dcircles__title'>
                    <Localize i18n_default_text='Dcircles Analysis' />
                </h1>
                <p className='dcircles__subtitle'>
                    <Localize i18n_default_text='Real-time last digit stats' />
                </p>
            </div>

            {/* Scrollable Panel Container */}
            <div className='dcircles__scroll-container'>
                <div className='dcircles__controls'>
                    <div className='dcircles__control-group'>
                        <label htmlFor='market-select'>
                            <Localize i18n_default_text='Market:' />
                        </label>
                        <select
                            id='market-select'
                            value={selectedMarket}
                            onChange={e => setSelectedMarket(e.target.value)}
                        >
                            {MARKETS.map(market => (
                                <option key={market.value} value={market.value}>
                                    {market.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className='dcircles__control-group'>
                        <label htmlFor='ticks-select'>
                            <Localize i18n_default_text='Ticks:' />
                        </label>
                        <select
                            id='ticks-select'
                            value={selectedTicks}
                            onChange={e => setSelectedTicks(Number(e.target.value))}
                        >
                            {TICK_COUNTS.map(count => (
                                <option key={count.value} value={count.value}>
                                    {count.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Display Current Last Digit */}
                <div className='dcircles__display-section'>
                    <span className='dcircles__label-title'>
                        <Localize i18n_default_text='Last Digit' />
                    </span>
                    <div
                        className='dcircles__big-circle'
                        style={{
                            borderColor:
                                currentLastDigit !== null ? getDigitColor(currentLastDigit) : 'var(--border-normal)',
                        }}
                    >
                        {currentLastDigit !== null ? currentLastDigit : '-'}
                    </div>
                </div>

                {/* Grid of 10 number circles */}
                <div className='dcircles__stats-grid'>
                    {percentages.map((percentage, index) => (
                        <div key={index} className='dcircles__stat-item'>
                            <div
                                className='dcircles__small-circle'
                                style={{ borderColor: getDigitColor(index) }}
                            >
                                <span className='dcircles__digit'>{index}</span>
                                <span className='dcircles__percentage'>{percentage}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});

export default Dcircles;
