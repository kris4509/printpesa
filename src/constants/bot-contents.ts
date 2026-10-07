type TTabsTitle = {
    [key: string]: string | number;
};

type TDashboardTabIndex = {
    [key: string]: number;
};

export const tabs_title: TTabsTitle = Object.freeze({
    WORKSPACE: 'Workspace',
    CHART: 'Chart',
});

export const DBOT_TABS: TDashboardTabIndex = Object.freeze({
    DASHBOARD: 0,
    BOT_BUILDER: 1,
    DCIRCLES: 2,
    BEST_BOTS: 3,
    MARKET_ANALYZER: 4,
    // MANUAL_TRADE: 5, // Preserved for future use
    TUTORIAL: 5,
    RISK_TOOLS: 6,
});

export const MAX_STRATEGIES = 10;

export const TAB_IDS = [
    'id-dbot-dashboard',
    'id-bot-builder',
    'id-dcircles',
    'id-best-bots',
    'id-market-analyzer',
    // 'id-manual-trade', // Preserved for future use
    'id-tutorials',
    'id-risk-tools',
];


export const DEBOUNCE_INTERVAL_TIME = 500;
