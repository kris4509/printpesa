import React from 'react';
import { motion } from 'framer-motion';

const WelcomeCard: React.FC = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className='bg-gray-900 text-white rounded-lg p-4 shadow-sm border border-black/30'
        >
            <div className='flex items-start justify-between'>
                <div>
                    <h2 className='text-lg font-semibold text-cyan-400'>Welcome to PrintPesa 👋</h2>
                    <p className='text-sm text-gray-300 mt-1'>Your AI-powered trading companion for smarter decisions and automated trading.</p>
                </div>
                <div className='text-gray-400'>
                    <svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                        <path d='M9 18l6-6-6-6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                    </svg>
                </div>
            </div>
        </motion.div>
    );
};

export default WelcomeCard;
