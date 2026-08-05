import React, { useState, useMemo, useCallback, useEffect } from 'react';
import './trade-sidebar.scss';
import { useStore } from '@/hooks/useStore';
import { useProposal } from '@/hooks/api/trade/useProposal';
import { useBuyContract } from '@/hooks/api/trade/useBuyContract';

// ─── Types ────────────────────────────────────────────────────────────────────
type ContractSide = 'up' | 'down';

interface DurationUnitOption {
    value: string;
    label: string;
    min: number;
    max: number;
}

interface ContractCategory {
    label: string;
    value: string;
    upLabel: string;
    downLabel: string;
    hasDigit: boolean;
    hasEquals: boolean;
    durationUnits: DurationUnitOption[];
    defaultDurationUnit: string;
    defaultDuration: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
// Digit contracts (DIGITEVEN/ODD/OVER/UNDER/MATCH/DIFF) only ever accept
// tick-based duration on the Deriv API — sending seconds/minutes/hours/days
// for these contract types is what triggers "Input validation failed" errors.
const TICK_ONLY_UNITS: DurationUnitOption[] = [{ value: 't', label: 'Ticks', min: 1, max: 10 }];

const RISE_FALL_UNITS: DurationUnitOption[] = [
    { value: 't', label: 'Ticks', min: 1, max: 10 },
    { value: 's', label: 'Seconds', min: 15, max: 3600 },
    { value: 'm', label: 'Minutes', min: 1, max: 1440 },
    { value: 'h', label: 'Hours', min: 1, max: 24 },
    { value: 'd', label: 'Days', min: 1, max: 365 },
];

const CONTRACT_CATEGORIES: ContractCategory[] = [
    { label: 'Even/Odd', value: 'even_odd', upLabel: 'Even', downLabel: 'Odd', hasDigit: false, hasEquals: false, durationUnits: TICK_ONLY_UNITS, defaultDurationUnit: 't', defaultDuration: 5 },
    { label: 'Over/Under', value: 'over_under', upLabel: 'Over', downLabel: 'Under', hasDigit: true, hasEquals: false, durationUnits: TICK_ONLY_UNITS, defaultDurationUnit: 't', defaultDuration: 5 },
    { label: 'Matches/Differs', value: 'matches_differs', upLabel: 'Matches', downLabel: 'Differs', hasDigit: true, hasEquals: false, durationUnits: TICK_ONLY_UNITS, defaultDurationUnit: 't', defaultDuration: 5 },
    { label: 'Rise/Fall', value: 'rise_fall', upLabel: 'Rise', downLabel: 'Fall', hasDigit: false, hasEquals: true, durationUnits: RISE_FALL_UNITS, defaultDurationUnit: 'm', defaultDuration: 5 },
];

const HELP_URL_MAP: Record<string, string> = {
    even_odd: 'https://deriv.com/trade-types/ups-and-downs/even-odd/',
    over_under: 'https://deriv.com/trade-types/ups-and-downs/over-under/',
    matches_differs: 'https://deriv.com/trade-types/ups-and-downs/matches-differs/',
    rise_fall: 'https://deriv.com/trade-types/ups-and-downs/rise-fall/',
};

const CONTRACT_TYPE_MAP: Record<string, { up: string; down: string; upEquals?: string; downEquals?: string }> = {
    rise_fall: { up: 'CALL', down: 'PUT', upEquals: 'CALLE', downEquals: 'PUTE' },
    over_under: { up: 'DIGITOVER', down: 'DIGITUNDER' },
    matches_differs: { up: 'DIGITMATCH', down: 'DIGITDIFF' },
    even_odd: { up: 'DIGITEVEN', down: 'DIGITODD' },
};

// Same rank-based color assignment used on the Dcircles page, so digit
// coloring is consistent (and correlates with live data the same way)
// across the whole app rather than each page inventing its own scheme.
const getRankMap = (counts: number[]) => {
    const uniqueCounts = Array.from(new Set(counts)).sort((a, b) => b - a);
    const rankMap: Array<'highest' | 'second' | 'lowest' | 'second_low' | 'neutral'> = Array(10).fill('neutral');

    if (uniqueCounts.length > 1) {
        const top1 = uniqueCounts[0];
        const top2 = uniqueCounts[1];
        const bot1 = uniqueCounts[uniqueCounts.length - 1];
        const bot2 = uniqueCounts.length > 2 ? uniqueCounts[uniqueCounts.length - 2] : null;

        counts.forEach((count, digit) => {
            if (count === top1) rankMap[digit] = 'highest';
            else if (count === top2) rankMap[digit] = 'second';
            else if (count === bot1 && uniqueCounts.length > 2) rankMap[digit] = 'lowest';
            else if (bot2 !== null && count === bot2 && uniqueCounts.length > 3) rankMap[digit] = 'second_low';
            else rankMap[digit] = 'neutral';
        });
    }

    return rankMap;
};

const getDigitColor = (rank: 'highest' | 'second' | 'lowest' | 'second_low' | 'neutral' | undefined) => {
    switch (rank) {
        case 'highest': return '#4caf50';
        case 'second': return '#2196f3';
        case 'lowest': return '#f44336';
        case 'second_low': return '#ffeb3b';
        default: return undefined;
    }
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const DigitGrid = ({
    selected,
    onChange,
    digitFrequencies,
}: {
    selected: number;
    onChange: (d: number) => void;
    digitFrequencies: number[];
}) => {
    const total = digitFrequencies.reduce((a, b) => a + b, 0) || 1;
    const rankMap = getRankMap(digitFrequencies);

    return (
        <div className='ts-digit-grid'>
            {Array.from({ length: 10 }, (_, i) => {
                const freq = digitFrequencies[i] ?? 0;
                const pct = ((freq / total) * 100).toFixed(1);
                const color = getDigitColor(rankMap[i]);
                return (
                    <button
                        key={i}
                        className={`ts-digit-grid__btn${selected === i ? ' ts-digit-grid__btn--active' : ''}`}
                        style={color ? { borderColor: color } : undefined}
                        onClick={() => onChange(i)}
                        type='button'
                    >
                        <span className='ts-digit-grid__num'>{i}</span>
                        <span className='ts-digit-grid__pct' style={color ? { color } : undefined}>{pct}%</span>
                    </button>
                );
            })}
        </div>
    );
};

const ToggleSwitch = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <div className='ts-toggle-row'>
        <span className='ts-toggle-row__label'>{label}</span>
        <button
            type='button'
            className={`ts-switch${checked ? ' ts-switch--on' : ''}`}
            role='switch'
            aria-checked={checked}
            onClick={() => onChange(!checked)}
        >
            <span className='ts-switch__knob' />
        </button>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const TradeSidebar = ({ digitFrequencies = [] }: { digitFrequencies?: number[] }) => {
    const { chart_store, client } = useStore();
    const { symbol } = chart_store;
    const currency = client.currency || 'USD';

    const DEFAULT_CATEGORY = CONTRACT_CATEGORIES.find(c => c.value === 'over_under') ?? CONTRACT_CATEGORIES[0];

    const [categoryValue, setCategoryValue] = useState(DEFAULT_CATEGORY.value);
    const [side, setSide] = useState<ContractSide>('up');
    const [lastDigit, setLastDigit] = useState(5);
    const [duration, setDuration] = useState(DEFAULT_CATEGORY.defaultDuration);
    const [durationUnit, setDurationUnit] = useState(DEFAULT_CATEGORY.defaultDurationUnit);
    const [allowEquals, setAllowEquals] = useState(false);
    const [stake, setStake] = useState(10);
    const [isBulkTrade, setIsBulkTrade] = useState(false);
    const [editDuration, setEditDuration] = useState(false);
    const [editStake, setEditStake] = useState(false);
    const [draftDuration, setDraftDuration] = useState(String(DEFAULT_CATEGORY.defaultDuration));
    const [draftDurationUnit, setDraftDurationUnit] = useState(DEFAULT_CATEGORY.defaultDurationUnit);
    const [draftStake, setDraftStake] = useState('10');

    const category = CONTRACT_CATEGORIES.find(c => c.value === categoryValue) ?? CONTRACT_CATEGORIES[0];
    const contractTypes = CONTRACT_TYPE_MAP[categoryValue];
    const categoryIndex = CONTRACT_CATEGORIES.findIndex(c => c.value === categoryValue);

    const moveCategory = (offset: number) => {
        const nextIndex = (categoryIndex + offset + CONTRACT_CATEGORIES.length) % CONTRACT_CATEGORIES.length;
        handleCategoryChange(CONTRACT_CATEGORIES[nextIndex].value);
    };
    const useEquals = category.hasEquals && allowEquals;
    const contractType = side === 'up'
        ? (useEquals && contractTypes.upEquals ? contractTypes.upEquals : contractTypes.up)
        : (useEquals && contractTypes.downEquals ? contractTypes.downEquals : contractTypes.down);

    const activeUnit = category.durationUnits.find(u => u.value === durationUnit) ?? category.durationUnits[0];

    // Keep duration/unit valid whenever the category changes (this is the main
    // fix for the "Properties not allowed" bug — digit contracts must never be
    // sent with a non-tick duration_unit left over from another category).
    const handleCategoryChange = (val: string) => {
        const cat = CONTRACT_CATEGORIES.find(c => c.value === val);
        if (!cat) return;
        setCategoryValue(val);
        setSide('up');
        setAllowEquals(false);
        setDurationUnit(cat.defaultDurationUnit);
        setDuration(cat.defaultDuration);
    };

    // Clamp duration if it falls outside the active unit's allowed range
    useEffect(() => {
        if (duration < activeUnit.min) setDuration(activeUnit.min);
        if (duration > activeUnit.max) setDuration(activeUnit.max);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeUnit.value]);

    const proposalConfig = useMemo(() => {
        if (!symbol) return null;
        return {
            contract_type: contractType,
            currency,
            amount: stake,
            basis: 'stake' as const,
            duration,
            duration_unit: durationUnit,
            symbol,
            ...(category.hasDigit && { barrier: lastDigit.toString() }),
        };
    }, [symbol, currency, stake, duration, durationUnit, contractType, category.hasDigit, lastDigit]);

    const { proposal, error: proposalError, isLoading } = useProposal(proposalConfig);
    const { buy, isBuying, buyError, buyResult } = useBuyContract();

    const handleBuy = useCallback(() => {
        if (!proposal || isBuying) return;
        buy(proposal.id, proposal.ask_price);
    }, [proposal, isBuying, buy]);

    const payoutAmount = proposal?.payout ? Number(proposal.payout).toFixed(2) : null;
    const hasError = !!proposalError || !!buyError;

    return (
        <div className='trade-sidebar'>

            <div className='trade-sidebar__header trade-sidebar__card'>
                <button
                    type='button'
                    className='trade-sidebar__nav-btn'
                    onClick={() => moveCategory(-1)}
                    aria-label='Previous trade type'
                >
                    ‹
                </button>
                <span className='trade-sidebar__current-category'>{category.label}</span>
                <button
                    type='button'
                    className='trade-sidebar__nav-btn'
                    onClick={() => moveCategory(1)}
                    aria-label='Next trade type'
                >
                    ›
                </button>
            </div>

            <a
                className='trade-sidebar__help-link'
                href={HELP_URL_MAP[categoryValue]}
                target='_blank'
                rel='noopener noreferrer'
            >
                How to trade {category.label}? <span className='trade-sidebar__help-arrow'>›</span>
            </a>

            <div className='trade-sidebar__section trade-sidebar__card trade-sidebar__toggle-card'>
                <div className='trade-sidebar__toggle'>
                    <button
                        className={`trade-sidebar__toggle-btn trade-sidebar__toggle-btn--up${side === 'up' ? ' trade-sidebar__toggle-btn--active' : ''}`}
                        onClick={() => setSide('up')}
                        type='button'
                    >
                        {category.upLabel}
                    </button>
                    <button
                        className={`trade-sidebar__toggle-btn trade-sidebar__toggle-btn--down${side === 'down' ? ' trade-sidebar__toggle-btn--active' : ''}`}
                        onClick={() => setSide('down')}
                        type='button'
                    >
                        {category.downLabel}
                    </button>
                </div>
            </div>

            {category.hasDigit && (
                <div className='trade-sidebar__section trade-sidebar__card trade-sidebar__digit-card'>
                    <span className='trade-sidebar__section-label'>Last digit prediction</span>
                    <DigitGrid
                        selected={lastDigit}
                        onChange={setLastDigit}
                        digitFrequencies={digitFrequencies}
                    />
                </div>
            )}

            {/* ── Duration ── */}
            <div className='trade-sidebar__section trade-sidebar__card'>
                {editDuration ? (
                    <div className='trade-sidebar__editable-block'>
                        <span className='trade-sidebar__section-label'>Duration</span>
                        <div className='trade-sidebar__edit-row'>
                            <input
                                autoFocus
                                type='number'
                                min={activeUnit.min}
                                max={activeUnit.max}
                                className='trade-sidebar__input'
                                value={draftDuration}
                                onChange={e => setDraftDuration(e.target.value)}
                            />
                            <select
                                className='trade-sidebar__select'
                                value={draftDurationUnit}
                                onChange={e => {
                                    const nextUnit = category.durationUnits.find(u => u.value === e.target.value) ?? category.durationUnits[0];
                                    setDraftDurationUnit(nextUnit.value);
                                    // Re-clamp the draft value to the newly chosen unit's range
                                    const n = Number(draftDuration) || nextUnit.min;
                                    setDraftDuration(String(Math.min(Math.max(n, nextUnit.min), nextUnit.max)));
                                }}
                            >
                                {category.durationUnits.map(u => (
                                    <option key={u.value} value={u.value}>{u.label}</option>
                                ))}
                            </select>
                            <button
                                className='trade-sidebar__ok-btn'
                                onClick={() => {
                                    const unit = category.durationUnits.find(u => u.value === draftDurationUnit) ?? category.durationUnits[0];
                                    const n = Number(draftDuration) || unit.min;
                                    setDuration(Math.min(Math.max(n, unit.min), unit.max));
                                    setDurationUnit(unit.value);
                                    setEditDuration(false);
                                }}
                            >
                                OK
                            </button>
                        </div>
                        <span className='trade-sidebar__hint'>{activeUnit.min}–{activeUnit.max} {activeUnit.label.toLowerCase()}</span>
                    </div>
                ) : (
                    <div className='trade-sidebar__display-field' onClick={() => { setDraftDuration(String(duration)); setDraftDurationUnit(durationUnit); setEditDuration(true); }} role='button' tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') setEditDuration(true); }}>
                        <span className='trade-sidebar__section-label'>Duration</span>
                        <span className='trade-sidebar__display-value'>{duration} {activeUnit.label} <span className='ts-edit-icon'>✏</span></span>
                    </div>
                )}
            </div>

            {/* ── Stake ── */}
            <div className='trade-sidebar__section trade-sidebar__card'>
                {editStake ? (
                    <div className='trade-sidebar__editable-block'>
                        <span className='trade-sidebar__section-label'>Stake</span>
                        <div className='trade-sidebar__edit-row'>
                            <input
                                autoFocus
                                type='number'
                                min={0.35}
                                step={1}
                                className='trade-sidebar__input'
                                value={draftStake}
                                onChange={e => setDraftStake(e.target.value)}
                            />
                            <span className='trade-sidebar__currency'>{currency}</span>
                            <button className='trade-sidebar__ok-btn' onClick={() => {
                                setStake(Number(draftStake) || 10);
                                setEditStake(false);
                            }}>OK</button>
                        </div>
                    </div>
                ) : (
                    <div className='trade-sidebar__display-field' onClick={() => { setDraftStake(String(stake)); setEditStake(true); }} role='button' tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') setEditStake(true); }}>
                        <span className='trade-sidebar__section-label'>Stake</span>
                        <span className='trade-sidebar__display-value'>{stake} {currency} <span className='ts-edit-icon'>✏</span></span>
                    </div>
                )}
            </div>

            <div className='trade-sidebar__section trade-sidebar__card'>
                <ToggleSwitch checked={isBulkTrade} onChange={setIsBulkTrade} label='Bulk trades' />
            </div>

            {/* ── Allow equals (Rise/Fall only) ── */}
            {category.hasEquals && (
                <div className='trade-sidebar__section trade-sidebar__card'>
                    <ToggleSwitch checked={allowEquals} onChange={setAllowEquals} label='Allow equals' />
                </div>
            )}

            {/* ── Error ── */}
            {hasError && (
                <div className='trade-sidebar__error'>
                    {proposalError || buyError}
                </div>
            )}

            {/* ── Buy Result Feedback ── */}
            {buyResult && (
                <div className='trade-sidebar__success'>
                    ✓ Contract #{buyResult.contract_id} purchased!
                </div>
            )}

            {/* ── Buy button ── */}
            <div className='trade-sidebar__buy-footer'>
                <div className='trade-sidebar__buy-buttons'>
                    <button
                        className={`trade-sidebar__buy-btn trade-sidebar__buy-btn--up`}
                        disabled={hasError || !proposal || isBuying || isLoading}
                        onClick={handleBuy}
                        type='button'
                    >
                        <span className='trade-sidebar__buy-label'>
                            {isBuying ? 'Placing trade…' : category.upLabel}
                        </span>
                        {payoutAmount && !isLoading && !isBuying && (
                            <span className='trade-sidebar__buy-payout'>
                                Payout {payoutAmount} {currency}
                            </span>
                        )}
                        {isLoading && (
                            <span className='trade-sidebar__buy-payout'>Calculating…</span>
                        )}
                    </button>
                    <button
                        className={`trade-sidebar__buy-btn trade-sidebar__buy-btn--down`}
                        disabled={hasError || !proposal || isBuying || isLoading}
                        onClick={handleBuy}
                        type='button'
                    >
                        <span className='trade-sidebar__buy-label'>
                            {isBuying ? 'Placing trade…' : category.downLabel}
                        </span>
                        {payoutAmount && !isLoading && !isBuying && (
                            <span className='trade-sidebar__buy-payout'>
                                Payout {payoutAmount} {currency}
                            </span>
                        )}
                        {isLoading && (
                            <span className='trade-sidebar__buy-payout'>Calculating…</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TradeSidebar;
