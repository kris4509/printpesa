import React, { useEffect, useState } from 'react';
import { api_base } from '@/external/bot-skeleton';
import './positions-panel.scss';

interface Position {
    contract_id: number;
    contract_type: string;
    display_name: string;
    buy_price: number;
    current_spot: number;
    profit: number;
    profit_percentage: number;
    status: 'open' | 'won' | 'lost';
    entry_tick: number;
    exit_tick?: number;
    barrier?: string;
    purchase_time: number;
}

const STATUS_LABELS: Record<string, string> = {
    open: 'Open',
    won:  'Won',
    lost: 'Lost',
};

const PositionsPanel = () => {
    const [positions, setPositions] = useState<Position[]>([]);
    const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');

    useEffect(() => {
        if (!api_base.api) return;
        let active = true;

        // Subscribe to proposal_open_contract updates
        const subscription = api_base.api.onMessage().subscribe(({ data }: any) => {
            if (!active) return;

            if (data.msg_type === 'buy') {
                const buy = data.buy;
                if (!buy) return;
                // Add a new open position
                const newPos: Position = {
                    contract_id: buy.contract_id,
                    contract_type: buy.contract_type || '',
                    display_name: buy.longcode || `Contract #${buy.contract_id}`,
                    buy_price: buy.buy_price,
                    current_spot: buy.start_spot ?? 0,
                    profit: 0,
                    profit_percentage: 0,
                    status: 'open',
                    entry_tick: buy.start_spot ?? 0,
                    barrier: buy.barrier ?? undefined,
                    purchase_time: buy.purchase_time ?? Date.now() / 1000,
                };
                setPositions(prev => [newPos, ...prev].slice(0, 50));


                // Subscribe to this contract's updates
                api_base.api?.send({
                    proposal_open_contract: 1,
                    contract_id: buy.contract_id,
                    subscribe: 1,
                }).catch(() => {});
            }

            if (data.msg_type === 'proposal_open_contract') {
                const poc = data.proposal_open_contract;
                if (!poc) return;
                setPositions(prev => prev.map(p => {
                    if (p.contract_id !== poc.contract_id) return p;
                    const profit = poc.profit ?? 0;
                    const profitPct = poc.profit_percentage ?? 0;
                    const isSold = poc.is_sold;
                    return {
                        ...p,
                        current_spot: poc.current_spot ?? p.current_spot,
                        profit,
                        profit_percentage: profitPct,
                        status: isSold ? (profit >= 0 ? 'won' : 'lost') : 'open',
                        exit_tick: poc.exit_tick ?? undefined,
                    };
                }));
            }
        });

        return () => {
            active = false;
            subscription.unsubscribe();
        };
    }, []);

    const open   = positions.filter(p => p.status === 'open');
    const closed = positions.filter(p => p.status !== 'open');
    const shown  = activeTab === 'open' ? open : closed;

    return (
        <div className='positions-panel'>
            <div className='positions-panel__tabs'>
                <button
                    className={`positions-panel__tab${activeTab === 'open' ? ' positions-panel__tab--active' : ''}`}
                    onClick={() => setActiveTab('open')}
                    type='button'
                >
                    Open <span className='positions-panel__badge'>{open.length}</span>
                </button>
                <button
                    className={`positions-panel__tab${activeTab === 'closed' ? ' positions-panel__tab--active' : ''}`}
                    onClick={() => setActiveTab('closed')}
                    type='button'
                >
                    Closed <span className='positions-panel__badge'>{closed.length}</span>
                </button>
            </div>

            <div className='positions-panel__list'>
                {shown.length === 0 ? (
                    <div className='positions-panel__empty'>
                        <svg width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.2' opacity={0.3}>
                            <rect x='2' y='3' width='20' height='14' rx='2' />
                            <path d='M8 21h8M12 17v4' />
                        </svg>
                        <p>No {activeTab === 'open' ? 'open' : 'closed'} contracts</p>
                    </div>
                ) : (
                    shown.map(pos => (
                        <div key={pos.contract_id} className={`positions-panel__item positions-panel__item--${pos.status}`}>
                            <div className='positions-panel__item-top'>
                                <span className='positions-panel__item-id'>#{pos.contract_id}</span>
                                <span className={`positions-panel__item-status positions-panel__item-status--${pos.status}`}>
                                    {STATUS_LABELS[pos.status]}
                                </span>
                            </div>
                            <div className='positions-panel__item-desc'>{pos.display_name}</div>
                            {pos.barrier && <div className='positions-panel__item-meta'>Digit: {pos.barrier}</div>}
                            <div className='positions-panel__item-bottom'>
                                <span className='positions-panel__item-stake'>Stake: {pos.buy_price.toFixed(2)}</span>
                                <span className={`positions-panel__item-profit${pos.profit >= 0 ? ' positions-panel__item-profit--pos' : ' positions-panel__item-profit--neg'}`}>
                                    {pos.profit >= 0 ? '+' : ''}{pos.profit.toFixed(2)} ({pos.profit_percentage.toFixed(1)}%)
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PositionsPanel;
