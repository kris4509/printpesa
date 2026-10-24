import { getNextVolatilityScanSymbol, getVolatilityScanSymbols } from '../volatility-market-scan';

describe('volatility market scanning', () => {
    it('places the selected market first and skips unavailable or duplicate symbols', () => {
        expect(
            getVolatilityScanSymbols('1HZ25V', ['R_10', '1HZ25V', 'R_10', 'R_100'], ['R_10', '1HZ25V'])
        ).toEqual(['1HZ25V', 'R_10']);
    });

    it('keeps available candidates when the selected market is not a volatility market', () => {
        expect(getVolatilityScanSymbols('frxEURUSD', ['R_10', 'R_25'], ['R_25'])).toEqual(['R_25']);
    });

    it('cycles through markets in order and returns null for an empty scan list', () => {
        const symbols = ['R_10', 'R_25'];

        expect(getNextVolatilityScanSymbol(symbols, -1)).toEqual({ index: 0, symbol: 'R_10' });
        expect(getNextVolatilityScanSymbol(symbols, 0)).toEqual({ index: 1, symbol: 'R_25' });
        expect(getNextVolatilityScanSymbol(symbols, 1)).toEqual({ index: 0, symbol: 'R_10' });
        expect(getNextVolatilityScanSymbol([], 0)).toBeNull();
    });
});
