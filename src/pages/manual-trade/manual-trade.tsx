import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import ChartWrapper from '../chart/chart-wrapper';
import TradeSidebar from './components/trade-sidebar';
import PositionsPanel from './components/positions-panel';
import { useStore } from '@/hooks/useStore';
import { useDigitFrequencies } from '@/hooks/api/trade/useDigitFrequencies';
import './manual-trade.scss';

const getRankMap = (counts: number[]) => {
    const uniqueCounts = Array.from(new Set(counts)).sort((a, b) => b - a);
    const rankMap: Array<'highest' | 'second' | 'lowest' | 'second_low' | 'neutral'> = Array(10).fill('neutral');

    if (uniqueCounts.length > 1) {
        const top1 = uniqueCounts[0];
        const top2 = uniqueCounts[1];
        const bot1 = uniqueCounts[uniqueCounts.length - 1];
        const bot2 = uniqueCounts.length > 2 ? uniqueCounts[uniqueCounts.length - 2] : null;

        counts.forEach((count, digit) => {
            if (count === top1) rankMap[digit] = 'highest';
            else if (count === top2) rankMap[digit] = 'second';
            else if (count === bot1 && uniqueCounts.length > 2) rankMap[digit] = 'lowest';
            else if (bot2 !== null && count === bot2 && uniqueCounts.length > 3) rankMap[digit] = 'second_low';
            else rankMap[digit] = 'neutral';
        });
    }

    return rankMap;
};

const DigitDistribution = ({ digitFrequencies = [] }: { digitFrequencies?: number[] }) => {
    const counts = digitFrequencies.map(value => value ?? 0);
    const totalCount = counts.reduce((sum, value) => sum + value, 0) || 1;
    const percentages = counts.map(count => ((count / totalCount) * 100).toFixed(2));
    const rankMap = getRankMap(counts);

    const getFirstDigitForRank = (rankType: 'highest' | 'second' | 'lowest' | 'second_low') => {
        const index = rankMap.findIndex(rank => rank === rankType);
        if (index === -1) return null;
        return { digit: index, pct: percentages[index] };
    };

    const highestInfo = getFirstDigitForRank('highest');
    const secondInfo = getFirstDigitForRank('second');
    const lowestInfo = getFirstDigitForRank('lowest');
    const secondLowInfo = getFirstDigitForRank('second_low');

    return (
        <div className='manual-trade__digit-card'>
            <span className='manual-trade__digit-title'>DIGIT DISTRIBUTION</span>
            <div className='manual-trade__digit-distribution'>
                {percentages.map((pct, digit) => (
                    <div
                        key={digit}
                        className={`manual-trade__digit-circle manual-trade__digit-circle--${rankMap[digit]}`}
                    >
                        <span className='manual-trade__digit-num'>{digit}</span>
                        <span className='manual-trade__digit-pct'>{pct}%</span>
                    </div>
                ))}
            </div>
            <div className='manual-trade__summary-grid'>
                <div className='manual-trade__summary-card manual-trade__summary-card--highest'>
                    <span className='manual-trade__summary-label'>HIGHEST</span>
                    <span className='manual-trade__summary-val'>{highestInfo ? `${highestInfo.digit} (${highestInfo.pct}%)` : '---'}</span>
                </div>
                <div className='manual-trade__summary-card manual-trade__summary-card--second'>
                    <span className='manual-trade__summary-label'>2ND</span>
                    <span className='manual-trade__summary-val'>{secondInfo ? `${secondInfo.digit} (${secondInfo.pct}%)` : '---'}</span>
                </div>
                <div className='manual-trade__summary-card manual-trade__summary-card--lowest'>
                    <span className='manual-trade__summary-label'>LOWEST</span>
                    <span className='manual-trade__summary-val'>{lowestInfo ? `${lowestInfo.digit} (${lowestInfo.pct}%)` : '---'}</span>
                </div>
                <div className='manual-trade__summary-card manual-trade__summary-card--second-low'>
                    <span className='manual-trade__summary-label'>2ND LOW</span>
                    <span className='manual-trade__summary-val'>{secondLowInfo ? `${secondLowInfo.digit} (${secondLowInfo.pct}%)` : '---'}</span>
                </div>
            </div>
        </div>
    );
};

const ManualTrade = observer(() => {
    const { chart_store } = useStore();
    const { symbol } = chart_store;
    const { frequencies } = useDigitFrequencies(symbol, 1000);
    const [showChartOnMobile, setShowChartOnMobile] = useState(false);

    return (
        <div className='manual-trade'>
            {/* Left: chart */}
            <div className={`manual-trade__chart-area${showChartOnMobile ? '' : ' manual-trade__chart-area--collapsed'}`}>
                <div className='manual-trade__chart-content'>
                    <ChartWrapper show_digits_stats={false} />
                    <DigitDistribution digitFrequencies={frequencies} />
                </div>
            </div>

            {/* Right: sidebar + positions */}
            <div className='manual-trade__right-panel'>
                <div className='manual-trade__mobile-toggle'>
                    <button
                        type='button'
                        className='manual-trade__mobile-toggle-btn'
                        onClick={() => setShowChartOnMobile(prev => !prev)}
                    >
                        {showChartOnMobile ? 'Hide chart' : 'Show chart'}
                    </button>
                </div>
                <TradeSidebar digitFrequencies={frequencies} />
                <PositionsPanel />
            </div>
        </div>
    );
});

export default ManualTrade;
