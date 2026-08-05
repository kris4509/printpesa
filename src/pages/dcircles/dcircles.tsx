import React, { useEffect, useState, useRef, useMemo } from 'react';
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

interface TickData {
    price: number;
    digit: number;
    direction?: 'rise' | 'fall';
}

const STORAGE_KEY_MARKET = 'dcircles_market';
const STORAGE_KEY_TICKS = 'dcircles_ticks';

const Dcircles = observer(() => {
    const [selectedMarket, setSelectedMarket] = useState<string>(
        () => localStorage.getItem(STORAGE_KEY_MARKET) || 'R_100'
    );
    const [selectedTicks, setSelectedTicks] = useState<number>(
        () => Number(localStorage.getItem(STORAGE_KEY_TICKS)) || 1000
    );
    const [patternType, setPatternType] = useState<'even_odd' | 'over_under'>('even_odd');
    
    const [ticks, setTicks] = useState<TickData[]>([]);
    const [currentPrice, setCurrentPrice] = useState<string>('---');
    const [pipSize, setPipSize] = useState<number>(2);
    const [isConnected, setIsConnected] = useState(false);

    const subscriptionIdRef = useRef<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    // Persist market & ticks selections to localStorage and notify other same-tab components
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_MARKET, selectedMarket);
        window.dispatchEvent(new CustomEvent('dcircles_market_change', { detail: selectedMarket }));
    }, [selectedMarket]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_TICKS, String(selectedTicks));
        window.dispatchEvent(new CustomEvent('dcircles_ticks_change', { detail: selectedTicks }));
    }, [selectedTicks]);

    useEffect(() => {
        let active = true;

        const connectAndSubscribe = async () => {
            try {
                const api = await generateDerivApiInstance();
                if (!active) return;

                const ws = api.connection;
                wsRef.current = ws;
                setIsConnected(true);

                // Clear previous state on market change
                setTicks([]);
                setCurrentPrice('---');

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

                    // Handle Live Tick
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

    // Current last digit
    const currentLastDigit = ticks.length > 0 ? ticks[ticks.length - 1].digit : null;

    // Calculate percentage distributions for digits 0-9
    const { counts, percentages, rankMap, highestInfo, secondInfo, lowestInfo, secondLowInfo } = useMemo(() => {
        const countsArray = Array(10).fill(0);
        ticks.forEach(t => {
            if (t.digit >= 0 && t.digit <= 9) {
                countsArray[t.digit]++;
            }
        });

        const total = ticks.length || 1;
        const pcts = countsArray.map(c => ((c / total) * 100).toFixed(2));

        const uniqueCounts = Array.from(new Set(countsArray)).sort((a, b) => b - a);

        const rMap: Record<number, 'highest' | 'second' | 'lowest' | 'second_low' | 'neutral'> = {};

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

        const getFirstDigitForRank = (rankType: string) => {
            const entry = Object.entries(rMap).find(([_, r]) => r === rankType);
            if (!entry) return null;
            const digit = parseInt(entry[0], 10);
            return { digit, pct: pcts[digit] };
        };

        return {
            counts: countsArray,
            percentages: pcts,
            rankMap: rMap,
            highestInfo: getFirstDigitForRank('highest'),
            secondInfo: getFirstDigitForRank('second'),
            lowestInfo: getFirstDigitForRank('lowest'),
            secondLowInfo: getFirstDigitForRank('second_low'),
        };
    }, [ticks]);

    // Pattern Analysis Metrics (Last 50 ticks)
    const last50Ticks = useMemo(() => ticks.slice(-50), [ticks]);

    const patternMetrics = useMemo(() => {
        if (patternType === 'even_odd') {
            let evenCount = 0;
            let oddCount = 0;
            ticks.forEach(t => {
                if (t.digit % 2 === 0) evenCount++;
                else oddCount++;
            });
            const total = ticks.length || 1;
            const evenPct = ((evenCount / total) * 100).toFixed(1);
            const oddPct = ((oddCount / total) * 100).toFixed(1);

            const pattern50 = last50Ticks.map(t => ({
                label: t.digit % 2 === 0 ? 'E' : 'O',
                type: t.digit % 2 === 0 ? 'even' : 'odd',
                digit: t.digit,
            }));

            return { primaryPct: evenPct, secondaryPct: oddPct, primaryLabel: 'EVEN', secondaryLabel: 'ODD', pattern50 };
        } else {
            let overCount = 0;
            let underCount = 0;
            ticks.forEach(t => {
                if (t.digit >= 5) overCount++;
                else underCount++;
            });
            const total = ticks.length || 1;
            const overPct = ((overCount / total) * 100).toFixed(1);
            const underPct = ((underCount / total) * 100).toFixed(1);

            const pattern50 = last50Ticks.map(t => ({
                label: t.digit >= 5 ? 'O' : 'U',
                type: t.digit >= 5 ? 'over' : 'under',
                digit: t.digit,
            }));

            return { primaryPct: overPct, secondaryPct: underPct, primaryLabel: 'OVER (5-9)', secondaryLabel: 'UNDER (0-4)', pattern50 };
        }
    }, [ticks, patternType, last50Ticks]);

    // Market Movement Metrics (Rise vs Fall)
    const marketMovement = useMemo(() => {
        let riseCount = 0;
        let fallCount = 0;
        ticks.forEach(t => {
            if (t.direction === 'rise') riseCount++;
            else if (t.direction === 'fall') fallCount++;
        });
        const total = (riseCount + fallCount) || 1;
        const risePct = ((riseCount / total) * 100).toFixed(1);
        const fallPct = ((fallCount / total) * 100).toFixed(1);

        return { risePct, fallPct };
    }, [ticks]);

    // Strength percentage calculation for live badge
    const strengthPct = useMemo(() => {
        if (percentages.length === 0) return '50.0';
        const maxPct = Math.max(...percentages.map(p => parseFloat(p)));
        return maxPct ? (maxPct * 5).toFixed(1) : '50.0';
    }, [percentages]);

    return (
        <div className='dcircles-dashboard'>
            {/* ── Top Header Price Bar ── */}
            <div className='dcircles-dashboard__top-bar'>
                <div className='dcircles-dashboard__price-box'>
                    <span className='dcircles-dashboard__price-val'>{currentPrice}</span>
                    <span className='dcircles-dashboard__price-label'>
                        <Localize i18n_default_text='CURRENT PRICE' />
                    </span>
                </div>

                <div className='dcircles-dashboard__selectors'>
                    <div className='dcircles-dashboard__selector-group'>
                        <label htmlFor='dcircles-market-select'>
                            <Localize i18n_default_text='MARKET' />
                        </label>
                        <select
                            id='dcircles-market-select'
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

                    <div className='dcircles-dashboard__selector-group'>
                        <label htmlFor='dcircles-ticks-select'>
                            <Localize i18n_default_text='TICKS' />
                        </label>
                        <select
                            id='dcircles-ticks-select'
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
            </div>

            {/* ── Main Content Container ── */}
            <div className='dcircles-dashboard__grid-layout'>
                
                {/* ── Left / Main Analytics Panel ── */}
                <div className='dcircles-dashboard__main-col'>

                    {/* CARD 1: DIGIT DISTRIBUTION */}
                    <div className='dc-card'>
                        <div className='dc-card__header'>
                            <h3 className='dc-card__title'>
                                <Localize i18n_default_text='DIGIT DISTRIBUTION' />
                            </h3>
                        </div>

                        {/* 10 Digit Circles (0-9) */}
                        <div className='dc-digit-row'>
                            {percentages.map((pct, digit) => {
                                const rank = rankMap[digit] || 'neutral';
                                const isCurrent = currentLastDigit === digit;

                                return (
                                    <div key={digit} className={`dc-digit-item dc-digit-item--${rank}${isCurrent ? ' dc-digit-item--active' : ''}`}>
                                        <div className='dc-digit-item__circle'>
                                            <span className='dc-digit-item__num'>{digit}</span>
                                            <span className='dc-digit-item__pct'>{pct}%</span>
                                        </div>
                                        {isCurrent && <div className='dc-digit-item__pointer' />}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Summary Ranking Cards */}
                        <div className='dc-summary-grid'>
                            <div className='dc-summary-card dc-summary-card--highest'>
                                <span className='dc-summary-card__label'><Localize i18n_default_text='HIGHEST' /></span>
                                <span className='dc-summary-card__val'>
                                    {highestInfo ? `${highestInfo.digit} (${highestInfo.pct}%)` : '---'}
                                </span>
                            </div>
                            <div className='dc-summary-card dc-summary-card--second'>
                                <span className='dc-summary-card__label'><Localize i18n_default_text='2ND' /></span>
                                <span className='dc-summary-card__val'>
                                    {secondInfo ? `${secondInfo.digit} (${secondInfo.pct}%)` : '---'}
                                </span>
                            </div>
                            <div className='dc-summary-card dc-summary-card--lowest'>
                                <span className='dc-summary-card__label'><Localize i18n_default_text='LOWEST' /></span>
                                <span className='dc-summary-card__val'>
                                    {lowestInfo ? `${lowestInfo.digit} (${lowestInfo.pct}%)` : '---'}
                                </span>
                            </div>
                            <div className='dc-summary-card dc-summary-card--second-low'>
                                <span className='dc-summary-card__label'><Localize i18n_default_text='2ND LOW' /></span>
                                <span className='dc-summary-card__val'>
                                    {secondLowInfo ? `${secondLowInfo.digit} (${secondLowInfo.pct}%)` : '---'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* CARD 2: PATTERN ANALYSIS */}
                    <div className='dc-card'>
                        <div className='dc-card__header dc-card__header--between'>
                            <h3 className='dc-card__title'>
                                <Localize i18n_default_text='PATTERN ANALYSIS' />
                            </h3>
                            <div className='dc-toggle-pill'>
                                <button
                                    className={`dc-toggle-pill__btn${patternType === 'even_odd' ? ' dc-toggle-pill__btn--active' : ''}`}
                                    onClick={() => setPatternType('even_odd')}
                                >
                                    EVEN/ODD
                                </button>
                                <button
                                    className={`dc-toggle-pill__btn${patternType === 'over_under' ? ' dc-toggle-pill__btn--active' : ''}`}
                                    onClick={() => setPatternType('over_under')}
                                >
                                    OVER/UNDER
                                </button>
                            </div>
                        </div>

                        {/* Dual Bar Display */}
                        <div className='dc-pattern-bars'>
                            <div className='dc-bar-block dc-bar-block--primary' style={{ flex: parseFloat(patternMetrics.primaryPct) || 1 }}>
                                <span className='dc-bar-block__val'>{patternMetrics.primaryPct}%</span>
                                <span className='dc-bar-block__lbl'>{patternMetrics.primaryLabel}</span>
                            </div>
                            <div className='dc-bar-block dc-bar-block--secondary' style={{ flex: parseFloat(patternMetrics.secondaryPct) || 1 }}>
                                <span className='dc-bar-block__val'>{patternMetrics.secondaryPct}%</span>
                                <span className='dc-bar-block__lbl'>{patternMetrics.secondaryLabel}</span>
                            </div>
                        </div>

                        {/* Last 50 Digits Pattern Grid */}
                        <div className='dc-pattern-stream'>
                            <span className='dc-pattern-stream__label'>
                                <Localize i18n_default_text='LAST 50 DIGITS PATTERN' />
                            </span>
                            <div className='dc-pattern-stream__grid'>
                                {patternMetrics.pattern50.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className={`dc-pattern-bubble dc-pattern-bubble--${item.type}`}
                                        title={`Digit: ${item.digit}`}
                                    >
                                        {item.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* CARD 3: MARKET MOVEMENT */}
                    <div className='dc-card'>
                        <div className='dc-card__header'>
                            <h3 className='dc-card__title'>
                                <Localize i18n_default_text='MARKET MOVEMENT' />
                            </h3>
                        </div>
                        <div className='dc-pattern-bars'>
                            <div className='dc-bar-block dc-bar-block--rise' style={{ flex: parseFloat(marketMovement.risePct) || 1 }}>
                                <span className='dc-bar-block__val'>{marketMovement.risePct}%</span>
                                <span className='dc-bar-block__lbl'><Localize i18n_default_text='RISE' /></span>
                            </div>
                            <div className='dc-bar-block dc-bar-block--fall' style={{ flex: parseFloat(marketMovement.fallPct) || 1 }}>
                                <span className='dc-bar-block__val'>{marketMovement.fallPct}%</span>
                                <span className='dc-bar-block__lbl'><Localize i18n_default_text='FALL' /></span>
                            </div>
                        </div>
                    </div>

                    {/* CARD 4: LAST DIGITS STREAM */}
                    <div className='dc-card'>
                        <div className='dc-card__header'>
                            <h3 className='dc-card__title'>
                                <Localize i18n_default_text='LAST DIGITS STREAM' />
                            </h3>
                        </div>
                        <div className='dc-digits-stream'>
                            {last50Ticks.map((t, idx) => (
                                <div
                                    key={idx}
                                    className={`dc-digit-stream-bubble dc-digit-stream-bubble--${t.direction}`}
                                >
                                    {t.digit}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* ── Right Side / Live Focus Panel (Image 5 Style) ── */}
                <div className='dcircles-dashboard__side-col'>
                    <div className='dc-side-card'>
                        <span className='dc-side-card__label'>
                            <Localize i18n_default_text='LAST DIGIT' />
                        </span>

                        <div className='dc-side-card__big-circle'>
                            <span className='dc-side-card__big-num'>
                                {currentLastDigit !== null ? currentLastDigit : '-'}
                            </span>
                            <div className='dc-side-card__pulse-ring' />
                        </div>

                        <div className='dc-side-card__price-sub'>
                            {currentPrice}
                        </div>

                        <div className='dc-side-card__strength'>
                            <div className='dc-side-card__strength-header'>
                                <span><Localize i18n_default_text='Pattern Strength' /></span>
                                <span className='dc-side-card__strength-val'>{strengthPct}%</span>
                            </div>
                            <div className='dc-side-card__progress-track'>
                                <div
                                    className='dc-side-card__progress-fill'
                                    style={{ width: `${Math.min(100, Math.max(0, parseFloat(strengthPct)))}%` }}
                                />
                            </div>
                        </div>

                        <div className='dc-side-card__stats-box'>
                            <div className='dc-side-card__stat-row'>
                                <span><Localize i18n_default_text='Total Ticks' /></span>
                                <strong>{ticks.length}</strong>
                            </div>
                            <div className='dc-side-card__stat-row'>
                                <span><Localize i18n_default_text='Pip Size' /></span>
                                <strong>{pipSize}</strong>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
});

export default Dcircles;
