// @ts-nocheck
import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { load, save_types } from '@/external/bot-skeleton';
import { DBOT_TABS } from '@/constants/bot-contents';
import { useStore } from '@/hooks/useStore';
import './best-bots.scss';

// ─── Bot catalogue ─────────────────────────────────────────────────────────────
// Each entry drives a card.  Set `xmlFile` to the filename (without path) you
// drop into  src/pages/best-bots/bots/  and it will be loaded on button click.
// Leave `xmlFile` as null until you add the real file.
const BOT_CATALOGUE = [
    {
        id: 1,
        name: 'AI Over 1 Bot',
        description: 'An AI-powered trading bot for Over 1 digit entries with smart waiting logic for optimal entry points.',
        isPremium: false,
        xmlFile: 'AI Over 1 Bot.xml',
    },
    {
        id: 2,
        name: 'AI Under 7 Bot',
        description: 'An AI-powered trading bot for over/under markets, targeting Under 7 digit entries.',
        isPremium: false,
        xmlFile: 'AI Under 7 Bot.xml',
    },
    {
        id: 3,
        name: 'AI Under 8 Bot',
        description: 'An AI-powered trading bot for Under 8 digit entries that waits for the best entry signals.',
        isPremium: true,
        xmlFile: 'AI Under 8 Bot.xml',
    },
    {
        id: 4,
        name: 'AUTO C4 VOLT AI PREMIUM',
        description: 'Premium AI-powered robot with advanced volt strategy. Fully automated with premium signal detection.',
        isPremium: true,
        xmlFile: 'AUTO C4 VOLT 🇬🇧 2 🇬🇧 AI PREMIUM ROBOT  (2) (1).xml',
    },
    {
        id: 5,
        name: 'Digits Over & Under — Predict Number',
        description: 'Advanced digit prediction bot for Over & Under markets. Analyses digit patterns to forecast the next outcome.',
        isPremium: true,
        xmlFile: 'Digits Over&Under - Predict Number.xml',
    },
    {
        id: 6,
        name: 'Even-Odd Analyzer Pro',
        description: 'Brain-Tutor powered Even/Odd bot with real-time digit analysis, martingale recovery, stake lists, and configurable profit targets & stop-loss.',
        isPremium: true,
        xmlFile: 'Even-Odd Analyzer Pro(Brain-Tutor).xml',
    },
    {
        id: 7,
        name: 'OVER 2 AI',
        description: 'AI-driven Over 2 strategy bot with adaptive entry detection for digit markets.',
        isPremium: false,
        xmlFile: 'OVER 2 AI.xml',
    },
    {
        id: 8,
        name: 'Over 3 Strategy',
        description: 'Precision Over 3 strategy using martingale recovery. Targets synthetic indices with configurable stake and take-profit levels.',
        isPremium: true,
        xmlFile: 'Over 3 Strategy.xml',
    },
    {
        id: 9,
        name: 'The Oracle V1',
        description: 'The Oracle — a signal-based trading bot with intelligent market reading for consistent digit trading.',
        isPremium: true,
        xmlFile: 'TheOracleV1.xml',
    },
    {
        id: 10,
        name: 'Under 9 After 2 Touches',
        description: 'Waits for 2 consecutive touch events before entering an Under 9 trade — reducing false entries.',
        isPremium: false,
        xmlFile: 'under 9 after 2 touches.xml',
    },
    {
        id: 11,
        name: 'V5 BT Pro Digits',
        description: 'Version 5 of the BT Pro Digits bot — refined digit trading strategy with improved accuracy and risk management.',
        isPremium: true,
        xmlFile: 'V5 BT Pro Digits (1).xml',
    },
    {
        id: 12,
        name: 'Under 9 Bot',
        description: 'A newly added bot targeting under 9 digits with specific market patterns.',
        isPremium: false,
        xmlFile: 'under 9 bot.xml',
    },
    {
        id: 13,
        name: 'Over 2 Pro Bot 💰',
        description: 'Waits until two consecutive ticks end in 2 or lower, then buys a Digit Over 2 contract.',
        isPremium: true,
        xmlFile: 'Over 2 Pro Bot 💰.xml',
    },
    {
        id: 14,
        name: 'Over HitnRun V2🤖',
        description: 'Tracks specific digit outcomes (like 5, 6, 0, or 4) to toggle logic states and place Digit Over trades.',
        isPremium: true,
        xmlFile: 'Over HitnRun V2🤖.xml',
    },
    {
        id: 15,
        name: 'Under HitnRun V2🤖',
        description: 'Watches tick sequences and executes a Digit Under 8 trade whenever specific digits (like 1, 7, 4, or 9) appear.',
        isPremium: true,
        xmlFile: 'Under HitnRun V2🤖.xml',
    },
    {
        id: 16,
        name: 'Osam HnR🤖',
        description: 'Automatically places a Digit Even trade on every single tick on any favourable volatility Index using 2x Martingale recovery.',
        isPremium: true,
        xmlFile: 'Osam HnR🤖.xml',
    },
    {
        id: 17,
        name: 'Over Destroyer V2💀',
        description: 'Starts with Digit Over 1 trades on the favourable volatility, then dynamically shifts target barriers (Over 3 or Under 6) if consecutive losses occur.',
        isPremium: true,
        xmlFile: 'Over Destroyer V2💀.xml',
    },
    {
        id: 18,
        name: 'Under Destroyer V2💀',
        description: 'Trades 1-tick Digit Under/Over contracts on favourable markets, switching predictions from Under 8 to Under 6 and Over 4 as losses occur.',
        isPremium: true,
        xmlFile: 'Under Destroyer V2💀.xml',
    },
    {
        id: 19,
        name: 'Market Killer💀',
        description: 'Advanced automated bot using dynamic entry points with martingale recovery to hunt for consistent profits across synthetic indices.',
        isPremium: true,
        xmlFile: 'Market Killer💀.xml',
    },
    {
        id: 20,
        name: 'Dollar printer Alpha version 2026 version 2',
        description: 'High-frequency digits bot utilizing smart take-profit and stop-loss features for aggressive yet controlled scaling.',
        isPremium: true,
        xmlFile: 'Dollar printer Alpha version 2026 version 2.xml',
    },
    {
        id: 21,
        name: 'Under 7 pro bot V2💰',
        description: 'Precision Under 7 strategy bot featuring custom digit analysis, built-in survivability metrics, and dynamic stake sizing.',
        isPremium: true,
        xmlFile: 'Under 7 pro bot V2💰.xml',
    },
    {
        id: 22,
        name: 'Nexus Flow',
        description: 'Advanced digit strategy with configurable entry signals, recovery settings, and risk controls.',
        isPremium: true,
        isAdvanced: true,
        xmlFile: 'Nexus Flow.xml',
    },
    {
        id: 23,
        name: 'Volt Sprint',
        description: 'An advanced volatility strategy with adjustable trade parameters and recovery controls.',
        isPremium: true,
        isAdvanced: true,
        xmlFile: 'Volt Sprint.xml',
    },
    {
        id: 24,
        name: 'Apex Signal',
        description: 'A signal-driven advanced bot with configurable digit entries and risk-management settings.',
        isPremium: true,
        isAdvanced: true,
        xmlFile: 'Apex Signal.xml',
    },
    {
        id: 25,
        name: 'Prism Range',
        description: 'An advanced strategy with configurable market conditions, trade entries, and recovery controls.',
        isPremium: true,
        isAdvanced: true,
        xmlFile: 'Prism Range.xml',
    },
    {
        id: 26,
        name: 'Straddle Shift',
        description: 'An advanced multi-condition strategy with adjustable trade and risk-control parameters.',
        isPremium: true,
        isAdvanced: true,
        xmlFile: 'Straddle Shift.xml',
    },
    {
        id: 27,
        name: 'Under Destroyer V3',
        description:
            'Waits for the configurable entry digit (default 9) before its first Under 8 trade, then uses its existing loss-recovery strategy.',
        isPremium: true,
        isAdvanced: true,
        xmlFile: 'Under Destroyer V3.xml',
    },
    {
        id: 28,
        name: 'Over Destroyer V3',
        description:
            'Waits for the configurable entry digit (default 5) before its first Over 1 trade, then uses its existing loss-recovery strategy.',
        isPremium: true,
        isAdvanced: true,
        xmlFile: 'Over Destroyer V3.xml',
    },
    {
        id: 29,
        name: 'Over Destroyer V2.1',
        description:
            'Waits for entry digit 5, then trades up to three consecutive wins. After a loss recovery, it pauses and waits for the entry digit again.',
        isPremium: true,
        isAdvanced: true,
        xmlFile: 'Over Destroyer V2.1.xml',
    },
    {
        id: 30,
        name: 'Under Destroyer V2.1',
        description:
            'Waits for entry digit 9, then trades up to three consecutive wins. After a loss recovery, it pauses and waits for the entry digit again.',
        isPremium: true,
        isAdvanced: true,
        xmlFile: 'Under Destroyer V2.1.xml',
    },
];

// ─── Bots Store List ───────────────────────────────────────────────────────
const STORE_BOT_NAMES = [
    'Osam HnR🤖',
    'Even-Odd Analyzer Pro',
    'Over Destroyer V2💀',
    'Under Destroyer V2💀',
    'Over HitnRun V2🤖',
    'Under HitnRun V2🤖',
    'Over 2 Pro Bot 💰',
    'Market Killer💀',
    'Dollar printer Alpha version 2026 version 2',
    'Under 7 pro bot V2💰',
];
const ADVANCED_BOT_NAMES = [
    'Nexus Flow',
    'Volt Sprint',
    'Apex Signal',
    'Prism Range',
    'Straddle Shift',
    'Under Destroyer V3',
    'Over Destroyer V3',
    'Over Destroyer V2.1',
    'Under Destroyer V2.1',
];




// ─── BotCard ──────────────────────────────────────────────────────────────────
interface BotCardProps {
    bot: (typeof BOT_CATALOGUE)[number];
    onLoad: (bot: (typeof BOT_CATALOGUE)[number]) => void;
    isLoading: boolean;
}

const BotCard = ({ bot, onLoad, isLoading }: BotCardProps) => (
    <div className={`best-bots__card${bot.isPremium ? ' best-bots__card--premium' : ''}`}>
        <div className='best-bots__card-top'>
            <div className='best-bots__card-heading'>
                <span className='best-bots__card-pin' aria-hidden='true'>
                    <svg viewBox='0 0 24 24'>
                        <path d='M8 3h8l-1 5 3 3v2H6v-2l3-3-1-5Zm4 10v8' />
                    </svg>
                </span>
                <div className='best-bots__card-title'>
                    <span className='best-bots__eyebrow'>
                        {bot.isAdvanced ? 'ADVANCED BOT' : bot.isPremium ? 'PREMIUM BOT' : 'FREE BOT'}
                    </span>
                    <span className='best-bots__card-name'>{bot.name}</span>
                </div>
                <span className={`best-bots__badge${bot.isPremium ? ' best-bots__badge--premium' : ''}`}>
                    {bot.isPremium ? 'PREMIUM' : 'FREE'}
                </span>
            </div>
            <p className='best-bots__card-desc'>{bot.description}</p>
        </div>
        <button
            className={`best-bots__load-btn${isLoading ? ' best-bots__load-btn--loading' : ''}`}
            onClick={() => onLoad(bot)}
            disabled={isLoading}
            aria-label={`Load ${bot.name} into Bot Builder`}
        >
            <span>{isLoading ? 'LOADING...' : 'LOAD BOT'}</span>
            <span className='best-bots__load-icon' aria-hidden='true'>
                <svg viewBox='0 0 24 24'>
                    <path d='M12 3v11m0 0 4-4m-4 4-4-4M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4' />
                </svg>
            </span>
        </button>
    </div>
);

// ─── BestBots page ────────────────────────────────────────────────────────────
const BestBots = observer(() => {
    const { dashboard } = useStore();
    const { setActiveTab } = dashboard;
    const [loadingBotId, setLoadingBotId] = useState<number | null>(null);
    const [activeSection, setActiveSection] = useState<'free' | 'store' | 'advanced'>('free');
    const [loadError, setLoadError] = useState('');

    const handleLoadBot = async (bot: (typeof BOT_CATALOGUE)[number]) => {
        setLoadingBotId(bot.id);
        setLoadError('');

        try {
            const response = await fetch(`/bots/${encodeURIComponent(bot.xmlFile)}`);
            if (!response.ok) {
                throw new Error(`Could not load ${bot.name} (HTTP ${response.status}). Please try again.`);
            }

            const xmlContent = await response.text();
            await load({
                block_string: xmlContent,
                file_name: bot.name,
                workspace: window?.Blockly?.derivWorkspace,
                from: save_types.LOCAL,
                drop_event: null,
                strategy_id: null,
                showIncompatibleStrategyDialog: null,
            });
            setActiveTab(DBOT_TABS.BOT_BUILDER);
        } catch (err) {
            console.error(`Could not load bot "${bot.name}":`, err);
            setLoadError(err instanceof Error ? err.message : `Could not load ${bot.name}. Please try again.`);
        } finally {
            setLoadingBotId(null);
        }
    };

    // Determine which bots to display based on the active tab
    const displayedBots = BOT_CATALOGUE.filter(bot => {
        if (activeSection === 'advanced') {
            return ADVANCED_BOT_NAMES.includes(bot.name);
        }
        if (activeSection === 'free') {
            return !STORE_BOT_NAMES.includes(bot.name) && !ADVANCED_BOT_NAMES.includes(bot.name);
        }
        // "store" section – show only the selected store bots
        return STORE_BOT_NAMES.includes(bot.name);
    });

    return (
        <div className='best-bots' id='id-best-bots-content'>
            {/* Fixed Hero Header */}
            <div className='best-bots__hero'>
                <h1>Best Bots</h1>
                <p>Discover our top-performing trading bots designed for maximum profitability.</p>
            </div>

            <div className='best-bots__tabs'>
                <button
                    type='button'
                    className={`best-bots__tab ${activeSection === 'free' ? 'best-bots__tab--active' : ''}`}
                    aria-pressed={activeSection === 'free'}
                    onClick={() => setActiveSection('free')}
                >
                    Free Bots
                </button>
                <button
                    type='button'
                    className={`best-bots__tab ${activeSection === 'store' ? 'best-bots__tab--active' : ''}`}
                    aria-pressed={activeSection === 'store'}
                    onClick={() => setActiveSection('store')}
                >
                    Bots Store
                </button>
                <button
                    type='button'
                    className={`best-bots__tab ${activeSection === 'advanced' ? 'best-bots__tab--active' : ''}`}
                    aria-pressed={activeSection === 'advanced'}
                    onClick={() => setActiveSection('advanced')}
                >
                    Advanced Bot
                </button>
            </div>

            {loadError && (
                <p className='best-bots__error' role='alert'>
                    {loadError}
                </p>
            )}

            <div className='best-bots__scroll-container'>
                <div className='best-bots__grid'>
                    {displayedBots.map(bot => (
                        <BotCard
                            key={bot.id}
                            bot={bot}
                            onLoad={handleLoadBot}
                            isLoading={loadingBotId === bot.id}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
});

export default BestBots;
