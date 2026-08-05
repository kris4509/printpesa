type Update = {
    date: string;
    title: string;
    description?: string;
};

const UPDATES: Update[] = [
    { date: '2026-08-01', title: 'AI Market Analyzer improved', description: 'Faster insights and lower latency.' },
    { date: '2026-07-25', title: 'New Best Bots added', description: 'Community-driven bots curated for performance.' },
    { date: '2026-07-10', title: 'Manual Trading module released', description: 'Real-time terminal with order management.' },
    { date: '2026-06-30', title: 'Performance optimizations', description: 'Reduced bundle size and improved caching.' },
    { date: '2026-06-12', title: 'Improved onboarding', description: 'Guided flows for new users.' },
];

export default UPDATES;
