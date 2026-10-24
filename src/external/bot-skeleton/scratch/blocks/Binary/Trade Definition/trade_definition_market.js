import { localize } from '@deriv-com/translations';
import ApiHelpers from '../../../../services/api/api-helpers';
import DBotStore from '../../../dbot-store';
import { excludeOptionFromContextMenu, modifyContextMenu, runIrreversibleEvents } from '../../../utils';
import { observer as globalObserver } from '../../../../utils/observer';
import { setDcirclesMarket } from '../../../../../../hooks/useDcirclesTicks';
/* eslint-disable */
const syncBlocklyMarketToDcircles = symbol => {
    if (symbol) {
        setDcirclesMarket(symbol);
    }
};

const syncDcirclesMarketToBlockly = event => {
    const symbol = event.detail;
    if (typeof symbol !== 'string') return;

    const active_symbols = ApiHelpers?.instance?.active_symbols;
    const workspace = window.Blockly?.derivWorkspace;
    if (!active_symbols || !workspace) return;

    const block = workspace.getAllBlocks().find(item => item.type === 'trade_definition_market');
    if (!block) return;

    const selected_symbol = active_symbols
        .getAllSymbols()
        .find(item => item.symbol === symbol);
    if (!selected_symbol) {
        console.warn(`[Dcircles] Cannot synchronize unavailable market symbol "${symbol}" to Blockly.`);
        return;
    }

    const market_dropdown = block.getField('MARKET_LIST');
    const submarket_dropdown = block.getField('SUBMARKET_LIST');
    const symbol_dropdown = block.getField('SYMBOL_LIST');
    market_dropdown.updateOptions(active_symbols.getMarketDropdownOptions(), {
        default_value: selected_symbol.market,
        should_pretend_empty: true,
    });
    submarket_dropdown.updateOptions(active_symbols.getSubmarketDropdownOptions(selected_symbol.market), {
        default_value: selected_symbol.submarket,
        should_pretend_empty: true,
    });
    symbol_dropdown.updateOptions(active_symbols.getSymbolDropdownOptions(selected_symbol.submarket), {
        default_value: symbol,
        should_pretend_empty: true,
    });
    DBotStore.instance.dashboard.setBotBuilderSymbol(symbol);
};

window.addEventListener('dcircles_market_change', syncDcirclesMarketToBlockly);

window.Blockly.Blocks.trade_definition_market = {
    init() {
        this.jsonInit({
            message0: localize('Market: {{ input_market }} > {{ input_submarket }} > {{ input_symbol }}', {
                input_market: '%1',
                input_submarket: '%2',
                input_symbol: '%3',
            }),
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'MARKET_LIST',
                    options: [['', '']],
                },
                {
                    type: 'field_dropdown',
                    name: 'SUBMARKET_LIST',
                    options: [['', '']],
                },
                {
                    type: 'field_dropdown',
                    name: 'SYMBOL_LIST',
                    options: [['', '']],
                },
            ],
            colour: window.Blockly.Colours.Special1.colour,
            colourSecondary: window.Blockly.Colours.Special1.colourSecondary,
            colourTertiary: window.Blockly.Colours.Special1.colourTertiary,
            previousStatement: null,
            nextStatement: null,
        });

        this.referenceMutation = null;
        this.appendDummyInput('VIRTUAL_HOOK')
            .appendField(localize('Virtual Hook'))
            .appendField(new window.Blockly.FieldCheckbox('FALSE'), 'VH_ENABLED')
            .appendField(
                new window.Blockly.FieldImage(
                    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
                        '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="24"><rect width="96" height="24" rx="5" fill="#fff"/><text x="48" y="16" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="#b83b8f">VH Settings</text></svg>'
                    )}`,
                    96,
                    24,
                    localize('Open Virtual Hook settings'),
                    () => globalObserver.emit('virtual-hook.settings.open', this.id)
                )
            );

        const reference_settings = this.appendDummyInput('REFERENCE_SETTINGS');
        reference_settings
            .appendField(new window.Blockly.FieldTextInput('FALSE'), 'ALTERNATE_MARKETS')
            .appendField(new window.Blockly.FieldTextInput('1'), 'ALTERNATE_EVERY')
            .appendField(new window.Blockly.FieldTextInput('FALSE'), 'MULTI_MARKET')
            .appendField(new window.Blockly.FieldTextInput('VH Settings'), 'VH_SETTINGS_BTN');
        reference_settings.setVisible(false);

        this.setMovable(false);
        this.setDeletable(false);
    },
    domToMutation(xmlElement) {
        const attribute_names = ['vh_enabled', 'vh_max_steps', 'vh_min_trades', 'vh_stake'];
        const mutation = {};

        attribute_names.forEach(name => {
            const value = xmlElement.getAttribute(name);
            if (value !== null) {
                mutation[name] = value;
            }
        });

        this.referenceMutation = Object.keys(mutation).length ? mutation : null;
        if (mutation.vh_enabled !== undefined) {
            this.setFieldValue(mutation.vh_enabled.toUpperCase(), 'VH_ENABLED');
        }
    },
    mutationToDom() {
        const vh_enabled = this.getFieldValue('VH_ENABLED') === 'TRUE';
        if (!this.referenceMutation && !vh_enabled) {
            return null;
        }

        const mutation = document.createElement('mutation');
        const reference_mutation = {
            ...this.referenceMutation,
            vh_enabled: vh_enabled ? 'true' : 'false',
        };
        Object.entries(reference_mutation).forEach(([name, value]) => {
            mutation.setAttribute(name, value);
        });

        return mutation;
    },
    customContextMenu(menu) {
        const menu_items = [localize('Enable Block'), localize('Disable Block')];
        excludeOptionFromContextMenu(menu, menu_items);
        modifyContextMenu(menu);
    },
    onchange(event) {
        const allowed_events = ['BLOCK_CREATE', 'BLOCK_CHANGE', 'BLOCK_DRAG'];
        const is_allowed_event =
            allowed_events.findIndex(event_name => event.type === window.Blockly.Events[event_name]) !== -1;

        if (
            !this.workspace ||
            window.Blockly.derivWorkspace.isFlyoutVisible ||
            this.workspace.isDragging() ||
            !is_allowed_event
        ) {
            return;
        }

        this.enforceLimitations();
        if (event.type === window.Blockly.Events.BLOCK_CHANGE && event.name === 'VH_ENABLED') {
            this.referenceMutation = {
                ...this.referenceMutation,
                vh_enabled: this.getFieldValue('VH_ENABLED') === 'TRUE' ? 'true' : 'false',
            };
        }

        const { active_symbols } = ApiHelpers?.instance ?? {};
        if (!active_symbols) return;

        const market_dropdown = this.getField('MARKET_LIST');
        const submarket_dropdown = this.getField('SUBMARKET_LIST');
        const symbol_dropdown = this.getField('SYMBOL_LIST');
        const market = market_dropdown.getValue();
        const submarket = submarket_dropdown.getValue();
        const symbol = symbol_dropdown.getValue();

        const market_options = active_symbols.getMarketDropdownOptions();

        const populateMarketDropdown = () => {
            market_dropdown?.updateOptions(market_options, {
                default_value: market,
                should_pretend_empty: true,
                event_group: event.group,
            });
        };

        if (event.type === window.Blockly.Events.BLOCK_CREATE && event.ids.includes(this.id)) {
            populateMarketDropdown();
        } else if (event.type === window.Blockly.Events.BLOCK_CHANGE && event.blockId === this.id) {
            if (event.name === 'MARKET_LIST') {
                submarket_dropdown.updateOptions(active_symbols.getSubmarketDropdownOptions(market), {
                    default_value: submarket,
                    should_pretend_empty: true,
                    event_group: event.group,
                });
            } else if (event.name === 'SUBMARKET_LIST') {
                symbol_dropdown.updateOptions(active_symbols.getSymbolDropdownOptions(submarket), {
                    default_value: symbol,
                    should_pretend_empty: true,
                    event_group: event.group,
                });
            } else if (event.name === 'SYMBOL_LIST') {
                const new_symbol = symbol_dropdown.getValue();
                DBotStore.instance.dashboard.setBotBuilderSymbol(new_symbol);
                syncBlocklyMarketToDcircles(new_symbol);
            }
        } else if (
            event.type === window.Blockly.Events.BLOCK_DRAG &&
            !event.isStart &&
            event.blockId === this.getRootBlock().id
        ) {
            if (market_dropdown.isEmpty() || submarket_dropdown.isEmpty() || symbol_dropdown.isEmpty()) {
                populateMarketDropdown();
            }
        }
    },
    enforceLimitations() {
        runIrreversibleEvents(() => {
            if (!this.isDescendantOf('trade_definition')) {
                this.unplug(false); // Unplug without reconnecting siblings

                const top_blocks = this.workspace.getTopBlocks();
                const trade_definition_block = top_blocks.find(block => block.type === 'trade_definition');

                // Reconnect self to trade definition block.
                if (trade_definition_block) {
                    const connection = trade_definition_block.getLastConnectionInStatement('TRADE_OPTIONS');
                    if (connection) {
                        connection.connect(this.previousConnection);
                    }
                } else {
                    this.dispose();
                }
            }
            // These blocks cannot be disabled.
            else if (this.disabled) {
                this.setDisabled(false);
            }
        });
    },
};

window.Blockly.JavaScript.javascriptGenerator.forBlock.trade_definition_market = () => {};
