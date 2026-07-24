import { observer } from 'mobx-react-lite';
import ChartWrapper from '../chart/chart-wrapper';
import TradeSidebar from './components/trade-sidebar';
import PositionsPanel from './components/positions-panel';
import { useStore } from '@/hooks/useStore';
import { useDigitFrequencies } from '@/hooks/api/trade/useDigitFrequencies';
import './manual-trade.scss';

const ManualTrade = observer(() => {
    const { chart_store } = useStore();
    const { symbol } = chart_store;
    const { frequencies } = useDigitFrequencies(symbol, 1000);

    return (
        <div className='manual-trade'>
            {/* Left: chart */}
            <div className='manual-trade__chart-area'>
                <ChartWrapper show_digits_stats={false} />
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
