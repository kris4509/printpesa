import { getMarketPipSize, getPipSize } from '../market-pip-size';

describe('market pip size', () => {
    it('uses integer pip precision values directly', () => {
        expect(getPipSize(2)).toBe(2);
        expect(getPipSize(3)).toBe(3);
    });

    it('converts decimal pip increments to precision values', () => {
        expect(getPipSize(0.01)).toBe(2);
        expect(getPipSize(0.001)).toBe(3);
        expect(getPipSize(0.0001)).toBe(4);
    });

    it('prefers the active-symbol pip increment and rejects invalid metadata', () => {
        expect(getMarketPipSize({ pip: 0.001, pip_size: 2 })).toBe(3);
        expect(getMarketPipSize({ pip: 1, pip_size: 3 })).toBe(0);
        expect(getMarketPipSize({ pip_size: 3 })).toBe(3);
        expect(getMarketPipSize({ pip: 0.003 })).toBeNull();
        expect(getMarketPipSize({})).toBeNull();
    });
});
