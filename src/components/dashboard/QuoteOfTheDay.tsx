import React from 'react';
import { motion } from 'framer-motion';
import QUOTES from '@/data/quotes';

const QuoteOfTheDay: React.FC = () => {
    const index = Math.floor(Math.random() * QUOTES.length);
    const q = QUOTES[index];
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='bg-gray-900 rounded-lg p-4 shadow-sm border border-black/30'>
            <div className='text-amber-400 mb-2'>Quote of the Day</div>
            <div className='text-white italic'>“{q.text}”</div>
            {q.author && <div className='text-gray-400 mt-2 text-xs'>— {q.author}</div>}
        </motion.div>
    );
};

export default QuoteOfTheDay;
