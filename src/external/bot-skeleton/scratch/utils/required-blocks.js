export const PURCHASE_BLOCK_TYPES = ['purchase', 'apollo_purchase2'];

export const getMissingRequiredBlockTypes = (workspace_blocks, required_block_types) => {
    const workspace_block_types = new Set(workspace_blocks.map(block => block.type));
    const missing_block_types = required_block_types
        .filter(block_type => block_type !== 'purchase')
        .filter(block_type => !workspace_block_types.has(block_type));

    if (!PURCHASE_BLOCK_TYPES.some(block_type => workspace_block_types.has(block_type))) {
        missing_block_types.push('purchase');
    }

    return missing_block_types;
};
