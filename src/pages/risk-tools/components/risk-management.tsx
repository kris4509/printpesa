import React, { useState, useMemo, useEffect } from 'react';
import classNames from 'classnames';
import { useStore } from '@/hooks/useStore';
import { localize } from '@deriv-com/translations';
import './risk-management.scss';

type RiskAppetite = 'conservative' | 'moderate' | 'aggressive';
type RecoveryStyle = 'flat' | 'martingale2x' | 'martingale3x';

const RiskManagement: React.FC = () => {
    const { client } = useStore() || {};
    const [balanceInput, setBalanceInput] = useState<string>('1000');
    const [riskAppetite, setRiskAppetite] = useState<RiskAppetite>('moderate');
    const [riskPerTrade, setRiskPerTrade] = useState<number>(10);
    const [recoveryStyle, setRecoveryStyle] = useState<RecoveryStyle>('martingale2x');
    const [payoutPerWin, setPayoutPerWin] = useState<number>(95);
    const [targetWins, setTargetWins] = useState<number>(5);
    const [stopLosses, setStopLosses] = useState<number>(3);

    const balance = parseFloat(balanceInput) || 0;

    // Use live balance if user is logged in
    const handleUseMyBalance = () => {
        if (client?.balance) {
            setBalanceInput(client.balance.toString());
        }
    };

    // Auto-adjust risk per trade slider when appetite is clicked
    const handleRiskAppetiteChange = (appetite: RiskAppetite) => {
        setRiskAppetite(appetite);
        if (appetite === 'conservative') setRiskPerTrade(5);
        if (appetite === 'moderate') setRiskPerTrade(10);
        if (appetite === 'aggressive') setRiskPerTrade(15);
    };

    // Map risk percentage to label
    const riskLabel = useMemo(() => {
        if (riskPerTrade <= 5) return 'Conservative';
        if (riskPerTrade <= 10) return 'Balanced';
        if (riskPerTrade <= 15) return 'Aggressive';
        return 'High Risk';
    }, [riskPerTrade]);

    // Core Formulas
    const stake = balance * (riskPerTrade / 100);
    const takeProfit = stake * (payoutPerWin / 100) * targetWins;
    
    const calculateStopLossAmount = (consecutiveLosses: number) => {
        if (recoveryStyle === 'flat') {
            return stake * consecutiveLosses;
        } else if (recoveryStyle === 'martingale2x') {
            return stake * (Math.pow(2, consecutiveLosses) - 1);
        } else { // martingale3x
            return stake * ((Math.pow(3, consecutiveLosses) - 1) / 2);
        }
    };

    const stopLoss = calculateStopLossAmount(stopLosses);

    // Survivability Calculations
    const lossesSurvivableFlat = stake > 0 ? Math.floor(balance / stake) : 0;
    const lossesSurvivableMartingale2x = stake > 0 ? Math.floor(Math.log2(balance / stake + 1)) : 0;

    // Loss Streak Exposure chart data
    const chartData = [1, 2, 3, 4, 5].map(losses => {
        const lossAmount = calculateStopLossAmount(losses);
        const percentLost = balance > 0 ? Math.min((lossAmount / balance) * 100, 100) : 0;
        return {
            losses,
            percentLost,
            isBust: percentLost >= 100
        };
    });

    return (
        <div className='risk-management-container'>
            <div className='risk-management-header'>
                <div className='header-icon'>
                    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                        <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
                    </svg>
                </div>
                <div>
                    <h2>{localize('Risk Management')}</h2>
                    <p>{localize('Enter your balance and pick a risk level to get a recommended stake, take-profit and stop-loss target — plus how many losses your account can survive.')}</p>
                </div>
            </div>

            <div className='risk-management-grid'>
                {/* LEFT PANEL - YOUR SETUP */}
                <div className='setup-panel'>
                    <h3 className='panel-title'>Your setup</h3>

                    {/* Account Balance */}
                    <div className='input-group'>
                        <label className='input-label'>ACCOUNT BALANCE</label>
                        <div className='balance-input-wrapper'>
                            <span className='currency-prefix'>USD</span>
                            <input 
                                type='number' 
                                value={balanceInput}
                                onChange={(e) => setBalanceInput(e.target.value)}
                                className='balance-input'
                            />
                            <button className='use-balance-btn' onClick={handleUseMyBalance}>
                                Use my balance
                            </button>
                        </div>
                    </div>

                    {/* Risk Appetite */}
                    <div className='input-group'>
                        <label className='input-label'>RISK APPETITE</label>
                        <div className='segmented-control'>
                            <button 
                                className={classNames('segment-btn', { active: riskAppetite === 'conservative' })}
                                onClick={() => handleRiskAppetiteChange('conservative')}
                            >
                                <span className='title'>Conservative</span>
                                <span className='subtitle'>5%</span>
                            </button>
                            <button 
                                className={classNames('segment-btn', { active: riskAppetite === 'moderate' })}
                                onClick={() => handleRiskAppetiteChange('moderate')}
                            >
                                <span className='title'>Moderate</span>
                                <span className='subtitle'>10%</span>
                            </button>
                            <button 
                                className={classNames('segment-btn', { active: riskAppetite === 'aggressive' })}
                                onClick={() => handleRiskAppetiteChange('aggressive')}
                            >
                                <span className='title'>Aggressive</span>
                                <span className='subtitle'>15%</span>
                            </button>
                        </div>
                    </div>

                    {/* Risk Per Trade */}
                    <div className='input-group'>
                        <div className='slider-header'>
                            <label className='input-label'>RISK PER TRADE</label>
                            <div className='slider-badge'>
                                {riskPerTrade}% · {riskLabel}
                            </div>
                        </div>
                        <input 
                            type='range' 
                            min='1' 
                            max='25' 
                            value={riskPerTrade}
                            onChange={(e) => {
                                setRiskPerTrade(Number(e.target.value));
                                setRiskAppetite(undefined as any);
                            }}
                            className='slider-input risk-slider'
                        />
                        <div className='slider-labels'>
                            <span>1%</span>
                            <span>25%</span>
                        </div>
                    </div>

                    {/* Recovery Style */}
                    <div className='input-group'>
                        <label className='input-label'>RECOVERY STYLE</label>
                        <div className='segmented-control'>
                            <button 
                                className={classNames('segment-btn', { active: recoveryStyle === 'flat' })}
                                onClick={() => setRecoveryStyle('flat')}
                            >
                                <span className='title'>Flat</span>
                            </button>
                            <button 
                                className={classNames('segment-btn', { active: recoveryStyle === 'martingale2x' })}
                                onClick={() => setRecoveryStyle('martingale2x')}
                            >
                                <span className='title'>2× Martingale</span>
                            </button>
                            <button 
                                className={classNames('segment-btn', { active: recoveryStyle === 'martingale3x' })}
                                onClick={() => setRecoveryStyle('martingale3x')}
                            >
                                <span className='title'>3× Martingale</span>
                            </button>
                        </div>
                    </div>

                    {/* Payout Per Win */}
                    <div className='input-group'>
                        <div className='slider-header'>
                            <label className='input-label'>PAYOUT PER WIN</label>
                            <div className='slider-badge payout-badge'>{payoutPerWin}%</div>
                        </div>
                        <input 
                            type='range' 
                            min='50' 
                            max='200' 
                            value={payoutPerWin}
                            onChange={(e) => setPayoutPerWin(Number(e.target.value))}
                            className='slider-input payout-slider'
                        />
                    </div>
                </div>

                {/* RIGHT PANEL - RESULTS */}
                <div className='results-panel'>
                    {/* Recommended Stake */}
                    <div className='stake-card'>
                        <div className='stake-label'>RECOMMENDED STAKE PER TRADE</div>
                        <div className='stake-value'>${stake.toFixed(2)}</div>
                        <div className='stake-badges'>
                            <span className='badge'>{riskPerTrade}% of balance</span>
                            <span className='badge badge-outline'>{riskLabel}</span>
                        </div>
                    </div>

                    {/* TP & SL Row */}
                    <div className='tp-sl-row'>
                        <div className='result-card tp-card'>
                            <div className='card-header'>
                                <span className='label'>TAKE PROFIT</span>
                                <span className='percentage text-teal'>+{((takeProfit / balance) * 100 || 0).toFixed(1)}%</span>
                            </div>
                            <div className='value'>${takeProfit.toFixed(2)}</div>
                            <div className='counter-group'>
                                <span className='counter-label'>Target wins</span>
                                <div className='stepper'>
                                    <button onClick={() => setTargetWins(Math.max(1, targetWins - 1))}>−</button>
                                    <span>{targetWins}</span>
                                    <button onClick={() => setTargetWins(targetWins + 1)}>+</button>
                                </div>
                            </div>
                            <div className='subtext'>Profit after {targetWins} winning trades</div>
                        </div>

                        <div className='result-card sl-card'>
                            <div className='card-header'>
                                <span className='label'>STOP LOSS</span>
                                <span className='percentage text-red'>−{((stopLoss / balance) * 100 || 0).toFixed(1)}%</span>
                            </div>
                            <div className='value'>${stopLoss.toFixed(2)}</div>
                            <div className='counter-group'>
                                <span className='counter-label'>Stop after losses</span>
                                <div className='stepper'>
                                    <button onClick={() => setStopLosses(Math.max(1, stopLosses - 1))}>−</button>
                                    <span>{stopLosses}</span>
                                    <button onClick={() => setStopLosses(stopLosses + 1)}>+</button>
                                </div>
                            </div>
                            <div className='subtext'>Total risked over {stopLosses} consecutive losses</div>
                        </div>
                    </div>

                    {/* Survivability & Chart Row */}
                    <div className='survivability-section'>
                        <div className='survivability-stats'>
                            <div className='stat-item'>
                                <div className='stat-value text-teal'>{lossesSurvivableFlat}</div>
                                <div className='stat-label'>losses survivable · flat stake</div>
                            </div>
                            <div className='stat-divider'></div>
                            <div className='stat-item'>
                                <div className='stat-value text-amber'>{lossesSurvivableMartingale2x}</div>
                                <div className='stat-label'>losses survivable · 2× martingale</div>
                            </div>
                        </div>

                        <div className='exposure-chart-section'>
                            <div className='chart-label'>LOSS STREAK EXPOSURE</div>
                            <div className='bar-chart'>
                                {chartData.map((data, index) => (
                                    <div key={index} className='bar-group'>
                                        <div className='bar-container'>
                                            <div 
                                                className={classNames('bar-fill', { bust: data.isBust })} 
                                                style={{ height: `${data.percentLost}%` }}
                                            ></div>
                                        </div>
                                        <div className='bar-label-number'>{data.losses}</div>
                                        <div className='bar-label-percent'>{data.percentLost.toFixed(0)}%</div>
                                    </div>
                                ))}
                            </div>
                            <div className='chart-subtext'>Cumulative % of balance risked after each consecutive loss</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RiskManagement;
