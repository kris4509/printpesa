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

    it('keeps making virtual trades after losses and switches to real after a virtual win', () => {
        const initial = createVirtualHookState({ enabled: true, stake: 0.35 });
        const after_loss = recordVirtualHookTrade(initial, false);
        const after_win = recordVirtualHookTrade(after_loss, true);

        expect(initial.phase).toBe('virtual');
        expect(after_loss.phase).toBe('virtual');
        expect(after_win.phase).toBe('real');
        expect(after_win.awaitingRealTrade).toBe(true);
        expect(shouldContinueVirtualHook(initial)).toBe(true);
        expect(shouldContinueVirtualHook(after_win)).toBe(true);
    });

    it('stays in real mode after wins and switches back to virtual after a real loss', () => {
        const real_state = {
            ...createVirtualHookState({ enabled: true }),
            phase: 'real',
        };
        const after_win = recordRealHookTrade(real_state, 0.2);
        const after_loss = recordRealHookTrade(after_win, -0.35);

        expect(after_win.phase).toBe('real');
        expect(after_loss.phase).toBe('virtual');
        expect(after_loss.awaitingRealTrade).toBe(false);
        expect(shouldContinueVirtualHook(after_loss)).toBe(true);
    });

    it('does not switch modes for a break-even real trade', () => {
        const real_state = {
            ...createVirtualHookState({ enabled: true }),
            phase: 'real',
        };

        expect(recordRealHookTrade(real_state, 0)).toBe(real_state);
    });

    it('does not alter behavior when Virtual Hook is disabled', () => {
        const state = createVirtualHookState();

        expect(state.phase).toBe('real');
        expect(shouldContinueVirtualHook(state)).toBe(false);
        expect(recordVirtualHookTrade(state, false)).toBe(state);
        expect(recordRealHookTrade(state, -1)).toBe(state);
    });

    it('rejects invalid enabled settings and unsupported contracts', () => {
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
