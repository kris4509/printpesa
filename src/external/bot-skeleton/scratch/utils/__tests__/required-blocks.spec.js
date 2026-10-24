import { getMissingRequiredBlockTypes } from '../required-blocks';

describe('required purchase block validation', () => {
    it('accepts the custom digit purchase block as a valid replacement', () => {
        const workspace_blocks = [
            { type: 'trade_definition' },
            { type: 'before_purchase' },
            { type: 'apollo_purchase2' },
        ];

        expect(getMissingRequiredBlockTypes(workspace_blocks, ['trade_definition', 'before_purchase', 'purchase'])).toEqual(
            []
        );
    });

    it('continues to accept the standard purchase block', () => {
        const workspace_blocks = [
            { type: 'trade_definition' },
            { type: 'before_purchase' },
            { type: 'purchase' },
        ];

        expect(getMissingRequiredBlockTypes(workspace_blocks, ['trade_definition', 'before_purchase', 'purchase'])).toEqual(
            []
        );
    });

    it('reports a missing purchase block if neither supported purchase block exists', () => {
        const workspace_blocks = [{ type: 'trade_definition' }, { type: 'before_purchase' }];

        expect(getMissingRequiredBlockTypes(workspace_blocks, ['trade_definition', 'before_purchase', 'purchase'])).toEqual(
            ['purchase']
        );
    });

    it('still reports missing mandatory blocks alongside purchase', () => {
        expect(getMissingRequiredBlockTypes([], ['trade_definition', 'before_purchase', 'purchase'])).toEqual([
            'trade_definition',
            'before_purchase',
            'purchase',
        ]);
    });
});
