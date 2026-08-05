import React from 'react';
import { motion } from 'framer-motion';
import { Monitor, Star, Code, Zap } from 'lucide-react';
import { ChevronRight } from 'lucide-react';

const actions = [
    { key: 'analyzer', title: 'Market Analyzer', desc: 'Analyze current market conditions using AI.', icon: <Monitor /> , cta: 'Open Analyzer →' },
    { key: 'bots', title: 'Best Bots', desc: 'Browse high-performing community bots.', icon: <Star /> , cta: 'Explore Bots →' },
    { key: 'builder', title: 'Build Bot', desc: 'Create your own automated strategy.', icon: <Code /> , cta: 'Build Now →' },
    { key: 'manual', title: 'Manual Trading', desc: 'Open the manual trading terminal.', icon: <Zap /> , cta: 'Trade Now →' },
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
                        <ChevronRight />
                    </div>
                </motion.button>
            ))}
        </div>
    </motion.div>
);

export default QuickActions;
