import { localize } from '@deriv-com/translations';
import { modifyContextMenu } from '../../../utils';

window.Blockly.Blocks.last_digits_condition = {
    init() {
        this.jsonInit(this.definition());
        this.setInputsInline(true);
        this.updateShape();
    },
    definition() {
        return {
            message0: localize('Last %1 digits are %2 %3'),
            args0: [
                {
                    type: 'input_value',
                    name: 'N',
                    check: 'Number',
                },
                {
                    type: 'field_dropdown',
                    name: 'CONDITION',
                    options: [
                        [localize('less than'), 'LESS_THAN'],
                        [localize('less or equal'), 'LESS_OR_EQUAL'],
                        [localize('greater than'), 'GREATER_THAN'],
                        [localize('greater or equal'), 'GREATER_OR_EQUAL'],
                        [localize('equal'), 'EQUAL'],
                        [localize('not equal'), 'NOT_EQUAL'],
                        [localize('all even'), 'ALL_EVEN'],
                        [localize('all odd'), 'ALL_ODD'],
                    ],
                },
                {
                    type: 'input_value',
                    name: 'COMPARE_VALUE',
                    check: 'Number',
                },
            ],
            output: 'Boolean',
            outputShape: window.Blockly.OUTPUT_SHAPE_ROUND,
            colour: window.Blockly.Colours.Base.colour,
            colourSecondary: window.Blockly.Colours.Base.colourSecondary,
            colourTertiary: window.Blockly.Colours.Base.colourTertiary,
            tooltip: localize('Returns true when all of the selected recent digits match the chosen condition.'),
            category: window.Blockly.Categories.Tick_Analysis,
        };
    },
    meta() {
        return {
            display_name: localize('Last digits condition'),
            description: localize('Checks whether all of the last N digits match a threshold or parity condition.'),
        };
    },
    onchange() {
        if (!this.workspace || this.workspace.isDragging()) {
            return;
        }

        this.updateShape();
    },
    updateShape() {
        const compare_input = this.getInput('COMPARE_VALUE');
        const condition = this.getFieldValue('CONDITION');
        const is_threshold_condition = !['ALL_EVEN', 'ALL_ODD'].includes(condition ?? '');

        if (compare_input) {
            compare_input.setVisible(is_threshold_condition);
        }
    },
    customContextMenu(menu) {
        modifyContextMenu(menu);
    },
};

window.Blockly.JavaScript.javascriptGenerator.forBlock.last_digits_condition = block => {
    const n =
        window.Blockly.JavaScript.javascriptGenerator.valueToCode(
            block,
            'N',
            window.Blockly.JavaScript.javascriptGenerator.ORDER_ATOMIC
        ) || '1';
    const condition = block.getFieldValue('CONDITION') || 'LESS_OR_EQUAL';
    const compare_value =
        window.Blockly.JavaScript.javascriptGenerator.valueToCode(
            block,
            'COMPARE_VALUE',
            window.Blockly.JavaScript.javascriptGenerator.ORDER_ATOMIC
        ) || '0';

    return [
        `Bot.getLastDigitsCondition(${n}, '${condition}', ${compare_value})`,
        window.Blockly.JavaScript.javascriptGenerator.ORDER_ATOMIC,
    ];
};
