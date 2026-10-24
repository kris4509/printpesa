export type TDigitFrequencyAnalysis =
    | 'MOST_FREQUENT'
    | 'SECOND_MOST_FREQUENT'
    | 'LEAST_FREQUENT'
    | 'SECOND_LEAST_FREQUENT';

export type TDigitPercentageAnalysis = 'EVEN_PERCENTAGE' | 'ODD_PERCENTAGE' | 'OVER' | 'UNDER';

const isDigit = (value: number) => Number.isInteger(value) && value >= 0 && value <= 9;
const isValidBarrier = (value: number | undefined): value is number =>
    typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 9;

export const getDigitCounts = (digits: readonly number[]) => {
    const counts = Array<number>(10).fill(0);
    digits.forEach(digit => {
        if (isDigit(digit)) {
            counts[digit]++;
        }
    });
    return counts;
};

export const getDigitFrequency = (digits: readonly number[], analysis_type: TDigitFrequencyAnalysis) => {
    const counts = getDigitCounts(digits);
    if (!counts.some(Boolean)) {
        return null;
    }

    const frequencies = Array.from(new Set(counts)).sort((a, b) => b - a);
    const rank = {
        MOST_FREQUENT: 0,
        SECOND_MOST_FREQUENT: 1,
        LEAST_FREQUENT: frequencies.length - 1,
        SECOND_LEAST_FREQUENT: frequencies.length - 2,
    }[analysis_type];
    const frequency = frequencies[rank];

    return frequency === undefined ? null : counts.findIndex(count => count === frequency);
};

export const getDigitPercentage = (
    digits: readonly number[],
    analysis_type: TDigitPercentageAnalysis,
    barrier?: number
) => {
    if (!['EVEN_PERCENTAGE', 'ODD_PERCENTAGE', 'OVER', 'UNDER'].includes(analysis_type)) {
        return null;
    }

    const valid_digits = digits.filter(isDigit);
    if (!valid_digits.length) {
        return null;
    }

    let comparison_barrier: number | undefined;
    if ((analysis_type === 'OVER' || analysis_type === 'UNDER') && !isValidBarrier(barrier)) {
        return null;
    }
    if (analysis_type === 'OVER' || analysis_type === 'UNDER') {
        comparison_barrier = barrier;
    }

    const matching_digits = valid_digits.filter(digit => {
        switch (analysis_type) {
            case 'EVEN_PERCENTAGE':
                return digit % 2 === 0;
            case 'ODD_PERCENTAGE':
                return digit % 2 !== 0;
            case 'OVER':
                return comparison_barrier !== undefined && digit > comparison_barrier;
            case 'UNDER':
                return comparison_barrier !== undefined && digit < comparison_barrier;
            default:
                return false;
        }
    });

    return (matching_digits.length / valid_digits.length) * 100;
};
