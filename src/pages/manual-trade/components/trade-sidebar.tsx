import React, { useState, useMemo } from 'react';
import './trade-sidebar.scss';
import { Localize } from '@deriv-com/translations';
import { useStore } from '@/hooks/useStore';
import { useProposal } from '@/hooks/api/trade/useProposal';
import { useBuyContract } from '@/hooks/api/trade/useBuyContract';
import RecentPositions from './recent-positions';

const CONTRACT_CATEGORIES = [
    { label: 'Rise/Fall', value: 'rise_fall' },
    { label: 'Over/Under', value: 'over_under' },
    { label: 'Matches/Differs', value: 'matches_differs' },
    { label: 'Even/Odd', value: 'even_odd' },
];

const TradeSidebar = () => {
    const { chart_store, client } = useStore();
    const { symbol } = chart_store;
    const currency = client.currency || 'USD';

    const [contractCategory, setContractCategory] = useState('rise_fall');
    const [duration, setDuration] = useState(5);
    const [durationUnit, setDurationUnit] = useState('t'); // t = ticks, s = seconds, m = minutes
    const [stake, setStake] = useState(10);
    const [lastDigitPrediction, setLastDigitPrediction] = useState(0);

    const isDigitContract = contractCategory === 'over_under' || contractCategory === 'matches_differs';

    // Map category to specific contract types
    const contractTypes = useMemo(() => {
        switch (contractCategory) {
            case 'rise_fall': return { up: 'CALL', down: 'PUT' };
            case 'over_under': return { up: 'DIGITOVER', down: 'DIGITUNDER' };
            case 'matches_differs': return { up: 'DIGITMATCH', down: 'DIGITDIFF' };
            case 'even_odd': return { up: 'DIGITEVEN', down: 'DIGITODD' };
            default: return { up: 'CALL', down: 'PUT' };
        }
    }, [contractCategory]);

    // Proposal Configs
    const baseConfig = useMemo(() => {
        if (!symbol) return null;
        return {
            currency,
            amount: stake,
            basis: 'stake' as const,
            duration,
            duration_unit: durationUnit,
            symbol,
            ...(isDigitContract && { barrier: lastDigitPrediction.toString() })
        };
    }, [symbol, currency, stake, duration, durationUnit, isDigitContract, lastDigitPrediction]);

    const upConfig = baseConfig ? { ...baseConfig, contract_type: contractTypes.up } : null;
    const downConfig = baseConfig ? { ...baseConfig, contract_type: contractTypes.down } : null;

    const { proposal: upProposal, error: upError } = useProposal(upConfig);
    const { proposal: downProposal, error: downError } = useProposal(downConfig);

    const { buy, isBuying } = useBuyContract();

    const handleBuy = (proposal: any) => {
        if (!proposal || isBuying) return;
        buy(proposal.id, proposal.ask_price);
    };

    return (
        <div className='trade-sidebar'>
            <div className='trade-sidebar__header'>
                <h3><Localize i18n_default_text='Trade Parameters' /></h3>
            </div>
            
            <div className='trade-sidebar__content'>
                {/* Contract Category */}
                <div className='trade-sidebar__section'>
                    <label><Localize i18n_default_text='Trade Type' /></label>
                    <select 
                        value={contractCategory} 
                        onChange={(e) => setContractCategory(e.target.value)}
                        className='trade-sidebar__select'
                    >
                        {CONTRACT_CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                    </select>
                </div>

                {/* Last Digit Prediction (Conditional) */}
                {isDigitContract && (
                    <div className='trade-sidebar__section'>
                        <label><Localize i18n_default_text='Last Digit Prediction' /></label>
                        <div className='trade-sidebar__digit-selector'>
                            {Array.from({ length: 10 }).map((_, i) => (
                                <button
                                    key={i}
                                    className={`trade-sidebar__digit-btn ${lastDigitPrediction === i ? 'trade-sidebar__digit-btn--active' : ''}`}
                                    onClick={() => setLastDigitPrediction(i)}
                                >
                                    {i}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Duration */}
                <div className='trade-sidebar__section'>
                    <label><Localize i18n_default_text='Duration' /></label>
                    <div className='trade-sidebar__input-group'>
                        <input 
                            type='number' 
                            value={duration} 
                            onChange={(e) => setDuration(Number(e.target.value))}
                            min={1}
                            className='trade-sidebar__input'
                        />
                        <select 
                            value={durationUnit} 
                            onChange={(e) => setDurationUnit(e.target.value)}
                            className='trade-sidebar__select trade-sidebar__select--small'
                        >
                            <option value='t'>Ticks</option>
                            <option value='s'>Seconds</option>
                            <option value='m'>Minutes</option>
                        </select>
                    </div>
                </div>

                {/* Stake */}
                <div className='trade-sidebar__section'>
                    <label><Localize i18n_default_text='Stake' /> (USD)</label>
                    <input 
                        type='number' 
                        value={stake} 
                        onChange={(e) => setStake(Number(e.target.value))}
                        min={0.35}
                        step={1}
                        className='trade-sidebar__input'
                    />
                </div>
            </div>

            {/* Buy Buttons */}
            <div className='trade-sidebar__footer'>
                <div className='trade-sidebar__buy-container'>
                    <button 
                        className='trade-sidebar__buy-btn trade-sidebar__buy-btn--up' 
                        disabled={!!upError || !upProposal || isBuying}
                        onClick={() => handleBuy(upProposal)}
                    >
                        <span className='trade-sidebar__buy-label'>
                            {contractCategory === 'rise_fall' ? 'Rise' : 
                             contractCategory === 'over_under' ? 'Over' : 
                             contractCategory === 'matches_differs' ? 'Matches' : 'Even'}
                        </span>
                        <span className='trade-sidebar__buy-payout'>
                            {upError ? <span className='trade-sidebar__error'>{upError}</span> : 
                             upProposal ? `${upProposal.payout} ${currency}` : 'Loading...'}
                        </span>
                    </button>
                    <button 
                        className='trade-sidebar__buy-btn trade-sidebar__buy-btn--down' 
                        disabled={!!downError || !downProposal || isBuying}
                        onClick={() => handleBuy(downProposal)}
                    >
                        <span className='trade-sidebar__buy-label'>
                            {contractCategory === 'rise_fall' ? 'Fall' : 
                             contractCategory === 'over_under' ? 'Under' : 
                             contractCategory === 'matches_differs' ? 'Differs' : 'Odd'}
                        </span>
                        <span className='trade-sidebar__buy-payout'>
                            {downError ? <span className='trade-sidebar__error'>{downError}</span> : 
                             downProposal ? `${downProposal.payout} ${currency}` : 'Loading...'}
                        </span>
                    </button>
                </div>
            </div>
            
            {/* Recent Positions Placeholder */}
            <div className='trade-sidebar__positions-container'>
                <RecentPositions />
            </div>
        </div>
    );
};

export default TradeSidebar;
