import { useState } from 'react';
import { api_base } from '@/external/bot-skeleton';

export const useBuyContract = () => {
    const [isBuying, setIsBuying] = useState<boolean>(false);
    const [buyError, setBuyError] = useState<string | null>(null);
    const [buyResult, setBuyResult] = useState<any>(null);

    const buy = async (proposalId: string, price: number) => {
        if (!api_base.api) return;

        setIsBuying(true);
        setBuyError(null);
        setBuyResult(null);

        try {
            const response: any = await api_base.api.send({
                buy: proposalId,
                price: price
            });

            if (response.error) {
                setBuyError(response.error.message);
            } else if (response.buy) {
                setBuyResult(response.buy);
            }
        } catch (err: any) {
            setBuyError(err?.error?.message || err.message || 'Failed to buy contract');
        } finally {
            setIsBuying(false);
        }
    };

    return { buy, isBuying, buyError, buyResult };
};
