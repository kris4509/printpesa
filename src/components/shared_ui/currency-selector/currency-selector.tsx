import React from 'react';
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

    const handleToggleCurrency = (newCurrency: 'USD' | 'KES') => {
        setDisplayCurrency(newCurrency);
    };

    return (
        <div className={classNames('currency-selector', className)}>
            <div className='currency-selector__balance'>{displayBalance}</div>
            <div className='currency-selector__toggle'>
                <button
                    className={classNames('currency-selector__btn', {
                        'currency-selector__btn--active': displayCurrency === 'USD',
                    })}
                    onClick={() => handleToggleCurrency('USD')}
                    title='Display balance in USD'
                >
                    USD
                </button>
                <button
                    className={classNames('currency-selector__btn', {
                        'currency-selector__btn--active': displayCurrency === 'KES',
                    })}
                    onClick={() => handleToggleCurrency('KES')}
                    title='Display balance in KES'
                >
                    KES
                </button>
            </div>
        </div>
    );
};

export default CurrencySelector;
