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




// ─── BotCard ──────────────────────────────────────────────────────────────────
interface BotCardProps {
    bot: (typeof BOT_CATALOGUE)[number];
    onLoad: (bot: (typeof BOT_CATALOGUE)[number]) => void;
    isLoading: boolean;
}

const BotCard = ({ bot, onLoad, isLoading }: BotCardProps) => (
    <div className='best-bots__card'>
        <div className='best-bots__card-top'>
            <div className='best-bots__card-name-row'>
                <span className='best-bots__card-name'>{bot.name}</span>
                {bot.isPremium && (
                    <span className='best-bots__badge' title='Premium Bot'>★ PREMIUM</span>
                )}
            </div>
            <p className='best-bots__card-desc'>{bot.description}</p>
        </div>
        <button
            className={`best-bots__load-btn${isLoading ? ' best-bots__load-btn--loading' : ''}`}
            onClick={() => onLoad(bot)}
            disabled={isLoading}
            aria-label={`Load ${bot.name} into Bot Builder`}
        >
            {isLoading ? 'LOADING...' : 'Load'}
        </button>
    </div>
);

// ─── BestBots page ────────────────────────────────────────────────────────────
const BestBots = observer(() => {
    const { dashboard } = useStore();
    const { setActiveTab } = dashboard;
    const [loadingBotId, setLoadingBotId] = useState<number | null>(null);
    // New state to toggle between free bots and premium bots store view
    const [activeSection, setActiveSection] = useState<'free' | 'store'>('free');

    const handleLoadBot = async (bot: (typeof BOT_CATALOGUE)[number]) => {
        setLoadingBotId(bot.id);

        try {
            if (bot.xmlFile) {
                // Fetch the XML from the public/bots/ static directory
                const response = await fetch(`/bots/${encodeURIComponent(bot.xmlFile)}`);
                if (response.ok) {
                    const xmlContent = await response.text();
                    // Use the same load() helper the rest of the app uses
                    await load({
                        block_string: xmlContent,
                        file_name: bot.name,
                        workspace: window?.Blockly?.derivWorkspace,
                        from: save_types.LOCAL,
                        drop_event: null,
                        strategy_id: null,
                        showIncompatibleStrategyDialog: null,
                    });
                }
            }
        } catch (err) {
            console.warn(`Could not load bot "${bot.name}":`, err);
        } finally {
            // Always navigate to Bot Builder tab
            setActiveTab(DBOT_TABS.BOT_BUILDER);
            setLoadingBotId(null);
        }
    };

    // Determine which bots to display based on the active tab
    const displayedBots = BOT_CATALOGUE.filter(bot => {
        if (activeSection === 'free') {
            return !STORE_BOT_NAMES.includes(bot.name);
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

            {/* Tab navigation for Free Bots / Bots Store */}
            <div className='best-bots__tabs'>
                <button
                    className={`best-bots__tab ${activeSection === 'free' ? 'best-bots__tab--active' : ''}`}
                    onClick={() => setActiveSection('free')}
                >
                    Free Bots
                </button>
                <button
                    className={`best-bots__tab ${activeSection === 'store' ? 'best-bots__tab--active' : ''}`}
                    onClick={() => setActiveSection('store')}
                >
                    Bots Store
                </button>
            </div>

            {/* Scrollable Card Grid */}
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
