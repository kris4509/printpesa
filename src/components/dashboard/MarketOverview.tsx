import React from 'react';
import { motion } from 'framer-motion';

const MarketOverview: React.FC = () => {
    const mock = {
        sentiment: 'Bullish',
        confidence: 82,
        recommended: 'Volatility 10',
        signal: 'High',
        status: 'Market Active',
    };

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className='bg-gray-900 rounded-lg p-4 shadow-sm border border-black/30'>
            <h3 className='text-sm font-semibold text-white mb-2'>Today's Market Overview</h3>
            <div className='text-xs text-gray-300'>
                <div className='mb-2'>Market Sentiment: <span className='text-cyan-400 ml-2'>{mock.sentiment}</span></div>
                <div className='mb-2'>Confidence:</div>
                <div className='w-full bg-black/20 rounded-full h-2 mb-2'><div style={{ width: `${mock.confidence}%` }} className='h-2 rounded-full bg-cyan-400' /></div>
                <div className='mb-2'>Recommended Market: <strong className='text-white ml-2'>{mock.recommended}</strong></div>
                <div className='mb-2'>Signal Strength: <span className='text-green-400 ml-2'>{mock.signal}</span></div>
                <div className='inline-block px-2 py-1 rounded-md bg-green-900 text-green-300 text-xs'>{mock.status}</div>
            </div>
        </motion.div>
    );
};

export default MarketOverview;
