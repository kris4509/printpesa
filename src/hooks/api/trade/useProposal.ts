import { useEffect, useState, useRef } from 'react';
import { api_base } from '@/external/bot-skeleton';

type ProposalConfig = {
    contract_type: string;
    currency: string;
    amount: number;
    basis: 'stake' | 'payout';
    duration: number;
    duration_unit: string;
    symbol: string;
    barrier?: string;
};

// Starts far above the range the underlying @deriv/deriv-api SDK uses for
// its own auto-generated req_id values (it starts its internal counter at
// 0 and increments per request with no req_id supplied), so ours can never
// collide with — and corrupt — an unrelated in-flight request elsewhere
// in the app that didn't set its own req_id.
let reqIdCounter = 900_000_000;

export const useProposal = (config: ProposalConfig | null) => {
    const [proposal, setProposal] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

    useEffect(() => {
        if (!config || !config.symbol || !api_base.api) return;

        let active = true;
        let currentSubId: string | null = null;
        // Unique per-request id so we only ever react to messages that are
        // actually a response to *this* request. api_base.api.onMessage() is
        // a shared stream carrying every WebSocket message in the whole app
        // (Bot Builder, Dcircles, etc. all use the same connection) — without
        // this check, an unrelated proposal error firing anywhere else in the
        // app would get misattributed to this hook and shown here instead.
        const ownReqId = reqIdCounter++;

        setIsLoading(true);
        setError(null);
        setProposal(null);

        const subscription = api_base.api.onMessage().subscribe(({ data }: any) => {
            if (!active) return;
            if (data.msg_type !== 'proposal') return;
            if (data.echo_req?.req_id !== ownReqId) return;

            if (data.error) {
                setError(data.error.message);
                setProposal(null);
                setIsLoading(false);
                return;
            }

            if (!data.proposal) return;

            currentSubId = data.proposal.id;
            setSubscriptionId(currentSubId);
            setProposal(data.proposal);
            setError(null);
            setIsLoading(false);
        });

        // Send the proposal request with subscribe: 1
        const request = {
            proposal: 1,
            subscribe: 1,
            amount: config.amount,
            basis: config.basis,
            contract_type: config.contract_type,
            currency: config.currency,
            duration: config.duration,
            duration_unit: config.duration_unit,
            symbol: config.symbol,
            req_id: ownReqId,
            ...(config.barrier !== undefined && { barrier: config.barrier })
        };

        api_base.api.send(request).catch((err: any) => {
            if (active) {
                setError(err?.error?.message || err.message || 'Failed to fetch proposal');
                setIsLoading(false);
            }
        });

        return () => {
            active = false;
            subscription.unsubscribe();
            if (currentSubId) {
                api_base.api?.send({ forget: currentSubId }).catch(() => {});
            }
        };
    }, [
        config?.contract_type,
        config?.currency,
        config?.amount,
        config?.basis,
        config?.duration,
        config?.duration_unit,
        config?.symbol,
        config?.barrier
    ]);

    return { proposal, error, isLoading, subscriptionId };
};
