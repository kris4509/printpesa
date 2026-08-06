import React from 'react';
import { motion } from 'framer-motion';
import UPDATES from '@/data/updates';

const PlatformUpdates: React.FC = () => (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className='bg-gray-900 rounded-lg p-4 shadow-sm border border-black/30'>
        <h3 className='text-sm font-semibold text-white mb-3'>Latest Updates</h3>
        <div className='space-y-2 text-xs text-gray-300'>
            {UPDATES.map(u => (
                <div key={u.date} className='flex items-start'>
                    <div className='mr-2 text-cyan-400'>
                        <svg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                            <path d='M9 12l2 2 4-4' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                        </svg>
                    </div>
                    <div>
                        <div className='text-white text-sm'>{u.title}</div>
                        <div className='text-gray-400 text-xs'>{u.date} • {u.description}</div>
                    </div>
                </div>
            ))}
        </div>
    </motion.div>
);

export default PlatformUpdates;
