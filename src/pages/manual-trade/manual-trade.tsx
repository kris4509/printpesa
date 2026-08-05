import { observer } from 'mobx-react-lite';
import ChartWrapper from '../chart/chart-wrapper';
import TradeSidebar from './components/trade-sidebar';
import PositionsPanel from './components/positions-panel';
import { useStore } from '@/hooks/useStore';
import { useDigitFrequencies } from '@/hooks/api/trade/useDigitFrequencies';
import './manual-trade.scss';

const getDigitColor = (digit: number, counts: number[]) => {
    const uniqueCounts = Array.from(new Set(counts)).sort((a, b) => b - a);
    if (uniqueCounts.length <= 1) return undefined;
    const count = counts[digit];
    if (count === uniqueCounts[0]) return '#4caf50';
    if (count === uniqueCounts[1]) return '#2196f3';
    const least = uniqueCounts[uniqueCounts.length - 1];
    if (count === least && uniqueCounts.length > 2) return '#f44336';
    const secondLeast = uniqueCounts[uniqueCounts.length - 2];
    if (count === secondLeast && uniqueCounts.length > 3) return '#ffeb3b';
    return undefined;
};

const DigitDistribution = ({ digitFrequencies = [] }: { digitFrequencies?: number[] }) => {
    const totalCount = digitFrequencies.reduce((sum, value) => sum + value, 0) || 1;
    return (
        <div className='manual-trade__digit-distribution'>
            {Array.from({ length: 10 }, (_, digit) => {
                const count = digitFrequencies[digit] ?? 0;
                const pct = ((count / totalCount) * 100).toFixed(1);
                const borderColor = getDigitColor(digit, digitFrequencies);
                return (
                    <div
                        key={digit}
                        className='manual-trade__digit-circle'
                        style={borderColor ? { borderColor } : undefined}
                    >
                        <span className='manual-trade__digit-num'>{digit}</span>
                        <span className='manual-trade__digit-pct'>{pct}%</span>
                    </div>
                );
            })}
        </div>
    );
};

const ManualTrade = observer(() => {
    const { chart_store } = useStore();
    const { symbol } = chart_store;
    const { frequencies } = useDigitFrequencies(symbol, 1000);

    return (
        <div className='manual-trade'>
            {/* Left: chart */}
            <div className='manual-trade__chart-area'>
                <div className='manual-trade__chart-content'>
                    <ChartWrapper show_digits_stats={false} />
                    <DigitDistribution digitFrequencies={frequencies} />
                </div>
            </div>

            {/* Right: sidebar + positions */}
            <div className='manual-trade__right-panel'>
                <TradeSidebar digitFrequencies={frequencies} />
                <PositionsPanel />
            </div>
        </div>
    );
});

export default ManualTrade;
