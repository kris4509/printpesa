import React, { useState } from 'react';
import { motion } from 'framer-motion';
import TRADING_TIPS from '@/data/tradingTips';

const TradingTip: React.FC = () => {
    const [tipIndex, setTipIndex] = useState(Math.floor(Math.random() * TRADING_TIPS.length));

    const refresh = () => setTipIndex(Math.floor(Math.random() * TRADING_TIPS.length));

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='bg-gray-900 rounded-lg p-4 shadow-sm border border-black/30'>
            <div className='flex items-center justify-between'>
                <div>
                    <div className='text-sm text-amber-400 font-semibold'>💡 Trading Tip</div>
                    <div className='text-white mt-2'>{TRADING_TIPS[tipIndex]}</div>
                </div>
                <button onClick={refresh} className='text-sm text-cyan-400'>Refresh Tip</button>
            </div>
        </motion.div>
    );
};

export default TradingTip;
