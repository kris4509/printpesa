const digit_contracts = ['DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITMATCH', 'DIGITDIFF'];

export const createVirtualHookState = ({
    enabled = false,
    maxVirtualLosses = 1,
    realWinsBeforeVirtual = 1,
    stake = 0.35,
} = {}) => {
    const is_enabled = enabled === true;
    const max_virtual_losses = Number(maxVirtualLosses);
    const real_wins_before_virtual = Number(realWinsBeforeVirtual);
    const virtual_stake = Number(stake);

    if (is_enabled && (!Number.isInteger(max_virtual_losses) || max_virtual_losses < 1)) {
        throw new Error('Virtual Hook consecutive virtual losses must be a positive integer.');
    }

    if (is_enabled && (!Number.isInteger(real_wins_before_virtual) || real_wins_before_virtual < 1)) {
        throw new Error('Virtual Hook real wins threshold must be a positive integer.');
    }

    if (is_enabled && (!Number.isFinite(virtual_stake) || virtual_stake <= 0)) {
        throw new Error('Virtual Hook stake must be a positive number.');
    }

    return {
        enabled: is_enabled,
        phase: is_enabled ? 'virtual' : 'real',
        maxVirtualLosses: max_virtual_losses,
        realWinsBeforeVirtual: real_wins_before_virtual,
        stake: virtual_stake,
        consecutiveVirtualLosses: 0,
        realWins: 0,
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

    const consecutive_virtual_losses = is_win ? 0 : state.consecutiveVirtualLosses + 1;
    if (consecutive_virtual_losses >= state.maxVirtualLosses) {
        return {
            ...state,
            phase: 'real',
            consecutiveVirtualLosses: 0,
            awaitingRealTrade: true,
        };
    }

    return {
        ...state,
        consecutiveVirtualLosses: consecutive_virtual_losses,
    };
};

export const recordRealHookTrade = (state, profit) => {
    if (!state.enabled || state.phase !== 'real' || profit <= 0) {
        return state;
    }

    const real_wins = state.realWins + 1;
    if (real_wins < state.realWinsBeforeVirtual) {
        return {
            ...state,
            realWins: real_wins,
        };
    }

    return {
        ...state,
        phase: 'virtual',
        consecutiveVirtualLosses: 0,
        realWins: 0,
    };
};

export const shouldContinueVirtualHook = state =>
    Boolean(state?.enabled && (state.phase === 'virtual' || state.awaitingRealTrade));
