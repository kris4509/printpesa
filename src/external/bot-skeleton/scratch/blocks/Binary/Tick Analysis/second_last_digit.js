import { localize } from '@deriv-com/translations';
import { modifyContextMenu } from '../../../utils';

window.Blockly.Blocks.second_last_digit = {
    init() {
        this.jsonInit(this.definition());
    },
    definition() {
        return {
            message0: localize('Second Last Digit'),
            output: 'Number',
            outputShape: window.Blockly.OUTPUT_SHAPE_ROUND,
            colour: window.Blockly.Colours.Base.colour,
            colourSecondary: window.Blockly.Colours.Base.colourSecondary,
            colourTertiary: window.Blockly.Colours.Base.colourTertiary,
            tooltip: localize('Returns the second last digit from the latest ticks.'),
            category: window.Blockly.Categories.Tick_Analysis,
        };
    },
    meta() {
        return {
            display_name: localize('Second last digit'),
            description: localize('Returns the digit immediately before the latest tick digit.'),
        };
    },
    customContextMenu(menu) {
        modifyContextMenu(menu);
    },
};

window.Blockly.JavaScript.javascriptGenerator.forBlock.second_last_digit = () => [
    'Bot.getNthLastDigit(2)',
    window.Blockly.JavaScript.javascriptGenerator.ORDER_ATOMIC,
];
