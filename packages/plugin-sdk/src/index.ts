// DevFlow Studio — Plugin SDK Utilities
// Helpers for plugin developers to ensure compatibility and ease of development.

export interface ConfigField {
    key: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'select' | 'code';
    options?: { label: string; value: string }[];
    default?: any;
    required?: boolean;
}

/**
 * Validates a configuration object against a schema.
 * Throws an error if required fields are missing or types mismatch.
 */
export function validateConfigSchema(config: Record<string, any>, schema: ConfigField[]) {
    for (const field of schema) {
        const val = config[field.key];

        if (field.required && (val === undefined || val === null || val === '')) {
            throw new Error(`Missing required configuration field: ${field.label}`);
        }

        if (val !== undefined && val !== null) {
            if (field.type === 'number' && typeof val !== 'number') {
                throw new Error(`Field ${field.label} must be a number`);
            }
            if (field.type === 'boolean' && typeof val !== 'boolean') {
                throw new Error(`Field ${field.label} must be a boolean`);
            }
        }
    }
    return true;
}

/**
 * Helper to create a standardized node icon definition.
 */
export function createNodeIcon(emoji: string) {
    return emoji;
}
