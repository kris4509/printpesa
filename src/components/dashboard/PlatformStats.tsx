import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const stats = [
    { key: 'users', label: 'Active Users', value: 2481 },
    { key: 'bots', label: 'Bots Created', value: 13852 },
    { key: 'signals', label: 'Signals Today', value: 124 },
    { key: 'status', label: 'Platform Status', value: 'Operational' },
];

const useCountUp = (node: HTMLElement | null, target: number) => {
    useEffect(() => {
        if (!node) return;
        let start = 0;
        const duration = 900;
        const startTime = performance.now();
        const tick = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const current = Math.floor(progress * target);
            node.textContent = current.toLocaleString();
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [node, target]);
};

const PlatformStats: React.FC = () => {
    const refs = useRef<Record<string, HTMLElement | null>>({});

    useEffect(() => {
        stats.forEach(s => {
            if (s.key !== 'status') {
                const node = refs.current[s.key];
                if (node) {
                    let start = 0;
                    const duration = 900;
                    const startTime = performance.now();
                    const tick = (now: number) => {
                        const progress = Math.min((now - startTime) / duration, 1);
                        const current = Math.floor(progress * (s.value as number));
                        node.textContent = current.toLocaleString();
                        if (progress < 1) requestAnimationFrame(tick);
                    };
                    requestAnimationFrame(tick);
                }
            }
        });
    }, []);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='bg-gray-900 rounded-lg p-4 shadow-sm border border-black/30'>
            <h3 className='text-sm font-semibold text-white mb-3'>Platform Statistics</h3>
            <div className='grid grid-cols-2 gap-3 text-xs'>
                {stats.map(s => (
                    <div key={s.key} className='p-3 rounded-md bg-black/20'>
                        <div className='text-gray-300'>{s.label}</div>
                        <div className='text-white text-lg font-semibold mt-1'>
                            {s.key === 'status' ? s.value : <span ref={el => (refs.current[s.key] = el)}>{0}</span>}
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default PlatformStats;
