import React from 'react';
import WelcomeCard from './WelcomeCard';
import QuickActions from './QuickActions';
import MarketOverview from './MarketOverview';
import TradingTip from './TradingTip';
import PlatformUpdates from './PlatformUpdates';
import PlatformStats from './PlatformStats';
import QuoteOfTheDay from './QuoteOfTheDay';

const ControlCenter: React.FC = () => {
    return (
        <aside className='w-80 p-4 bg-gradient-to-b from-gray-950 to-gray-900 h-full overflow-auto' style={{ minWidth: 280 }}>
            <div className='space-y-4'>
                <WelcomeCard />
                <QuickActions />
                <MarketOverview />
                <TradingTip />
                <PlatformUpdates />
                <PlatformStats />
                <QuoteOfTheDay />
            </div>
        </aside>
    );
};

export default ControlCenter;
