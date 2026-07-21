import ChartWrapper from '../chart/chart-wrapper';
import TradeSidebar from './components/trade-sidebar';
import './manual-trade.scss';

const ManualTrade = () => {
    return (
        <div className='manual-trade'>
            <div className='manual-trade__chart-container'>
                <ChartWrapper show_digits_stats={false} />
            </div>
            <div className='manual-trade__sidebar'>
                <TradeSidebar />
            </div>
        </div>
    );
};

export default ManualTrade;
