import { getDigitCounts, getDigitFrequency, getDigitPercentage } from '../digit-statistics';

describe('digit statistics', () => {
    it('counts valid digits and ignores values outside the digit range', () => {
        expect(getDigitCounts([0, 1, 1, 9, -1, 10])).toEqual([1, 2, 0, 0, 0, 0, 0, 0, 0, 1]);
    });

    it('returns frequency-ranked digits with deterministic tie-breaking', () => {
        const digits = [1, 1, 2, 2, 2, 4];

        expect(getDigitFrequency(digits, 'MOST_FREQUENT')).toBe(2);
        expect(getDigitFrequency(digits, 'SECOND_MOST_FREQUENT')).toBe(1);
        expect(getDigitFrequency(digits, 'LEAST_FREQUENT')).toBe(0);
        expect(getDigitFrequency(digits, 'SECOND_LEAST_FREQUENT')).toBe(4);
        expect(getDigitFrequency([3, 2, 3, 2], 'MOST_FREQUENT')).toBe(2);
    });

    it('returns null for frequency analysis without valid digits', () => {
        expect(getDigitFrequency([], 'MOST_FREQUENT')).toBeNull();
        expect(getDigitFrequency([-1, 10], 'MOST_FREQUENT')).toBeNull();
    });

    it('calculates even and odd percentages', () => {
        expect(getDigitPercentage([0, 1, 2, 3], 'EVEN_PERCENTAGE')).toBe(50);
        expect(getDigitPercentage([0, 1, 2, 3], 'ODD_PERCENTAGE')).toBe(50);
    });

    it('calculates strict over and under percentages against the selected digit', () => {
        const digits = [0, 2, 3, 4];

        expect(getDigitPercentage(digits, 'OVER', 2)).toBe(50);
        expect(getDigitPercentage(digits, 'UNDER', 3)).toBe(50);
        expect(getDigitPercentage(digits, 'OVER', 9)).toBe(0);
    });

    it('returns null for empty input or an invalid barrier', () => {
        expect(getDigitPercentage([], 'EVEN_PERCENTAGE')).toBeNull();
        expect(getDigitPercentage([1, 2], 'OVER', 10)).toBeNull();
    });
});
