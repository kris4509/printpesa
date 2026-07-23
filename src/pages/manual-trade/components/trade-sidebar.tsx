import React, { useState, useMemo, useCallback } from 'react';
import './trade-sidebar.scss';
import { useStore } from '@/hooks/useStore';
import { useProposal } from '@/hooks/api/trade/useProposal';
import { useBuyContract } from '@/hooks/api/trade/useBuyContract';

// ─── Types ────────────────────────────────────────────────────────────────────
type ContractSide = 'up' | 'down';

interface ContractCategory {
    label: string;
    value: string;
    upLabel: string;
    downLabel: string;
    hasDigit: boolean;
    defaultDurationUnit: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CONTRACT_CATEGORIES: ContractCategory[] = [
    { label: 'Even/Odd',        value: 'even_odd',        upLabel: 'Even',    downLabel: 'Odd',    hasDigit: false, defaultDurationUnit: 't' },
    { label: 'Over/Under',      value: 'over_under',      upLabel: 'Over',    downLabel: 'Under',  hasDigit: true,  defaultDurationUnit: 't' },
    { label: 'Matches/Differs', value: 'matches_differs', upLabel: 'Matches', downLabel: 'Differs',hasDigit: true,  defaultDurationUnit: 't' },
    { label: 'Rise/Fall',       value: 'rise_fall',       upLabel: 'Rise',    downLabel: 'Fall',   hasDigit: false, defaultDurationUnit: 't' },
];

const CONTRACT_TYPE_MAP: Record<string, { up: string; down: string }> = {
    rise_fall:        { up: 'CALL',       down: 'PUT'       },
    over_under:       { up: 'DIGITOVER',  down: 'DIGITUNDER'},
    matches_differs:  { up: 'DIGITMATCH', down: 'DIGITDIFF' },
    even_odd:         { up: 'DIGITEVEN',  down: 'DIGITODD'  },
};

const DURATION_UNITS = [
    { value: 't', label: 'Ticks' },
    { value: 's', label: 'Seconds' },
    { value: 'm', label: 'Minutes' },
    { value: 'h', label: 'Hours' },
    { value: 'd', label: 'Days' },
];

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
    const maxFreq = Math.max(...digitFrequencies, 1);
    return (
        <div className='ts-digit-grid'>
            {Array.from({ length: 10 }, (_, i) => {
                const freq = digitFrequencies[i] ?? 0;
                const pct = ((freq / (digitFrequencies.reduce((a, b) => a + b, 0) || 1)) * 100).toFixed(1);
                const isHot = freq === maxFreq;
                return (
                    <button
                        key={i}
                        className={`ts-digit-grid__btn${selected === i ? ' ts-digit-grid__btn--active' : ''}${isHot ? ' ts-digit-grid__btn--hot' : ''}`}
                        onClick={() => onChange(i)}
                        type='button'
                    >
                        <span className='ts-digit-grid__num'>{i}</span>
                        <span className='ts-digit-grid__pct'>{pct}%</span>
                    </button>
                );
            })}
        </div>
    );
};

const EditableField = ({
    label,
    value,
    onSave,
    suffix,
    children,
}: {
    label: string;
    value: string;
    onSave?: (v: string) => void;
    suffix?: string;
    children?: React.ReactNode;
}) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);

    const handleSave = () => {
        setEditing(false);
        onSave?.(draft);
    };

    if (editing) {
        return (
            <div className='ts-field ts-field--editing'>
                <span className='ts-field__label'>{label}</span>
                <div className='ts-field__edit-row'>
                    {children ? (
                        <>{children}</>
                    ) : (
                        <input
                            className='ts-field__input'
                            autoFocus
                            type='number'
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
                        />
                    )}
                    <button className='ts-field__save-btn' onClick={handleSave}>OK</button>
                </div>
            </div>
        );
    }

    return (
        <div className='ts-field' onClick={() => { setDraft(value); setEditing(true); }} role='button' tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') setEditing(true); }}>
            <span className='ts-field__label'>{label}</span>
            <span className='ts-field__value'>{value}{suffix ? ` ${suffix}` : ''} <span className='ts-field__edit-icon'>✏</span></span>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const TradeSidebar = ({ digitFrequencies = [] }: { digitFrequencies?: number[] }) => {
    const { chart_store, client } = useStore();
    const { symbol } = chart_store;
    const currency = client.currency || 'USD';

    const [categoryValue, setCategoryValue]     = useState('over_under');
    const [side, setSide]                       = useState<ContractSide>('up');
    const [lastDigit, setLastDigit]             = useState(5);
    const [duration, setDuration]               = useState(5);
    const [durationUnit, setDurationUnit]       = useState('t');
    const [stake, setStake]                     = useState(10);
    const [editDuration, setEditDuration]       = useState(false);
    const [editStake, setEditStake]             = useState(false);
    const [draftDuration, setDraftDuration]     = useState('5');
    const [draftDurationUnit, setDraftDurationUnit] = useState('t');
    const [draftStake, setDraftStake]           = useState('10');

    const category     = CONTRACT_CATEGORIES.find(c => c.value === categoryValue) ?? CONTRACT_CATEGORIES[0];
    const contractTypes = CONTRACT_TYPE_MAP[categoryValue];
    const contractType  = side === 'up' ? contractTypes.up : contractTypes.down;

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

    const handleCategoryChange = (val: string) => {
        setCategoryValue(val);
        setSide('up');
        const cat = CONTRACT_CATEGORIES.find(c => c.value === val);
        if (cat) setDurationUnit(cat.defaultDurationUnit);
    };

    const durationLabel = DURATION_UNITS.find(u => u.value === durationUnit)?.label ?? 'Ticks';
    const payoutAmount = proposal?.payout ? Number(proposal.payout).toFixed(2) : null;
    const hasError = !!proposalError || !!buyError;

    return (
        <div className='trade-sidebar'>

            {/* ── Contract type tabs ── */}
            <div className='trade-sidebar__tabs'>
                {CONTRACT_CATEGORIES.map(cat => (
                    <button
                        key={cat.value}
                        className={`trade-sidebar__tab${categoryValue === cat.value ? ' trade-sidebar__tab--active' : ''}`}
                        onClick={() => handleCategoryChange(cat.value)}
                        type='button'
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* ── Up / Down toggle ── */}
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

            {/* ── Digit prediction ── */}
            {category.hasDigit && (
                <div className='trade-sidebar__section'>
                    <span className='trade-sidebar__section-label'>Last digit prediction</span>
                    <DigitGrid
                        selected={lastDigit}
                        onChange={setLastDigit}
                        digitFrequencies={digitFrequencies}
                    />
                </div>
            )}

            {/* ── Duration ── */}
            <div className='trade-sidebar__section'>
                {editDuration ? (
                    <div className='trade-sidebar__editable-block'>
                        <span className='trade-sidebar__section-label'>Duration</span>
                        <div className='trade-sidebar__edit-row'>
                            <input
                                autoFocus
                                type='number'
                                min={1}
                                className='trade-sidebar__input'
                                value={draftDuration}
                                onChange={e => setDraftDuration(e.target.value)}
                            />
                            <select
                                className='trade-sidebar__select'
                                value={draftDurationUnit}
                                onChange={e => setDraftDurationUnit(e.target.value)}
                            >
                                {DURATION_UNITS.map(u => (
                                    <option key={u.value} value={u.value}>{u.label}</option>
                                ))}
                            </select>
                            <button className='trade-sidebar__ok-btn' onClick={() => {
                                setDuration(Number(draftDuration) || 5);
                                setDurationUnit(draftDurationUnit);
                                setEditDuration(false);
                            }}>OK</button>
                        </div>
                    </div>
                ) : (
                    <div className='trade-sidebar__display-field' onClick={() => { setDraftDuration(String(duration)); setDraftDurationUnit(durationUnit); setEditDuration(true); }} role='button' tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') setEditDuration(true); }}>
                        <span className='trade-sidebar__section-label'>Duration</span>
                        <span className='trade-sidebar__display-value'>{duration} {durationLabel} <span className='ts-edit-icon'>✏</span></span>
                    </div>
                )}
            </div>

            {/* ── Stake ── */}
            <div className='trade-sidebar__section'>
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
                <button
                    className={`trade-sidebar__buy-btn trade-sidebar__buy-btn--${side}`}
                    disabled={hasError || !proposal || isBuying || isLoading}
                    onClick={handleBuy}
                    type='button'
                >
                    <span className='trade-sidebar__buy-label'>
                        {isBuying ? 'Placing trade…' : `Buy — ${side === 'up' ? category.upLabel : category.downLabel}`}
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
    );
};

export default TradeSidebar;
