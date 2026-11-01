const MAX_PIP_SIZE = 20;

export const getPipSize = (value: unknown): number | null => {
    const pip = Number(value);
    if (!Number.isFinite(pip) || pip < 0) return null;
    if (Number.isInteger(pip) && pip <= MAX_PIP_SIZE) return pip;
    if (pip >= 1) return null;

    const pipSize = Math.round(-Math.log10(pip));
    return Math.abs(10 ** -pipSize - pip) < Number.EPSILON * 10 ? pipSize : null;
};

export const getMarketPipSize = (symbol: { pip?: unknown; pip_size?: unknown }): number | null => {
    if (symbol.pip !== undefined) {
        const pipIncrement = Number(symbol.pip);
        if (Number.isFinite(pipIncrement) && pipIncrement > 0) {
            return pipIncrement >= 1 ? 0 : getPipSize(pipIncrement);
        }
    }

    return getPipSize(symbol.pip_size);
};
