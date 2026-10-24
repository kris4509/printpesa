const digit_contracts = ['DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITMATCH', 'DIGITDIFF'];

export const createVirtualHookState = ({
    enabled = false,
    stake = 0.35,
} = {}) => {
    const is_enabled = enabled === true;
    const virtual_stake = Number(stake);

    if (is_enabled && (!Number.isFinite(virtual_stake) || virtual_stake <= 0)) {
        throw new Error('Virtual Hook stake must be a positive number.');
    }

    return {
        enabled: is_enabled,
        phase: is_enabled ? 'virtual' : 'real',
        stake: virtual_stake,
        awaitingRealTrade: false,
    };
};

export const evaluateVirtualDigitContract = (contract_type, digit, barrier) => {
    if (!digit_contracts.includes(contract_type)) {
        throw new Error(`Virtual Hook does not support ${contract_type} contracts.`);
    }

    if (!Number.isInteger(digit) || digit < 0 || digit > 9) {
        throw new Error('Virtual Hook received an invalid exit digit.');
    }

    const prediction = Number(barrier);

    switch (contract_type) {
        case 'DIGITEVEN':
            return digit % 2 === 0;
        case 'DIGITODD':
            return digit % 2 !== 0;
        case 'DIGITOVER':
            if (!Number.isInteger(prediction) || prediction < 0 || prediction >= 9) {
                throw new Error('Virtual Hook received an invalid Digit Over barrier.');
            }
            return digit > prediction;
        case 'DIGITUNDER':
            if (!Number.isInteger(prediction) || prediction <= 0 || prediction > 9) {
                throw new Error('Virtual Hook received an invalid Digit Under barrier.');
            }
            return digit < prediction;
        case 'DIGITMATCH':
            if (!Number.isInteger(prediction) || prediction < 0 || prediction > 9) {
                throw new Error('Virtual Hook received an invalid Digit Match prediction.');
            }
            return digit === prediction;
        case 'DIGITDIFF':
            if (!Number.isInteger(prediction) || prediction < 0 || prediction > 9) {
                throw new Error('Virtual Hook received an invalid Digit Diff prediction.');
            }
            return digit !== prediction;
        default:
            return false;
    }
};

export const recordVirtualHookTrade = (state, is_win) => {
    if (!state.enabled || state.phase !== 'virtual') {
        return state;
    }

    if (is_win) {
        return {
            ...state,
            phase: 'real',
            awaitingRealTrade: true,
        };
    }

    return state;
};

export const recordRealHookTrade = (state, profit) => {
    if (!state.enabled || state.phase !== 'real' || profit >= 0) {
        return state;
    }

    return {
        ...state,
        phase: 'virtual',
        awaitingRealTrade: false,
    };
};

export const shouldContinueVirtualHook = state =>
    Boolean(state?.enabled && (state.phase === 'virtual' || state.awaitingRealTrade));
