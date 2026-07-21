import { useEffect, useState } from 'react';
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

export const useProposal = (config: ProposalConfig | null) => {
    const [proposal, setProposal] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

    useEffect(() => {
        if (!config || !config.symbol || !api_base.api) return;

        let active = true;
        let currentSubId: string | null = null;
        setIsLoading(true);
        setError(null);
        setProposal(null);

        // Define subscription handler
        const subscription = api_base.api.onMessage().subscribe(({ data }: any) => {
            if (!active) return;
            
            if (data.msg_type === 'proposal') {
                // Ensure this proposal belongs to our current subscription
                if (currentSubId && data.proposal.id !== currentSubId) return;
                
                if (data.error) {
                    setError(data.error.message);
                    setProposal(null);
                    setIsLoading(false);
                } else if (data.proposal) {
                    currentSubId = data.proposal.id;
                    setSubscriptionId(currentSubId);
                    setProposal(data.proposal);
                    setError(null);
                    setIsLoading(false);
                }
            }
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
