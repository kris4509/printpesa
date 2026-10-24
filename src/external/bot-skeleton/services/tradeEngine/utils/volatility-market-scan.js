export const getVolatilityScanSymbols = (selected_symbol, candidates, available_symbols) => {
    const available = new Set(available_symbols);
    const eligible_candidates = [...new Set(candidates)].filter(symbol => available.has(symbol));

    if (selected_symbol && eligible_candidates.includes(selected_symbol)) {
        return [selected_symbol, ...eligible_candidates.filter(symbol => symbol !== selected_symbol)];
    }

    return eligible_candidates;
};

export const getNextVolatilityScanSymbol = (symbols, current_index) => {
    if (!symbols.length) return null;

    const next_index = (current_index + 1) % symbols.length;
    return {
        index: next_index,
        symbol: symbols[next_index],
    };
};
