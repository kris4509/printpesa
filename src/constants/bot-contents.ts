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
    BEST_BOTS: 2,
    MANUAL_TRADE: 3,
    TUTORIAL: 4,
    MARKET_ANALYZER: 5,
    DCIRCLES: 6,
});

export const MAX_STRATEGIES = 10;

export const TAB_IDS = [
    'id-dbot-dashboard',
    'id-bot-builder',
    'id-best-bots',
    'id-manual-trade',
    'id-tutorials',
    'id-market-analyzer',
    'id-dcircles',
];

export const DEBOUNCE_INTERVAL_TIME = 500;
