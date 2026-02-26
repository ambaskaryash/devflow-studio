// ============================================================
// DevFlow Studio — Plugin System Hardening
// Validates plugin manifests against core version and signatures.
// ============================================================

export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    minCoreVersion?: string;
    signature?: string;
    nodes?: any[];
}

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Very basic semver check: requires core version's major/minor to be >= plugin's min required.
 */
function isVersionCompatible(coreVersion: string, minCoreVersion: string): boolean {
    const coreParts = coreVersion.replace(/^v/, '').split('.').map(Number);
    const minParts = minCoreVersion.replace(/^v/, '').split('.').map(Number);

    for (let i = 0; i < 3; i++) {
        const c = coreParts[i] || 0;
        const m = minParts[i] || 0;
        if (c > m) return true;
        if (c < m) return false;
    }
    return true; // strictly equal
}

/**
 * Validates a plugin manifest for structural integrity, version compatibility, and security.
 */
export async function validatePlugin(manifest: PluginManifest, coreVersion: string): Promise<ValidationResult> {
    if (!manifest.id || !manifest.name || !manifest.version) {
        return { isValid: false, error: 'Missing required manifest fields (id, name, version).' };
    }

    if (manifest.minCoreVersion) {
        if (!isVersionCompatible(coreVersion, manifest.minCoreVersion)) {
            return {
                isValid: false,
                error: `Plugin requires core version >= ${manifest.minCoreVersion}, but running ${coreVersion}.`
            };
        }
    }

    // Stub: Cryptographic signature verification
    // In a real implementation, you'd use the Web Crypto API to verify the manifest
    // signature against a known public key.
    if (manifest.signature) {
        // e.g., const isValidSig = await crypto.subtle.verify(...)
        // We'll trust any signature string for now as a stub.
        if (manifest.signature.length < 10) {
            return { isValid: false, error: 'Invalid plugin signature.' };
        }
    }

    return { isValid: true };
}
