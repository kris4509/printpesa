import React from 'react';
import { localize } from '@deriv-com/translations';
import { observer as globalObserver } from '@/external/bot-skeleton/utils/observer';
import './virtual-hook-settings-modal.scss';

type TSettings = {
    enabled: boolean;
    virtualLosses: number;
    realWins: number;
};

const DEFAULT_SETTINGS: TSettings = {
    enabled: false,
    virtualLosses: 1,
    realWins: 1,
};

const getSettingNumber = (value: string | undefined, fallback: number) => {
    const parsed_value = Number(value);
    return Number.isInteger(parsed_value) && parsed_value > 0 ? parsed_value : fallback;
};

const VirtualHookSettingsModal = () => {
    const [block_id, setBlockId] = React.useState<string | null>(null);
    const [settings, setSettings] = React.useState<TSettings>(DEFAULT_SETTINGS);

    React.useEffect(() => {
        const open_settings = (id: string) => {
            const block = window.Blockly?.derivWorkspace?.getBlockById(id);
            if (!block || block.type !== 'trade_definition_market') return;

            const mutation = block.referenceMutation ?? {};
            setBlockId(id);
            setSettings({
                enabled: block.getFieldValue('VH_ENABLED') === 'TRUE',
                virtualLosses: getSettingNumber(mutation.vh_max_steps, 1),
                realWins: getSettingNumber(mutation.vh_min_trades, 1),
            });
        };

        globalObserver.register('virtual-hook.settings.open', open_settings);
        return () => globalObserver.unregister('virtual-hook.settings.open', open_settings);
    }, []);

    React.useEffect(() => {
        if (!block_id) return;
        const on_key_down = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setBlockId(null);
        };
        window.addEventListener('keydown', on_key_down);
        return () => window.removeEventListener('keydown', on_key_down);
    }, [block_id]);

    const updateCount = (field: 'virtualLosses' | 'realWins', delta: number) => {
        setSettings(current => ({
            ...current,
            [field]: Math.min(1000, Math.max(1, current[field] + delta)),
        }));
    };

    const updateInput = (field: 'virtualLosses' | 'realWins', value: string) => {
        if (!/^\d*$/.test(value)) return;
        const number = value === '' ? 1 : Number(value);
        setSettings(current => ({ ...current, [field]: Math.min(1000, Math.max(1, number)) }));
    };

    const applySettings = () => {
        if (!block_id) return;
        const block = window.Blockly?.derivWorkspace?.getBlockById(block_id);
        if (!block || block.type !== 'trade_definition_market' || !block.mutationToDom) {
            setBlockId(null);
            return;
        }

        const old_mutation_dom = block.mutationToDom();
        const old_mutation = old_mutation_dom ? window.Blockly.Xml.domToText(old_mutation_dom) : null;
        const previous_group = window.Blockly.Events.getGroup();
        window.Blockly.Events.setGroup(`virtual-hook-settings-${Date.now()}`);
        try {
            block.referenceMutation = {
                ...block.referenceMutation,
                vh_enabled: settings.enabled ? 'true' : 'false',
                vh_max_steps: String(settings.virtualLosses),
                vh_min_trades: String(settings.realWins),
            };
            block.setFieldValue(settings.enabled ? 'TRUE' : 'FALSE', 'VH_ENABLED');

            const new_mutation_dom = block.mutationToDom();
            const new_mutation = new_mutation_dom ? window.Blockly.Xml.domToText(new_mutation_dom) : null;
            if (old_mutation !== new_mutation) {
                window.Blockly.Events.fire(
                    new window.Blockly.Events.BlockChange(block, 'mutation', null, old_mutation, new_mutation)
                );
            }
        } finally {
            window.Blockly.Events.setGroup(previous_group);
        }

        setBlockId(null);
    };

    if (!block_id) return null;

    return (
        <div
            className='virtual-hook-modal__backdrop'
            onMouseDown={event => {
                if (event.target === event.currentTarget) setBlockId(null);
            }}
        >
            <section
                aria-labelledby='virtual-hook-modal-title'
                aria-modal='true'
                className='virtual-hook-modal'
                role='dialog'
            >
                <button
                    aria-label={localize('Close settings')}
                    className='virtual-hook-modal__close'
                    onClick={() => setBlockId(null)}
                    type='button'
                >
                    ×
                </button>
                <h2 id='virtual-hook-modal-title'>{localize('Virtual Hook settings')}</h2>
                <label className='virtual-hook-modal__toggle'>
                    <span>{localize('Enable Virtual Hook')}</span>
                    <input
                        checked={settings.enabled}
                        onChange={event => setSettings(current => ({ ...current, enabled: event.target.checked }))}
                        type='checkbox'
                    />
                </label>
                <div className='virtual-hook-modal__setting'>
                    <label htmlFor='vh-virtual-losses'>{localize('No of Consecutive Virtual Losses')}</label>
                    <div className='virtual-hook-modal__stepper'>
                        <button
                            aria-label={localize('Decrease consecutive virtual losses')}
                            disabled={!settings.enabled || settings.virtualLosses <= 1}
                            onClick={() => updateCount('virtualLosses', -1)}
                            type='button'
                        >
                            −
                        </button>
                        <input
                            disabled={!settings.enabled}
                            id='vh-virtual-losses'
                            max='1000'
                            min='1'
                            onChange={event => updateInput('virtualLosses', event.target.value)}
                            type='number'
                            value={settings.virtualLosses}
                        />
                        <button
                            aria-label={localize('Increase consecutive virtual losses')}
                            disabled={!settings.enabled || settings.virtualLosses >= 1000}
                            onClick={() => updateCount('virtualLosses', 1)}
                            type='button'
                        >
                            +
                        </button>
                    </div>
                </div>
                <div className='virtual-hook-modal__setting'>
                    <label htmlFor='vh-real-wins'>{localize('No of wins on Real before switching to VH')}</label>
                    <div className='virtual-hook-modal__stepper'>
                        <button
                            aria-label={localize('Decrease real wins threshold')}
                            disabled={!settings.enabled || settings.realWins <= 1}
                            onClick={() => updateCount('realWins', -1)}
                            type='button'
                        >
                            −
                        </button>
                        <input
                            disabled={!settings.enabled}
                            id='vh-real-wins'
                            max='1000'
                            min='1'
                            onChange={event => updateInput('realWins', event.target.value)}
                            type='number'
                            value={settings.realWins}
                        />
                        <button
                            aria-label={localize('Increase real wins threshold')}
                            disabled={!settings.enabled || settings.realWins >= 1000}
                            onClick={() => updateCount('realWins', 1)}
                            type='button'
                        >
                            +
                        </button>
                    </div>
                </div>
                <button className='virtual-hook-modal__apply' onClick={applySettings} type='button'>
                    {localize('Apply Settings')}
                </button>
            </section>
        </div>
    );
};

export default VirtualHookSettingsModal;
