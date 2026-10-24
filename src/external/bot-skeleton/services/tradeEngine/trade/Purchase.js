import { LogTypes } from '../../../constants/messages';
import { observer as globalObserver } from '../../../utils/observer';
import { api_base } from '../../api/api-base';
import { contractStatus, info, log } from '../utils/broadcast';
import {
    doUntilDone,
    getLastDigit,
    getUUID,
    recoverFromError,
    tradeOptionToBuy,
    tradeOptionToProposal,
} from '../utils/helpers';
import { evaluateVirtualDigitContract, recordVirtualHookTrade } from '../utils/virtual-hook';
import { purchaseSuccessful, sell } from './state/actions';
import { BEFORE_PURCHASE } from './state/constants';

let delayIndex = 0;
let purchase_reference;

export default Engine =>
    class Purchase extends Engine {
        purchase(contract_type, parameters = {}, use_direct_buy = false) {
            // Prevent calling purchase twice
            if (this.store.getState().scope !== BEFORE_PURCHASE) {
                return Promise.resolve();
            }

            if (this.virtualHookState?.enabled && this.virtualHookState.phase === 'virtual') {
                return this.simulateVirtualPurchase(contract_type, parameters);
            }

            const onSuccess = response => {
                // Don't unnecessarily send a forget request for a purchased contract.
                const { buy } = response;

                contractStatus({
                    id: 'contract.purchase_received',
                    data: buy.transaction_id,
                    buy,
                });

                this.contractId = buy.contract_id;
                this.store.dispatch(purchaseSuccessful());

                if (this.is_proposal_subscription_required) {
                    this.renewProposalsOnPurchase();
                }

                if (this.virtualHookState?.enabled) {
                    this.virtualHookState = {
                        ...this.virtualHookState,
                        awaitingRealTrade: false,
                    };
                }

                delayIndex = 0;
                log(LogTypes.PURCHASE, { transaction_id: buy.transaction_id });
                info({
                    accountID: this.accountInfo.loginid,
                    totalRuns: this.updateAndReturnTotalRuns(),
                    transaction_ids: { buy: buy.transaction_id },
                    contract_type,
                    buy_price: buy.buy_price,
                });
            };

            if (this.is_proposal_subscription_required && !use_direct_buy) {
                const { id, askPrice } = this.selectProposal(contract_type);

                const action = () => api_base.api.send({ buy: id, price: askPrice });

                this.isSold = false;

                contractStatus({
                    id: 'contract.purchase_sent',
                    data: askPrice,
                });

                if (!this.options.timeMachineEnabled) {
                    return doUntilDone(action).then(onSuccess);
                }

                return recoverFromError(
                    action,
                    (errorCode, makeDelay) => {
                        // if disconnected no need to resubscription (handled by live-api)
                        if (errorCode !== 'DisconnectError') {
                            this.renewProposalsOnPurchase();
                        } else {
                            this.clearProposals();
                        }

                        const unsubscribe = this.store.subscribe(() => {
                            const { scope, proposalsReady } = this.store.getState();
                            if (scope === BEFORE_PURCHASE && proposalsReady) {
                                makeDelay().then(() => this.observer.emit('REVERT', 'before'));
                                unsubscribe();
                            }
                        });
                    },
                    ['PriceMoved', 'InvalidContractProposal'],
                    delayIndex++
                ).then(onSuccess);
            }
            const trade_option = tradeOptionToBuy(contract_type, {
                ...this.tradeOptions,
                ...parameters,
            });
            if (['DIGITEVEN', 'DIGITODD'].includes(contract_type)) {
                delete trade_option.parameters.barrier;
                delete trade_option.parameters.selected_tick;
            }
            const action = () => api_base.api.send(trade_option);

            this.isSold = false;

            contractStatus({
                id: 'contract.purchase_sent',
                data: this.tradeOptions.amount,
            });

            if (!this.options.timeMachineEnabled) {
                return doUntilDone(action).then(onSuccess);
            }

            return recoverFromError(
                action,
                (errorCode, makeDelay) => {
                    if (errorCode === 'DisconnectError') {
                        this.clearProposals();
                    }
                    const unsubscribe = this.store.subscribe(() => {
                        const { scope } = this.store.getState();
                        if (scope === BEFORE_PURCHASE) {
                            makeDelay().then(() => this.observer.emit('REVERT', 'before'));
                            unsubscribe();
                        }
                    });
                },
                ['PriceMoved', 'InvalidContractProposal'],
                delayIndex++
            ).then(onSuccess);
        }

        async simulateVirtualPurchase(contract_type, parameters = {}) {
            if (!['DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITMATCH', 'DIGITDIFF'].includes(contract_type)) {
                throw new Error(`Virtual Hook does not support ${contract_type} contracts.`);
            }

            const duration = Number(this.tradeOptions.duration);
            if (this.tradeOptions.duration_unit !== 't' || !Number.isInteger(duration) || duration < 1) {
                throw new Error('Virtual Hook currently supports digit contracts with tick-based durations only.');
            }

            const virtual_trade_options = {
                ...this.tradeOptions,
                ...parameters,
                amount: this.virtualHookState.stake,
                contractTypes: [contract_type],
                symbol: this.options.symbol,
            };
            if (['DIGITEVEN', 'DIGITODD'].includes(contract_type)) {
                delete virtual_trade_options.prediction;
                delete virtual_trade_options.barrierOffset;
                delete virtual_trade_options.secondBarrierOffset;
            }

            const [proposal_request] = tradeOptionToProposal(virtual_trade_options, getUUID());
            const { proposal } = await doUntilDone(() => api_base.api.send(proposal_request));
            if (this.$scope.stopped) {
                return;
            }
            if (!proposal) {
                throw new Error('Virtual Hook did not receive a proposal for the simulated trade.');
            }
            const buy_price = Number(proposal.ask_price);
            const payout = Number(proposal.payout);
            if (!Number.isFinite(buy_price) || !Number.isFinite(payout)) {
                throw new Error('Virtual Hook could not obtain a valid proposal for the simulated trade.');
            }

            const entry_tick = await this.getLastTick(true);
            if (this.$scope.stopped) {
                return;
            }
            if (!entry_tick || typeof entry_tick !== 'object' || !Number.isFinite(entry_tick.epoch)) {
                throw new Error('Virtual Hook could not read the simulated trade entry tick.');
            }
            const exit_tick = await this.waitForVirtualExitTick(duration, entry_tick.epoch);
            if (!exit_tick) {
                return;
            }

            const exit_digit = getLastDigit(exit_tick.quote.toFixed(this.getPipSize()));
            const barrier = proposal_request.barrier ?? proposal_request.selected_tick;
            const is_win = evaluateVirtualDigitContract(contract_type, exit_digit, barrier);
            const virtual_contract_id = `virtual-${getUUID()}`;
            const buy_transaction_id = `virtual-${getUUID()}`;

            this.data.contract = {
                transaction_ids: {
                    buy: buy_transaction_id,
                    sell: buy_transaction_id,
                },
                contract_type,
                buy_price,
                sell_price: is_win ? payout : 0,
                currency: this.tradeOptions.currency,
                entry_tick: entry_tick.quote,
                entry_tick_time: entry_tick.epoch,
                exit_tick: exit_tick.quote,
                exit_tick_time: exit_tick.epoch,
                barrier,
                contract_id: virtual_contract_id,
                is_virtual: true,
                status: 'sold',
                is_sold: true,
            };
            this.isSold = true;
            this.virtualHookState = recordVirtualHookTrade(this.virtualHookState, is_win);
            this.store.dispatch(purchaseSuccessful());
            this.store.dispatch(sell());
        }

        async waitForVirtualExitTick(duration, entry_epoch) {
            const { ticksService } = this.$scope;
            let listener_key;
            let resolve_ticks;
            let stopped = false;
            const ticks_promise = new Promise(resolve => {
                resolve_ticks = resolve;
            });
            const stop_listener = () => {
                stopped = true;
                resolve_ticks(null);
            };
            const callback = ticks => {
                const new_ticks = ticks.filter(tick => tick.epoch > entry_epoch);
                if (new_ticks.length >= duration) {
                    resolve_ticks(new_ticks[duration - 1]);
                }
            };

            globalObserver.register('bot.stop', stop_listener);
            try {
                listener_key = await ticksService.monitor({
                    symbol: this.options.symbol,
                    callback,
                });
                return await ticks_promise;
            } finally {
                globalObserver.unregister('bot.stop', stop_listener);
                if (listener_key) {
                    await ticksService.stopMonitor({
                        symbol: this.options.symbol,
                        key: listener_key,
                    });
                }
                if (stopped) {
                    this.isSold = true;
                }
            }
        }

        shouldContinueVirtualHook() {
            const { enabled, phase, awaitingRealTrade } = this.virtualHookState || {};
            return Boolean(enabled && (phase === 'virtual' || awaitingRealTrade));
        }

        purchaseWithParameters(contract_type, parameters = {}) {
            return this.purchase(contract_type, parameters, true);
        }

        getPurchaseReference = () => purchase_reference;
        regeneratePurchaseReference = () => {
            purchase_reference = getUUID();
        };
    };
