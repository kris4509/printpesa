import React from 'react';
import { Localize } from '@deriv-com/translations';
import './market-analyzer.scss';

const MarketAnalyzer = () => {
    return (
        <div className='market-analyzer'>
            {/* Fixed Header */}
            <div className='market-analyzer__header'>
                <h1 className='market-analyzer__title'>
                    <Localize i18n_default_text='Market Analyzer' />
                </h1>
                <p className='market-analyzer__subtitle'>
                    <Localize i18n_default_text='Real-time market analysis and trading signals' />
                </p>
            </div>

            {/* Scrollable Content */}
            <div className='market-analyzer__scroll-container'>
                <iframe
                    src='https://krismarketanalyzer.lovable.app'
                    title='Market Analyzer'
                    className='market-analyzer__iframe'
                    sandbox='allow-same-origin allow-scripts allow-popups allow-forms allow-presentation'
                    allowFullScreen
                />
            </div>
        </div>
    );
};

export default MarketAnalyzer;
