import { localize } from '@deriv-com/translations';
import { modifyContextMenu } from '../../../utils';

window.Blockly.Blocks.digit_frequency_analysis = {
    init() {
        this.jsonInit(this.definition());
        this.setInputsInline(true);
    },
    definition() {
        return {
            message0: localize('%1 digit in the last %2 digits'),
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'ANALYSIS_TYPE',
                    options: [
                        [localize('Most frequent'), 'MOST_FREQUENT'],
                        [localize('Second most frequent'), 'SECOND_MOST_FREQUENT'],
                        [localize('Least frequent'), 'LEAST_FREQUENT'],
                        [localize('Second least frequent'), 'SECOND_LEAST_FREQUENT'],
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
            tooltip: localize('Returns the selected digit ranked by frequency in the last N digits.'),
            category: window.Blockly.Categories.Tick_Analysis,
        };
    },
    meta() {
        return {
            display_name: localize('Digit frequency analysis'),
            description: localize(
                'Finds the most or least frequent digit in the last N digits. Frequency ties are ranked by digit value.'
            ),
        };
    },
    customContextMenu(menu) {
        modifyContextMenu(menu);
    },
};

window.Blockly.JavaScript.javascriptGenerator.forBlock.digit_frequency_analysis = block => {
    const count =
        window.Blockly.JavaScript.javascriptGenerator.valueToCode(
            block,
            'N',
            window.Blockly.JavaScript.javascriptGenerator.ORDER_ATOMIC
        ) || '1000';
    const analysis_type = block.getFieldValue('ANALYSIS_TYPE') || 'MOST_FREQUENT';

    return [
        `Bot.getDigitFrequencyAnalysis(${count}, '${analysis_type}')`,
        window.Blockly.JavaScript.javascriptGenerator.ORDER_ATOMIC,
    ];
};
