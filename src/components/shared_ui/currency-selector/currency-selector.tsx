import React, { useState } from 'react';
import classNames from 'classnames';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import './currency-selector.scss';

interface CurrencySelectorProps {
    balance: string | number;
    currency: string;
    className?: string;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({ balance, currency, className }) => {
    const { displayCurrency, setDisplayCurrency, convertCurrency, formatCurrency } = useCurrencyConverter(currency);
    const [isOpen, setIsOpen] = useState(false);

    const numBalance = typeof balance === 'string' ? parseFloat(balance.replace(/,/g, '')) : balance;

    const getDecimalPlaces = (curr: string): number => {
        if (curr === 'KES') return 0;
        return 2;
    };

    const convertedBalance = convertCurrency(
        numBalance,
        currency,
        displayCurrency === 'KES' ? 'KES' : 'USD'
    );

    const displayBalance = formatCurrency(convertedBalance, displayCurrency, getDecimalPlaces(displayCurrency));

    const handleCurrencyChange = (newCurrency: 'USD' | 'KES') => {
        setDisplayCurrency(newCurrency);
        setIsOpen(false);
    };

    return (
        <div className={classNames('currency-selector', className)}>
            <div
                className='currency-selector__display'
                onClick={() => setIsOpen(!isOpen)}
                role='button'
                tabIndex={0}
                onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        setIsOpen(!isOpen);
                    }
                }}
            >
                <span className='currency-selector__balance'>{displayBalance}</span>
                <svg
                    className={classNames('currency-selector__chevron', {
                        'currency-selector__chevron--open': isOpen,
                    })}
                    width='12'
                    height='12'
                    viewBox='0 0 12 12'
                    fill='none'
                >
                    <path
                        d='M2 4L6 8L10 4'
                        stroke='currentColor'
                        strokeWidth='1.5'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                    />
                </svg>
            </div>

            {isOpen && (
                <div className='currency-selector__dropdown'>
                    <button
                        className={classNames('currency-selector__option', {
                            'currency-selector__option--active': displayCurrency === 'USD',
                        })}
                        onClick={() => handleCurrencyChange('USD')}
                    >
                        <span className='currency-selector__option-symbol'>$</span>
                        <span className='currency-selector__option-code'>USD</span>
                    </button>
                    <button
                        className={classNames('currency-selector__option', {
                            'currency-selector__option--active': displayCurrency === 'KES',
                        })}
                        onClick={() => handleCurrencyChange('KES')}
                    >
                        <span className='currency-selector__option-symbol'>KSh</span>
                        <span className='currency-selector__option-code'>KES</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default CurrencySelector;
