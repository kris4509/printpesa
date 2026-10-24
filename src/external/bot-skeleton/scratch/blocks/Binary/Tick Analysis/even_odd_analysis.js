import { localize } from '@deriv-com/translations';
import { modifyContextMenu } from '../../../utils';

window.Blockly.Blocks.even_odd_analysis = {
    init() {
        this.jsonInit(this.definition());
        this.setInputsInline(true);
    },
    definition() {
        return {
            message0: localize('%1 percentage in the last %2 digits'),
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'ANALYSIS_TYPE',
                    options: [
                        [localize('Even'), 'EVEN_PERCENTAGE'],
                        [localize('Odd'), 'ODD_PERCENTAGE'],
                    ],
                },
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
            tooltip: localize('Returns the percentage of even or odd digits in the last N digits.'),
            category: window.Blockly.Categories.Tick_Analysis,
        };
    },
    meta() {
        return {
            display_name: localize('Even/odd analysis'),
            description: localize('Calculates the percentage of even or odd digits in the last N digits.'),
        };
    },
    customContextMenu(menu) {
        modifyContextMenu(menu);
    },
};

window.Blockly.JavaScript.javascriptGenerator.forBlock.even_odd_analysis = block => {
    const count =
        window.Blockly.JavaScript.javascriptGenerator.valueToCode(
            block,
            'N',
            window.Blockly.JavaScript.javascriptGenerator.ORDER_ATOMIC
        ) || '1000';
    const analysis_type = block.getFieldValue('ANALYSIS_TYPE') || 'EVEN_PERCENTAGE';

    return [
        `Bot.getEvenOddAnalysis(${count}, '${analysis_type}')`,
        window.Blockly.JavaScript.javascriptGenerator.ORDER_ATOMIC,
    ];
};
