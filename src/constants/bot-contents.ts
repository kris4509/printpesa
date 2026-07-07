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
    CHART: 3,
    TUTORIAL: 4,
    MARKET_ANALYZER: 5,
});

export const MAX_STRATEGIES = 10;

export const TAB_IDS = ['id-dbot-dashboard', 'id-bot-builder', 'id-best-bots', 'id-charts', 'id-tutorials', 'id-market-analyzer'];

export const DEBOUNCE_INTERVAL_TIME = 500;
