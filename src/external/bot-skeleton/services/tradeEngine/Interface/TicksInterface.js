const getTicksInterface = tradeEngine => {
    return {
        getDelayTickValue: (...args) => tradeEngine.getDelayTickValue(...args),
        getCurrentStat: (...args) => tradeEngine.getCurrentStat(...args),
        getStatList: (...args) => tradeEngine.getStatList(...args),
        getLastTick: (...args) => tradeEngine.getLastTick(...args),
        getLastDigit: (...args) => tradeEngine.getLastDigit(...args),
        getNthLastDigit: (...args) => tradeEngine.getNthLastDigit(...args),
        getDigitFrequencyAnalysis: (...args) => tradeEngine.getDigitFrequencyAnalysis(...args),
        getEvenOddAnalysis: (...args) => tradeEngine.getEvenOddAnalysis(...args),
        getOverUnderAnalysis: (...args) => tradeEngine.getOverUnderAnalysis(...args),
        getTicks: (...args) => tradeEngine.getTicks(...args),
        checkDirection: (...args) => tradeEngine.checkDirection(...args),
        getOhlcFromEnd: (...args) => tradeEngine.getOhlcFromEnd(...args),
        getOhlc: (...args) => tradeEngine.getOhlc(...args),
        getLastDigitList: (...args) => tradeEngine.getLastDigitList(...args),
        getLastDigitsCondition: (...args) => tradeEngine.getLastDigitsCondition(...args),
    };
};

export default getTicksInterface;
