import { localize } from '@deriv-com/translations';
import { modifyContextMenu } from '../../../utils';

window.Blockly.Blocks.nth_last_digit = {
    init() {
        this.jsonInit(this.definition());
        this.setInputsInline(true);
    },
    definition() {
        return {
            message0: localize('Digit at position %1 from the end'),
            args0: [
                {
                    type: 'input_value',
                    name: 'N',
                    check: 'Number',
                },
            ],
            output: 'Number',
            outputShape: window.Blockly.OUTPUT_SHAPE_ROUND,
            colour: window.Blockly.Colours.Base.colour,
            colourSecondary: window.Blockly.Colours.Base.colourSecondary,
            colourTertiary: window.Blockly.Colours.Base.colourTertiary,
            tooltip: localize('Returns the last digit of the selected tick, counting back from the latest.'),
            category: window.Blockly.Categories.Tick_Analysis,
        };
    },
    meta() {
        return {
            display_name: localize('Nth last digit'),
            description: localize('Selects a tick and returns its last digit, counting back from the latest tick.'),
        };
    },
    customContextMenu(menu) {
        modifyContextMenu(menu);
    },
};

window.Blockly.JavaScript.javascriptGenerator.forBlock.nth_last_digit = block => {
    const n =
        window.Blockly.JavaScript.javascriptGenerator.valueToCode(
            block,
            'N',
            window.Blockly.JavaScript.javascriptGenerator.ORDER_ATOMIC
        ) || '1';
    return [`Bot.getNthLastDigit(${n})`, window.Blockly.JavaScript.javascriptGenerator.ORDER_ATOMIC];
};
