import { describe, it, expect } from 'vitest';
import { validateCommandSafety } from '../safetyValidator.ts';

describe('Safety Validator', () => {
    it('detects fork bombs as danger', () => {
        const result = validateCommandSafety(':(){ :|:& };:');
        expect(result.some(r => r.message.toLowerCase().includes('fork bomb') || r.severity === 'danger')).toBe(true);
    });

    it('detects basic rm -rf as danger', () => {
        const result = validateCommandSafety('rm -rf /');
        const dangers = result.filter(r => r.severity === 'danger');
        expect(dangers.length).toBeGreaterThan(0);
    });

    it('allows safe echo commands', () => {
        const result = validateCommandSafety('echo "Hello World"');
        expect(result.length).toBe(0);
    });
});
