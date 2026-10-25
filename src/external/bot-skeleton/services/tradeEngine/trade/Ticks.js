/* eslint-disable no-promise-executor-return */
import debounce from 'lodash.debounce';
import { getLocalizedErrorMessage } from '@/constants/backend-error-messages';
import { localize } from '@deriv-com/translations';
import { getLast } from '../../../utils/binary-utils';
import { observer as globalObserver } from '../../../utils/observer';
import { api_base } from '../../api/api-base';
import { getDirection, getLastDigit } from '../utils/helpers';
import { getDigitFrequency, getDigitPercentage } from '@/utils/digit-statistics';
import { expectPositiveInteger } from '../utils/sanitize';
import { LogTypes } from '../../../constants/messages';
import { log } from '../utils/broadcast';
import * as constants from './state/constants';

let tickListenerKey;

export default Engine =>
    class Ticks extends Engine {
        async watchTicks(symbol) {
            if (symbol && this.symbol !== symbol) {
                const previous_symbol = this.symbol;
                if (tickListenerKey && previous_symbol) {
                    await this.$scope.ticksService.stopMonitor({
                        symbol: previous_symbol,
                        key: tickListenerKey,
                    });
                    tickListenerKey = null;
                }

                this.symbol = symbol;
                const { ticksService } = this.$scope;

                const callback = ticks => {
                    if (this.is_proposal_subscription_required) {
                        this.checkProposalReady();
                    }
                    const lastTick = ticks.slice(-1)[0];
                    const { epoch } = lastTick;
                    this.store.dispatch({ type: constants.NEW_TICK, payload: `${symbol}:${epoch}` });
                };

                const key = await ticksService.monitor({ symbol, callback });
                tickListenerKey = key;
            }
        }

        checkTicksPromiseExists() {
            return this.$scope.ticksService.ticks_history_promise;
        }

        getTicks(toString = false) {
            return new Promise(resolve => {
                this.$scope.ticksService.request({ symbol: this.symbol }).then(ticks => {
                    const ticks_list = ticks.map(tick => {
                        if (toString) {
                            return tick.quote.toFixed(this.getPipSize());
                        }
                        return tick.quote;
                    });

                    resolve(ticks_list);
                });
            });
        }

        getLastTick(raw, toString = false) {
            return new Promise((resolve, reject) =>
                this.$scope.ticksService
                    .request({ symbol: this.symbol })
                    .then(ticks => {
                        try {
                            let last_tick = raw ? getLast(ticks) : getLast(ticks).quote;
                            if (!raw && toString) {
                                last_tick = last_tick.toFixed(this.getPipSize());
                            }
                            resolve(last_tick);
                        } catch (error) {
                            reject(error);
                        }
                    })
                    .catch(e => {
                        if (e.code === 'MarketIsClosed') {
                            const localizedError = {
                                ...e,
                                message: getLocalizedErrorMessage(e.code, e.details),
                            };
                            globalObserver.emit('Error', localizedError);
                            resolve(e.code);
                        }
                    })
            );
        }

        getLastDigit() {
            return new Promise(resolve => this.getLastTick(false, true).then(tick => resolve(getLastDigit(tick))));
        }

        getNthLastDigit(index) {
            return new Promise(resolve => {
                const n = Number(index);
                if (!Number.isFinite(n) || n < 1) {
                    resolve(null);
                    return;
                }

                this.getTicks().then(ticks => {
                    if (!Array.isArray(ticks) || ticks.length < n) {
                        resolve(null);
                        return;
                    }

                    const target = ticks[ticks.length - n];
                    resolve(target == null ? null : getLastDigit(target.toFixed(this.getPipSize())));
                });
            });
        }

        getLastDigitList() {
            return new Promise(resolve => this.getTicks().then(ticks => resolve(this.getLastDigitsFromList(ticks))));
        }

        getRecentDigits(count) {
            const n = Number(count);
            if (!Number.isInteger(n) || n < 1 || n > 1000) {
                return Promise.resolve(null);
            }

            return this.getLastDigitList().then(digits => (digits.length < n ? null : digits.slice(-n)));
        }

        getDigitFrequencyAnalysis(count, analysis_type) {
            return this.getRecentDigits(count).then(digits => (digits ? getDigitFrequency(digits, analysis_type) : null));
        }

        getEvenOddAnalysis(count, analysis_type) {
            return this.getRecentDigits(count).then(digits =>
                digits ? getDigitPercentage(digits, analysis_type) : null
            );
        }

        getOverUnderAnalysis(count, condition_type, barrier) {
            return this.getRecentDigits(count).then(digits =>
                digits
                    ? getDigitPercentage(
                          digits,
                          condition_type,
                          Number(barrier)
                      )
                    : null
            );
        }

        getLastDigitsFromList(ticks) {
            const digits = ticks.map(tick => {
                return getLastDigit(tick.toFixed(this.getPipSize()));
            });
            return digits;
        }

        getLastDigitsCondition(count, condition, compare_value) {
            return new Promise((resolve, reject) => {
                const n = Number(count);
                const threshold = Number(compare_value);
                const normalized_condition = String(condition || '').toUpperCase();
                const recordResult = (result, digits = []) => {
                    log(LogTypes.LAST_DIGITS_ANALYSIS, {
                        market: this.symbol || 'N/A',
                        condition: normalized_condition,
                        threshold,
                        digits,
                        result,
                    });
                    resolve(result);
                };

                if (!Number.isFinite(n) || n < 1 || n > 1000) {
                    recordResult(false);
                    return;
                }

                this.getTicks().then(ticks => {
                    if (!Array.isArray(ticks) || ticks.length < n) {
                        recordResult(false);
                        return;
                    }

                    const digits = this.getLastDigitsFromList(ticks).slice(-n);
                    if (!digits.length) {
                        recordResult(false, digits);
                        return;
                    }

                    const matches = digit => {
                        switch (normalized_condition) {
                            case 'LESS_THAN':
                                return digit < threshold;
                            case 'LESS_OR_EQUAL':
                                return digit <= threshold;
                            case 'GREATER_THAN':
                                return digit > threshold;
                            case 'GREATER_OR_EQUAL':
                                return digit >= threshold;
                            case 'EQUAL':
                                return digit === threshold;
                            case 'NOT_EQUAL':
                                return digit !== threshold;
                            case 'ALL_EVEN':
                                return digit % 2 === 0;
                            case 'ALL_ODD':
                                return digit % 2 !== 0;
                            default:
                                return false;
                        }
                    };

                    if (['ALL_EVEN', 'ALL_ODD'].includes(normalized_condition)) {
                        recordResult(digits.every(matches), digits);
                        return;
                    }

                    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 9) {
                        recordResult(false, digits);
                        return;
                    }

                    recordResult(digits.every(matches), digits);
                }).catch(reject);
            });
        }

        checkDirection(dir) {
            return new Promise(resolve =>
                this.$scope.ticksService
                    .request({ symbol: this.symbol })
                    .then(ticks => resolve(getDirection(ticks) === dir))
            );
        }

        getOhlc(args) {
            const { granularity = this.options.candleInterval || 60, field } = args || {};

            return new Promise(resolve =>
                this.$scope.ticksService
                    .request({ symbol: this.symbol, granularity })
                    .then(ohlc => resolve(field ? ohlc.map(o => o[field]) : ohlc))
            );
        }

        getOhlcFromEnd(args) {
            const { index: i = 1 } = args || {};

            const index = expectPositiveInteger(Number(i), localize('Index must be a positive integer'));

            return new Promise(resolve => this.getOhlc(args).then(ohlc => resolve(ohlc.slice(-index)[0])));
        }

        getPipSize() {
            return this.$scope.ticksService.pipSizes[this.symbol];
        }

        async requestAccumulatorStats() {
            const subscription_id = this.subscription_id_for_accumulators;
            const is_proposal_requested = this.is_proposal_requested_for_accumulators;
            const proposal_request = {
                ...window.Blockly.accumulators_request,
                amount: this?.tradeOptions?.amount,
                basis: this?.tradeOptions?.basis,
                contract_type: 'ACCU',
                currency: this?.tradeOptions?.currency,
                growth_rate: this?.tradeOptions?.growth_rate,
                proposal: 1,
                subscribe: 1,
                underlying_symbol: this?.tradeOptions?.symbol,
            };
            if (!subscription_id && !is_proposal_requested) {
                this.is_proposal_requested_for_accumulators = true;
                if (proposal_request) {
                    await api_base?.api?.send(proposal_request);
                }
            }
        }

        async handleOnMessageForAccumulators() {
            let ticks_stayed_in_list = [];
            return new Promise(resolve => {
                const subscription = api_base.api.onMessage().subscribe(({ data }) => {
                    if (data.msg_type === 'proposal') {
                        try {
                            this.subscription_id_for_accumulators = data.subscription.id;
                            // this was done because we can multile arrays in the respone and the list comes in reverse order
                            const stat_list = (data.proposal.contract_details.ticks_stayed_in || []).flat().reverse();
                            ticks_stayed_in_list = [...stat_list, ...ticks_stayed_in_list];
                            if (ticks_stayed_in_list.length > 0) resolve(ticks_stayed_in_list);
                        } catch (error) {
                            globalObserver.emit('Unexpected message type or no proposal found:', error);
                        }
                    }
                });
                api_base.pushSubscription(subscription);
            });
        }

        async fetchStatsForAccumulators() {
            try {
                // request stats for accumulators
                const debouncedAccumulatorsRequest = debounce(() => this.requestAccumulatorStats(), 300);
                debouncedAccumulatorsRequest();
                // wait for proposal response
                const ticks_stayed_in_list = await this.handleOnMessageForAccumulators();
                return ticks_stayed_in_list;
            } catch (error) {
                globalObserver.emit('Error in subscription promise:', error);
                throw error;
            } finally {
                // forget all proposal subscriptions so we can fetch new stats data on new call
                await api_base?.api?.send({ forget_all: 'proposal' });
                this.is_proposal_requested_for_accumulators = false;
                this.subscription_id_for_accumulators = null;
            }
        }

        async getCurrentStat() {
            try {
                const ticks_stayed_in = await this.fetchStatsForAccumulators();
                return ticks_stayed_in?.[0];
            } catch (error) {
                globalObserver.emit('Error fetching current stat:', error);
            }
        }

        async getStatList() {
            try {
                const ticks_stayed_in = await this.fetchStatsForAccumulators();
                // we need to send only lastest 100 ticks
                return ticks_stayed_in?.slice(0, 100);
            } catch (error) {
                globalObserver.emit('Error fetching current stat:', error);
            }
        }

        async getDelayTickValue(tick_value) {
            return new Promise((resolve, reject) => {
                try {
                    const ticks = [];
                    const symbol = this.symbol;

                    const resolveAndExit = () => {
                        this.$scope.ticksService.stopMonitor({
                            symbol,
                            key: '',
                        });
                        resolve(ticks);
                        ticks.length = 0;
                    };

                    const watchTicks = tick_list => {
                        ticks.push(tick_list);
                        const current_tick = ticks.length;
                        if (current_tick === tick_value) {
                            resolveAndExit();
                        }
                    };

                    const delayExecution = tick_list => watchTicks(tick_list);

                    if (Number(tick_value) <= 0) resolveAndExit();
                    this.$scope.ticksService.monitor({ symbol, callback: delayExecution });
                } catch (error) {
                    reject(new Error(`Failed to start tick monitoring: ${error.message}`));
                }
            });
        }
    };
