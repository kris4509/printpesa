import React, { useState } from 'react';
import { Localize, localize } from '@deriv-com/translations';
import './risk-calculator.scss';

const RiskCalculator = () => {
    const [initialCapital, setInitialCapital] = useState<number>(10);

    // Calculations
    const stake = initialCapital * 0.02; // 2% of initial capital
    const takeProfit = stake * 5; // 5x stake
    const stopLoss = stake * 4; // 4 losses sum (4 × stake)

    const handleCapitalChange = (value: string) => {
        const numValue = parseFloat(value) || 0;
        setInitialCapital(Math.max(0, numValue));
    };

    const formatCurrency = (value: number): string => {
        return value.toFixed(2);
    };

    return (
        <div className='risk-calculator'>
            <div className='risk-calculator__container'>
                <h2 className='risk-calculator__title'>
                    <Localize i18n_default_text='Risk Calculator' />
                </h2>

                <div className='risk-calculator__form'>
                    {/* Initial Capital Input */}
                    <div className='risk-calculator__field'>
                        <label className='risk-calculator__label'>
                            <Localize i18n_default_text='Initial Capital' />
                        </label>
                        <div className='risk-calculator__input-wrapper'>
                            <input
                                type='number'
                                min='0'
                                step='0.01'
                                value={initialCapital}
                                onChange={e => handleCapitalChange(e.target.value)}
                                className='risk-calculator__input'
                                placeholder='Enter initial capital'
                            />
                        </div>
                    </div>

                    {/* Stake Display (2% of Capital) */}
                    <div className='risk-calculator__field'>
                        <label className='risk-calculator__label'>
                            <Localize i18n_default_text='Stake (2% of Capital)' />
                        </label>
                        <div className='risk-calculator__output'>
                            <span className='risk-calculator__output-value'>
                                {formatCurrency(stake)}
                            </span>
                        </div>
                    </div>

                    {/* Take Profit Display (5x Stake) */}
                    <div className='risk-calculator__field'>
                        <label className='risk-calculator__label'>
                            <Localize i18n_default_text='Take Profit (5x Stake)' />
                        </label>
                        <div className='risk-calculator__output'>
                            <span className='risk-calculator__output-value'>
                                {formatCurrency(takeProfit)}
                            </span>
                        </div>
                    </div>

                    {/* Stop Loss Display (4 Losses Sum) */}
                    <div className='risk-calculator__field'>
                        <label className='risk-calculator__label'>
                            <Localize i18n_default_text='Stop Loss (4 Losses Sum)' />
                        </label>
                        <div className='risk-calculator__output'>
                            <span className='risk-calculator__output-value'>
                                {formatCurrency(stopLoss)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className='risk-calculator__summary'>
                    <div className='risk-calculator__stat'>
                        <div className='risk-calculator__stat-label'>
                            <Localize i18n_default_text='Potential Profit' />
                        </div>
                        <div className='risk-calculator__stat-value risk-calculator__stat-value--profit'>
                            +{formatCurrency(takeProfit)}
                        </div>
                    </div>
                    <div className='risk-calculator__stat'>
                        <div className='risk-calculator__stat-label'>
                            <Localize i18n_default_text='Max Risk' />
                        </div>
                        <div className='risk-calculator__stat-value risk-calculator__stat-value--loss'>
                            -{formatCurrency(stopLoss)}
                        </div>
                    </div>
                    <div className='risk-calculator__stat'>
                        <div className='risk-calculator__stat-label'>
                            <Localize i18n_default_text='Risk/Reward Ratio' />
                        </div>
                        <div className='risk-calculator__stat-value'>
                            1:{(takeProfit / stopLoss).toFixed(2)}
                        </div>
                    </div>
                </div>

                <p className='risk-calculator__note'>
                    <Localize i18n_default_text='This calculator helps you manage your risk by automatically calculating stake and profit targets based on your initial capital.' />
                </p>
            </div>
        </div>
    );
};

export default RiskCalculator;
