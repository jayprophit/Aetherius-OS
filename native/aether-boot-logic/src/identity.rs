//! Shared Identity & Profile System (P10-Identity).
//!
//! Provides the canonical identity and profile primitives used across
//! all Aetherius applications. This is the single source of truth for
//! "who is the user" and "what can they do".

extern crate alloc;

use alloc::string::String;
use alloc::vec::Vec;
use alloc::collections::BTreeMap;
use core::fmt;

/// Unique identity handle. Opaque outside this module.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct IdentityId(pub u64);

impl IdentityId {
    pub fn new(id: u64) -> Self { Self(id) }
    pub fn genesis() -> Self { Self(0x1000_0000_0000_0001) }
    pub fn system() -> Self { Self(0x2000_0000_0000_0001) }
    pub fn anonymous() -> Self { Self(0) }
}

impl fmt::Display for IdentityId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "id:{:016x}", self.0)
    }
}

/// User-facing profile data. Kept minimal for the kernel;
/// applications extend with their own schemas.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Profile {
    pub id: IdentityId,
    pub display_name: String,
    pub avatar_hash: Option<String>, // hash of avatar blob
    pub metadata: BTreeMap<String, String>, // extensible key-value
    pub created_at: u64, // timestamp
    pub updated_at: u64,
}

impl Profile {
    pub fn new(id: IdentityId, display_name: String) -> Self {
        let now = 0; // timestamp placeholder
        Self {
            id,
            display_name,
            avatar_hash: None,
            metadata: BTreeMap::new(),
            created_at: now,
            updated_at: now,
        }
    }

    pub fn with_avatar(mut self, hash: String) -> Self {
        self.avatar_hash = Some(hash);
        self
    }

    pub fn with_metadata(mut self, key: String, value: String) -> Self {
        self.metadata.insert(key, value);
        self
    }
}

/// Credential handle. Opaque; actual secrets live in secure storage.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd)]
pub struct CredentialId(pub u64);

/// Authentication provider trait. Implementations live in secure storage.
pub trait AuthProvider {
    fn verify(&self, identity: IdentityId, credential: CredentialId, secret: &[u8]) -> Result<bool, AuthError>;
    fn rotate(&self, identity: IdentityId, old: CredentialId, new: CredentialId) -> Result<(), AuthError>;
    fn revoke(&self, identity: IdentityId, credential: CredentialId) -> Result<(), AuthError>;
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AuthError {
    NotFound,
    InvalidCredential,
    Expired,
    RateLimited,
    InternalError,
}

/// Identity registry. Single source of truth for all identities.
pub struct IdentityRegistry {
    profiles: BTreeMap<IdentityId, Profile>,
    credentials: BTreeMap<CredentialId, (IdentityId, Vec<u8>)>, // credential -> (owner, secret_hash)
    next_identity_id: u64,
    next_credential_id: u64,
}

impl IdentityRegistry {
    pub fn new() -> Self {
        Self {
            profiles: BTreeMap::new(),
            credentials: BTreeMap::new(),
            next_identity_id: 0x1000_0000_0000_0002, // start after genesis/system
            next_credential_id: 1,
        }
    }

    /// Create a new identity with a display name.
    pub fn create_identity(&mut self, display_name: String) -> IdentityId {
        let id = IdentityId::new(self.next_identity_id);
        self.next_identity_id += 1;
        let profile = Profile::new(id, display_name);
        self.profiles.insert(id, profile);
        id
    }

    /// Get a profile by ID.
    pub fn get_profile(&self, id: IdentityId) -> Option<&Profile> {
        self.profiles.get(&id)
    }

    /// Update profile (display name, avatar, metadata).
    pub fn update_profile(&mut self, id: IdentityId, f: impl FnOnce(&mut Profile)) -> Result<(), IdentityError> {
        let profile = self.profiles.get_mut(&id).ok_or(IdentityError::NotFound)?;
        f(profile);
        profile.updated_at = 0; // timestamp placeholder
        Ok(())
    }

    /// Register a credential for an identity.
    pub fn add_credential(&mut self, identity: IdentityId, secret_hash: Vec<u8>) -> CredentialId {
        let cred = CredentialId(self.next_credential_id);
        self.next_credential_id += 1;
        self.credentials.insert(cred, (identity, secret_hash));
        cred
    }

    /// Verify a credential against stored hash.
    pub fn verify_credential(&self, cred: CredentialId, secret: &[u8]) -> bool {
        self.credentials.get(&cred)
            .filter(|(id, _)| *id == self.get_identity_for_credential(cred).unwrap_or(IdentityId::anonymous()))
            .map(|(_, hash)| hash == secret)
            .unwrap_or(false)
    }

    fn get_identity_for_credential(&self, cred: CredentialId) -> Option<IdentityId> {
        self.credentials.get(&cred).map(|(id, _)| *id)
    }

    /// List all identities.
    pub fn list_identities(&self) -> Vec<IdentityId> {
        self.profiles.keys().copied().collect()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum IdentityError {
    NotFound,
    AlreadyExists,
    InvalidInput,
}

impl core::fmt::Display for IdentityError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

impl core::error::Error for IdentityError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn create_and_lookup_identity() {
        let mut reg = IdentityRegistry::new();
        let id = reg.create_identity("Test User".into());
        assert!(reg.get_profile(id).is_some());
        assert_eq!(reg.get_profile(id).unwrap().display_name, "Test User");
    }

    #[test]
    fn identity_registry_default() {
        let reg = IdentityRegistry::new();
        assert!(reg.list_identities().is_empty());
    }
}