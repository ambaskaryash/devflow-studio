// ============================================================
// DevFlow Studio — Secure Secret Storage (OS Keychain/DPAPI/libsecret)
// Uses the `keyring` crate which wraps:
//   macOS  → Security framework (Keychain)
//   Windows → DPAPI / Credential Manager
//   Linux  → libsecret / secret-service / KWallet
//
// Secrets are NEVER stored in SQLite or disk as plaintext.
// Values are zeroized from heap memory after use.
// ============================================================

use keyring::Entry;
use zeroize::Zeroizing;
use serde::{Deserialize, Serialize};

const SERVICE_NAME: &str = "devflow-studio";

/// Wrapper so the secret value is wiped from heap when dropped.
type SecretValue = Zeroizing<String>;

#[derive(Debug, Serialize, Deserialize)]
pub struct SecretEntry {
    pub key: String,
}

// ── Tauri commands ─────────────────────────────────────────────────────────────

/// Store a secret in the OS credential store.
/// `key` is the secret name (e.g. "GITHUB_TOKEN").
/// `value` is wiped from Rust memory after the function returns.
#[tauri::command]
pub fn store_secret(key: String, value: String) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, &key)
        .map_err(|e| format!("Failed to create keyring entry for '{}': {}", key, e))?;

    entry
        .set_password(&value)
        .map_err(|e| format!("Failed to store secret '{}': {}", key, e))?;

    // Zeroize the value before dropping
    let _wiped: SecretValue = Zeroizing::new(value);
    Ok(())
}

/// Retrieve a secret value from the OS credential store.
/// Returns `None` if the key does not exist.
/// The caller must handle the returned value securely.
#[tauri::command]
pub fn get_secret(key: String) -> Result<Option<String>, String> {
    let entry = Entry::new(SERVICE_NAME, &key)
        .map_err(|e| format!("Failed to open keyring for '{}': {}", key, e))?;

    match entry.get_password() {
        Ok(password) => Ok(Some(password)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(format!("Failed to retrieve secret '{}': {}", key, e)),
    }
}

/// Delete a secret from the OS credential store.
#[tauri::command]
pub fn delete_secret(key: String) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, &key)
        .map_err(|e| format!("Failed to open keyring for '{}': {}", key, e))?;

    match entry.delete_password() {
        Ok(_) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()), // Already gone — not an error
        Err(e) => Err(format!("Failed to delete secret '{}': {}", key, e)),
    }
}

/// Check if a secret key exists in the OS credential store.
/// Returns only a boolean — never the value.
#[tauri::command]
pub fn secret_exists(key: String) -> Result<bool, String> {
    let entry = Entry::new(SERVICE_NAME, &key)
        .map_err(|e| format!("Failed to open keyring for '{}': {}", key, e))?;

    match entry.get_password() {
        Ok(_) => Ok(true),
        Err(keyring::Error::NoEntry) => Ok(false),
        Err(e) => Err(format!("Failed to check secret '{}': {}", key, e)),
    }
}

// ── Unit tests ─────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    const TEST_KEY: &str = "devflow_test_secret_key_do_not_use";

    fn cleanup() {
        // Best-effort cleanup — ignore errors
        if let Ok(entry) = Entry::new(SERVICE_NAME, TEST_KEY) {
            let _ = entry.delete_password();
        }
    }

    #[test]
    fn test_store_and_retrieve() {
        cleanup();
        let result = store_secret(TEST_KEY.to_string(), "test_value_123".to_string());
        assert!(result.is_ok(), "store_secret failed: {:?}", result);

        let retrieved = get_secret(TEST_KEY.to_string()).unwrap();
        assert_eq!(retrieved, Some("test_value_123".to_string()));
        cleanup();
    }

    #[test]
    fn test_missing_key_returns_none() {
        cleanup();
        let result = get_secret(TEST_KEY.to_string()).unwrap();
        assert_eq!(result, None, "Expected None for a missing key");
    }

    #[test]
    fn test_delete_secret() {
        cleanup();
        store_secret(TEST_KEY.to_string(), "will_be_deleted".to_string()).unwrap();
        assert!(secret_exists(TEST_KEY.to_string()).unwrap());

        delete_secret(TEST_KEY.to_string()).unwrap();
        assert!(!secret_exists(TEST_KEY.to_string()).unwrap());
        cleanup();
    }

    #[test]
    fn test_delete_nonexistent_is_ok() {
        cleanup();
        let result = delete_secret(TEST_KEY.to_string());
        assert!(result.is_ok(), "Deleting nonexistent key should not error");
    }
}
