import { localize } from '@deriv-com/translations';
import { modifyContextMenu } from '../../../utils';

window.Blockly.Blocks.over_under_analysis = {
    init() {
        this.jsonInit(this.definition());
        this.setInputsInline(true);
    },
    definition() {
        return {
            message0: '%1 than %2 in the last %3 digits',
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'CONDITION_TYPE',
                    options: [
                        [localize('Over'), 'OVER'],
                        [localize('Under'), 'UNDER'],
                    ],
                },
                {
                    type: 'input_value',
                    name: 'DIGIT',
                    check: 'Number',
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
            tooltip: localize(
                'Returns the percentage of digits above or below the selected barrier in the last N digits.'
            ),
            category: window.Blockly.Categories.Tick_Analysis,
        };
    },
    meta() {
        return {
            display_name: localize('Over/under analysis'),
            description: localize(
                'Calculates the percentage of digits above or below a selected digit in the last N digits.'
            ),
        };
    },
    customContextMenu(menu) {
        modifyContextMenu(menu);
    },
};

window.Blockly.JavaScript.javascriptGenerator.forBlock.over_under_analysis = block => {
    const barrier =
        window.Blockly.JavaScript.javascriptGenerator.valueToCode(
            block,
            'DIGIT',
            window.Blockly.JavaScript.javascriptGenerator.ORDER_ATOMIC
        ) || '4';
    const count =
        window.Blockly.JavaScript.javascriptGenerator.valueToCode(
            block,
            'N',
            window.Blockly.JavaScript.javascriptGenerator.ORDER_ATOMIC
        ) || '1000';
    const condition_type = block.getFieldValue('CONDITION_TYPE') || 'OVER';

    return [
        `Bot.getOverUnderAnalysis(${count}, '${condition_type}', ${barrier})`,
        window.Blockly.JavaScript.javascriptGenerator.ORDER_ATOMIC,
    ];
};
