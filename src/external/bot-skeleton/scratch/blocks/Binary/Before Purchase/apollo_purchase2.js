import { localize } from '@deriv-com/translations';
import { excludeOptionFromContextMenu, modifyContextMenu } from '../../../utils';

window.Blockly.Blocks.apollo_purchase2 = {
    init() {
        this.jsonInit(this.definition());
        this.setNextStatement(false);
    },
    definition() {
        return {
            message0: localize('Purchase %1 with barrier %2'),
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'PURCHASE_LIST',
                    options: [
                        [localize('Digit Over'), 'DIGITOVER'],
                        [localize('Digit Under'), 'DIGITUNDER'],
                        [localize('Digit Even'), 'DIGITEVEN'],
                        [localize('Digit Odd'), 'DIGITODD'],
                        [localize('Digit Match'), 'DIGITMATCH'],
                        [localize('Digit Differs'), 'DIGITDIFF'],
                    ],
                },
                {
                    type: 'input_value',
                    name: 'PREDICTION',
                    check: 'Number',
                },
            ],
            previousStatement: null,
            colour: window.Blockly.Colours.Special1.colour,
            colourSecondary: window.Blockly.Colours.Special1.colourSecondary,
            colourTertiary: window.Blockly.Colours.Special1.colourTertiary,
            tooltip: localize(
                'Buys the selected digit contract using the trade duration and stake, and the barrier entered here.'
            ),
            category: window.Blockly.Categories.Before_Purchase,
        };
    },
    meta() {
        return {
            display_name: localize('Purchase digit contract with barrier'),
            description: localize(
                'Choose a digit contract and barrier for this purchase. Even and Odd contracts ignore the barrier.'
            ),
            key_words: localize('buy'),
        };
    },
    customContextMenu(menu) {
        const menu_items = [localize('Enable Block'), localize('Disable Block')];
        excludeOptionFromContextMenu(menu, menu_items);
        modifyContextMenu(menu);
    },
    restricted_parents: ['before_purchase'],
};

window.Blockly.JavaScript.javascriptGenerator.forBlock.apollo_purchase2 = block => {
    const contract_type = block.getFieldValue('PURCHASE_LIST');
    const prediction =
        window.Blockly.JavaScript.javascriptGenerator.valueToCode(
            block,
            'PREDICTION',
            window.Blockly.JavaScript.javascriptGenerator.ORDER_ATOMIC
        ) || '0';
    const parameters = ['DIGITEVEN', 'DIGITODD'].includes(contract_type)
        ? '{}'
        : `{ prediction: ${prediction} }`;

    return `Bot.purchaseWithParameters('${contract_type}', ${parameters});\n`;
};
