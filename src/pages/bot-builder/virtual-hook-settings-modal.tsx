import React from 'react';
import { localize } from '@deriv-com/translations';
import { observer as globalObserver } from '@/external/bot-skeleton/utils/observer';
import './virtual-hook-settings-modal.scss';

type TSettings = {
    enabled: boolean;
};

const DEFAULT_SETTINGS: TSettings = {
    enabled: false,
};

const VirtualHookSettingsModal = () => {
    const [block_id, setBlockId] = React.useState<string | null>(null);
    const [settings, setSettings] = React.useState<TSettings>(DEFAULT_SETTINGS);

    React.useEffect(() => {
        const open_settings = (id: string) => {
            const block = window.Blockly?.derivWorkspace?.getBlockById(id);
            if (!block || block.type !== 'trade_definition_market') return;

            setBlockId(id);
            setSettings({
                enabled: block.getFieldValue('VH_ENABLED') === 'TRUE',
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
            const existing_mutation = Object.fromEntries(
                Object.entries(block.referenceMutation ?? {}).filter(
                    ([key]) => key !== 'vh_max_steps' && key !== 'vh_min_trades'
                )
            );
            block.referenceMutation = {
                ...existing_mutation,
                vh_enabled: settings.enabled ? 'true' : 'false',
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
                <p className='virtual-hook-modal__description'>
                    {localize(
                        'Virtual trades continue until one wins. Then the bot trades with real funds until one loses, and switches back to virtual trades.'
                    )}
                </p>
                <button className='virtual-hook-modal__apply' onClick={applySettings} type='button'>
                    {localize('Apply Settings')}
                </button>
            </section>
        </div>
    );
};

export default VirtualHookSettingsModal;
