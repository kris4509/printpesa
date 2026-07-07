import { useState, useMemo, useEffect } from 'react';

interface ExchangeRate {
    KES: number; // USD to KES rate (1 USD = X KES)
    USD: number; // 1 USD
}

const EXCHANGE_RATES: ExchangeRate = {
    KES: 129.5, // Fixed rate: 1 USD = 129.5 KES (update as needed)
    USD: 1,
};

export const useCurrencyConverter = (initialCurrency: string = 'USD') => {
    // Use global preference from localStorage
    const [displayCurrency, setDisplayCurrencyState] = useState<'USD' | 'KES'>(() => {
        try {
            const saved = localStorage.getItem('preferred_currency');
            return (saved === 'KES' ? 'KES' : 'USD') as 'USD' | 'KES';
        } catch {
            return (initialCurrency === 'KES' ? 'KES' : 'USD') as 'USD' | 'KES';
        }
    });

    const setDisplayCurrency = (currency: 'USD' | 'KES') => {
        setDisplayCurrencyState(currency);
        try {
            localStorage.setItem('preferred_currency', currency);
        } catch (e) {
            console.warn('Failed to save currency preference:', e);
        }
    };

    const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
        if (fromCurrency === toCurrency) return amount;

        // Normalize currency code (remove spaces, convert to uppercase)
        const from = fromCurrency?.toUpperCase().trim() || 'USD';
        const to = toCurrency?.toUpperCase().trim() || 'USD';

        // If both are the same, no conversion needed
        if (from === to) return amount;

        // Check if the currencies are supported
        if (!EXCHANGE_RATES[from as keyof ExchangeRate] || !EXCHANGE_RATES[to as keyof ExchangeRate]) {
            return amount; // Return original if conversion not possible
        }

        // Convert to USD first, then to target currency
        const amountInUSD = amount / (EXCHANGE_RATES[from as keyof ExchangeRate] || 1);
        return amountInUSD * (EXCHANGE_RATES[to as keyof ExchangeRate] || 1);
    };

    const getExchangeRate = (fromCurrency: string, toCurrency: string): number => {
        const from = fromCurrency?.toUpperCase().trim() || 'USD';
        const to = toCurrency?.toUpperCase().trim() || 'USD';

        if (from === to) return 1;

        const rateFrom = EXCHANGE_RATES[from as keyof ExchangeRate] || 1;
        const rateTo = EXCHANGE_RATES[to as keyof ExchangeRate] || 1;

        return rateTo / rateFrom;
    };

    const formatCurrency = (amount: number, currency: string, decimalPlaces: number = 2): string => {
        const formatted = amount.toFixed(decimalPlaces);
        const currencySymbol = currency === 'KES' ? 'KSh' : '$';
        const currencyCode = currency === 'KES' ? 'KES' : 'USD';

        return `${currencySymbol}${formatted} ${currencyCode}`;
    };

    return {
        displayCurrency,
        setDisplayCurrency,
        convertCurrency,
        getExchangeRate,
        formatCurrency,
    };
};

export default useCurrencyConverter;
