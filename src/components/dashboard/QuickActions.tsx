import React from 'react';
import { motion } from 'framer-motion';

const actions = [
    {
        key: 'analyzer',
        title: 'Market Analyzer',
        desc: 'Analyze current market conditions using AI.',
        icon: (
            <svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <path d='M3 3v18h18' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
                <path d='M7 13l3-3 4 4 5-6' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
        ),
        cta: 'Open Analyzer →',
    },
    {
        key: 'bots',
        title: 'Best Bots',
        desc: 'Browse high-performing community bots.',
        icon: (
            <svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <path d='M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z' stroke='currentColor' strokeWidth='0' />
            </svg>
        ),
        cta: 'Explore Bots →',
    },
    {
        key: 'builder',
        title: 'Build Bot',
        desc: 'Create your own automated strategy.',
        icon: (
            <svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <path d='M3 7h18M3 12h18M3 17h18' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
        ),
        cta: 'Build Now →',
    },
    {
        key: 'manual',
        title: 'Manual Trading',
        desc: 'Open the manual trading terminal.',
        icon: (
            <svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <path d='M12 2l4 7h-8l4-7zM4 22h16v-2H4v2z' stroke='currentColor' strokeWidth='1' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
        ),
        cta: 'Trade Now →',
    },
];

const QuickActions: React.FC = () => (
    <motion.div initial='hidden' animate='show' variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.06 } }
    }}>
        <div className='grid grid-cols-2 gap-3'>
            {actions.map(a => (
                <motion.button
                    key={a.key}
                    whileHover={{ scale: 1.02 }}
                    className='flex items-start justify-between bg-gray-850 hover:bg-gray-800 transition rounded-lg p-3 shadow-sm border border-black/20'
                >
                    <div className='flex items-start'>
                        <div className='p-2 rounded-md bg-black/20 text-cyan-400 mr-3'>{a.icon}</div>
                        <div className='text-left'>
                            <div className='text-sm font-semibold text-white'>{a.title}</div>
                            <div className='text-xs text-gray-300'>{a.desc}</div>
                        </div>
                    </div>
                    <div className='text-cyan-400 self-center'>
                        <svg width='18' height='18' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                            <path d='M9 18l6-6-6-6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                        </svg>
                    </div>
                </motion.button>
            ))}
        </div>
    </motion.div>
);

export default QuickActions;
