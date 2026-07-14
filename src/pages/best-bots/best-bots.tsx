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
];


// ─── BotRow ───────────────────────────────────────────────────────────────────
interface BotRowProps {
    bot: (typeof BOT_CATALOGUE)[number];
    onLoad: (bot: (typeof BOT_CATALOGUE)[number]) => void;
    isLoading: boolean;
}

const BotRow = ({ bot, onLoad, isLoading }: BotRowProps) => (
    <tr className='best-bots__row'>
        <td className='best-bots__cell best-bots__cell--name'>
            <div className='best-bots__name-container'>
                <span className='best-bots__bot-name'>{bot.name}</span>
                {bot.isPremium && (
                    <span className='best-bots__badge' title='Premium Bot'>
                        ★ PREMIUM
                    </span>
                )}
            </div>
        </td>
        <td className='best-bots__cell best-bots__cell--desc'>
            {bot.description}
        </td>
        <td className='best-bots__cell best-bots__cell--action'>
            <button
                className={`best-bots__load-btn${isLoading ? ' best-bots__load-btn--loading' : ''}`}
                onClick={() => onLoad(bot)}
                disabled={isLoading}
                aria-label={`Load ${bot.name} into Bot Builder`}
            >
                {isLoading ? 'LOADING...' : 'LOAD'}
            </button>
        </td>
    </tr>
);

// ─── BestBots page ────────────────────────────────────────────────────────────
const BestBots = observer(() => {
    const { dashboard } = useStore();
    const { setActiveTab } = dashboard;
    const [loadingBotId, setLoadingBotId] = useState<number | null>(null);

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

    return (
        <div className='best-bots' id='id-best-bots-content'>
            {/* Fixed Hero Header */}
            <div className='best-bots__hero'>
                <h1>Best Bots</h1>
                <p>Discover our top-performing trading bots designed for maximum profitability.</p>
            </div>

            {/* Scrollable Bot Table Container */}
            <div className='best-bots__scroll-container'>
                <div className='best-bots__table-wrapper'>
                    <table className='best-bots__table'>
                        <thead>
                            <tr>
                                <th className='best-bots__header best-bots__header--name'>Bot Name</th>
                                <th className='best-bots__header best-bots__header--desc'>Description</th>
                                <th className='best-bots__header best-bots__header--action'>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {BOT_CATALOGUE.map(bot => (
                                <BotRow
                                    key={bot.id}
                                    bot={bot}
                                    onLoad={handleLoadBot}
                                    isLoading={loadingBotId === bot.id}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
});

export default BestBots;
