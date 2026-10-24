import {
    createVirtualHookState,
    evaluateVirtualDigitContract,
    recordRealHookTrade,
    recordVirtualHookTrade,
    shouldContinueVirtualHook,
} from '../virtual-hook';

describe('Virtual Hook', () => {
    it.each([
        ['DIGITOVER', 5, 4, true],
        ['DIGITOVER', 4, 4, false],
        ['DIGITUNDER', 3, 4, true],
        ['DIGITUNDER', 4, 4, false],
        ['DIGITEVEN', 8, undefined, true],
        ['DIGITODD', 7, undefined, true],
        ['DIGITMATCH', 2, 2, true],
        ['DIGITDIFF', 2, 2, false],
    ])('evaluates %s digit %s against %s as %s', (type, digit, barrier, expected) => {
        expect(evaluateVirtualDigitContract(type, digit, barrier)).toBe(expected);
    });

    it('switches to real after the configured number of consecutive virtual losses', () => {
        const initial = createVirtualHookState({ enabled: true, maxVirtualLosses: 1, stake: 0.35 });
        const after_loss = recordVirtualHookTrade(initial, false);

        expect(initial.phase).toBe('virtual');
        expect(after_loss.phase).toBe('real');
        expect(after_loss.awaitingRealTrade).toBe(true);
        expect(shouldContinueVirtualHook(initial)).toBe(true);
        expect(shouldContinueVirtualHook(after_loss)).toBe(true);
    });

    it('resets the consecutive virtual-loss count after a virtual win', () => {
        const initial = createVirtualHookState({ enabled: true, maxVirtualLosses: 2 });
        const after_first_loss = recordVirtualHookTrade(initial, false);
        const after_win = recordVirtualHookTrade(after_first_loss, true);
        const after_next_loss = recordVirtualHookTrade(after_win, false);

        expect(after_first_loss.consecutiveVirtualLosses).toBe(1);
        expect(after_win.consecutiveVirtualLosses).toBe(0);
        expect(after_next_loss.phase).toBe('virtual');
        expect(after_next_loss.consecutiveVirtualLosses).toBe(1);
    });

    it('switches back to virtual after the configured count of real wins', () => {
        const real_state = {
            ...createVirtualHookState({ enabled: true, realWinsBeforeVirtual: 2 }),
            phase: 'real',
        };
        const after_first_win = recordRealHookTrade(real_state, 0.2);
        const after_loss = recordRealHookTrade(after_first_win, -0.35);
        const after_second_win = recordRealHookTrade(after_loss, 0.1);

        expect(after_first_win.phase).toBe('real');
        expect(after_first_win.realWins).toBe(1);
        expect(after_loss.realWins).toBe(1);
        expect(after_second_win.phase).toBe('virtual');
        expect(after_second_win.realWins).toBe(0);
    });

    it('does not alter behavior when Virtual Hook is disabled', () => {
        const state = createVirtualHookState();

        expect(state.phase).toBe('real');
        expect(shouldContinueVirtualHook(state)).toBe(false);
        expect(recordVirtualHookTrade(state, false)).toBe(state);
        expect(recordRealHookTrade(state, -1)).toBe(state);
    });

    it('rejects invalid enabled settings and unsupported contracts', () => {
        expect(() => createVirtualHookState({ enabled: true, maxVirtualLosses: 0 })).toThrow(
            'Virtual Hook consecutive virtual losses must be a positive integer.'
        );
        expect(() => createVirtualHookState({ enabled: true, realWinsBeforeVirtual: 0 })).toThrow(
            'Virtual Hook real wins threshold must be a positive integer.'
        );
        expect(() => createVirtualHookState({ enabled: true, stake: 0 })).toThrow(
            'Virtual Hook stake must be a positive number.'
        );
        expect(() => evaluateVirtualDigitContract('CALL', 5, undefined)).toThrow(
            'Virtual Hook does not support CALL contracts.'
        );
        expect(() => evaluateVirtualDigitContract('DIGITOVER', 5, undefined)).toThrow(
            'Virtual Hook received an invalid Digit Over barrier.'
        );
    });
});
