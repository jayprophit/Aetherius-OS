//! File / Storage Provider (P10-FS).
//!
//! Shared permission-aware storage service: canonical path resolution,
//! traversal protection, identity + policy gates, read/write distinction,
//! audit receipts, safe failures. Roots: C: required, E: optional.

extern crate alloc;

use alloc::collections::BTreeMap;
use alloc::string::String;
use alloc::string::ToString;
use alloc::vec::Vec;

use crate::policy::{Decision, EvalContext, PermissionId, PolicyEngine, ResourceId, Subject};
use crate::provider::{Capability, Provider, ProviderError, ProviderInfo, ProviderState, ProviderStats};

/// Storage root configuration.
#[derive(Debug, Clone)]
pub struct StorageRoot {
    pub root: String,
    pub required: bool,
    pub write_enabled: bool,
    pub description: String,
}

/// Item metadata.
#[derive(Debug, Clone)]
pub struct StorageMetadata {
    pub name: String,
    pub item_type: String,
    pub read_only: bool,
    pub size: Option<u64>,
    pub modified: u64,
}

/// Storage errors.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum StorageError {
    NotFound(String),
    PathTraversal(String),
    PermissionDenied,
    InvalidPath,
    PolicyUnavailable,
    AlreadyExists,
    IsADirectory,
    NotADirectory,
}

impl core::fmt::Display for StorageError {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        match self {
            StorageError::NotFound(s) => write!(f, "not found: {}", s),
            StorageError::PathTraversal(s) => write!(f, "path traversal blocked: {}", s),
            StorageError::PermissionDenied => write!(f, "permission denied"),
            StorageError::InvalidPath => write!(f, "invalid path"),
            StorageError::PolicyUnavailable => write!(f, "policy unavailable"),
            StorageError::AlreadyExists => write!(f, "already exists"),
            StorageError::IsADirectory => write!(f, "is a directory"),
            StorageError::NotADirectory => write!(f, "not a directory"),
        }
    }
}

impl core::error::Error for StorageError {}

#[derive(Debug, Clone)]
enum Entry {
    File { meta: StorageMetadata, content: Vec<u8> },
    Dir { meta: StorageMetadata },
}

/// Audit receipt.
#[derive(Debug, Clone)]
pub struct StorageAuditRecord {
    pub operation: String,
    pub path: String,
    pub allowed: bool,
    pub timestamp: u64,
}

fn default_roots() -> BTreeMap<String, StorageRoot> {
    let mut m = BTreeMap::new();
    m.insert(
        "C:".to_string(),
        StorageRoot {
            root: "C:".to_string(),
            required: true,
            write_enabled: true,
            description: "Active development root".to_string(),
        },
    );
    m.insert(
        "E:".to_string(),
        StorageRoot {
            root: "E:".to_string(),
            required: false,
            write_enabled: true,
            description: "Optional data root".to_string(),
        },
    );
    m
}

/// Shared storage service.
pub struct StorageProvider {
    roots: BTreeMap<String, StorageRoot>,
    entries: BTreeMap<String, Entry>,
    policy: Option<PolicyEngine>,
    audit_log: Vec<StorageAuditRecord>,
}

impl StorageProvider {
    pub fn new(policy: Option<PolicyEngine>) -> Self {
        Self {
            roots: default_roots(),
            entries: BTreeMap::new(),
            policy,
            audit_log: Vec::new(),
        }
    }

    pub fn audit_log(&self) -> &[StorageAuditRecord] {
        &self.audit_log
    }

    fn record(&mut self, op: &str, path: &str, allowed: bool) {
        self.audit_log.push(StorageAuditRecord {
            operation: op.to_string(),
            path: path.to_string(),
            allowed,
            timestamp: 0,
        });
    }

    /// Canonicalize to "ROOT/rest". Rejects traversal and invalid paths.
    pub fn canonicalize(&self, path: &str) -> Result<String, StorageError> {
        let t = path.trim();
        if t.is_empty() {
            return Err(StorageError::InvalidPath);
        }
        let norm = t.replace('\\', "/");
        // Detect explicit root prefix.
        let (root, rest) = if norm.len() >= 2 && norm.as_bytes()[1] == b':' {
            let r = norm[0..2].to_uppercase();
            if !self.roots.contains_key(&r) {
                return Err(StorageError::InvalidPath);
            }
            let rest = norm[2..].trim_start_matches('/');
            (r, rest.to_string())
        } else if norm.starts_with('/') {
            ("C:".to_string(), norm.trim_start_matches('/').to_string())
        } else {
            ("C:".to_string(), norm)
        };
        if rest.contains('\0') || rest.contains('*') || rest.contains('?') || rest.contains('<') || rest.contains('>') || rest.contains('|') {
            return Err(StorageError::InvalidPath);
        }
        let mut parts: Vec<&str> = Vec::new();
        for comp in rest.split('/') {
            match comp {
                "" | "." => {}
                ".." => {
                    if parts.pop().is_none() {
                        return Err(StorageError::PathTraversal(
                            alloc::format!("escape in '{}'", path),
                        ));
                    }
                }
                c => parts.push(c),
            }
        }
        if parts.is_empty() {
            Ok(alloc::format!("{}/", root))
        } else {
            Ok(alloc::format!("{}/{}", root, parts.join("/")))
        }
    }

    fn check(&self, subject: &Subject, canonical: &str, action: &str) -> Result<(), StorageError> {
        let engine = self.policy.as_ref().ok_or(StorageError::PolicyUnavailable)?;
        let ctx = EvalContext {
            subject: subject.clone(),
            resource: ResourceId(canonical.to_string()),
            action: PermissionId::new("storage", action),
            attributes: BTreeMap::new(),
            timestamp: 0,
            network_origin: None,
            device_trust: None,
        };
        match engine.evaluate(ctx) {
            Decision::Allow => Ok(()),
            _ => Err(StorageError::PermissionDenied),
        }
    }

    fn ensure_parent(&mut self, canonical: &str) {
        if let Some(idx) = canonical.rfind('/') {
            let parent = &canonical[..=idx];
            if parent.len() > 3 && !self.entries.contains_key(parent) {
                let name = parent.to_string();
                self.entries.insert(
                    parent.to_string(),
                    Entry::Dir {
                        meta: StorageMetadata {
                            name,
                            item_type: "directory".to_string(),
                            read_only: false,
                            size: None,
                            modified: 0,
                        },
                    },
                );
            }
        }
    }

    fn is_root(&self, canonical: &str) -> bool {
        canonical == "C:/" || canonical == "E:/"
    }

    pub fn create_dir_as(&mut self, subject: &Subject, path: &str) -> Result<(), StorageError> {
        let c = self.canonicalize(path)?;
        if self.entries.contains_key(&c) || self.is_root(&c) {
            return Err(StorageError::AlreadyExists);
        }
        match self.check(subject, &c, "create") {
            Ok(()) => {}
            Err(e) => {
                self.record("create", &c, false);
                return Err(e);
            }
        }
        self.ensure_parent(&c);
        let dir_c = if c.ends_with('/') { c.clone() } else { alloc::format!("{}/", c) };
        let name = dir_c.clone();
        self.entries.insert(
            dir_c.clone(),
            Entry::Dir {
                meta: StorageMetadata {
                    name,
                    item_type: "directory".to_string(),
                    read_only: false,
                    size: None,
                    modified: 0,
                },
            },
        );
        self.record("create", &c, true);
        Ok(())
    }

    pub fn write_as(
        &mut self,
        subject: &Subject,
        path: &str,
        content: Vec<u8>,
    ) -> Result<(), StorageError> {
        let c = self.canonicalize(path)?;
        if self.is_root(&c) {
            return Err(StorageError::IsADirectory);
        }
        if let Some(Entry::Dir { .. }) = self.entries.get(&c) {
            return Err(StorageError::IsADirectory);
        }
        if let Some(Entry::File { meta, .. }) = self.entries.get(&c) {
            if meta.read_only {
                self.record("write", &c, false);
                return Err(StorageError::PermissionDenied);
            }
        }
        // Root write gate: E: optional but writable; unknown handled in canonicalize.
        match self.check(subject, &c, "write") {
            Ok(()) => {}
            Err(e) => {
                self.record("write", &c, false);
                return Err(e);
            }
        }
        self.ensure_parent(&c);
        let name = c.rsplit('/').next().unwrap_or(&c).to_string();
        self.entries.insert(
            c.clone(),
            Entry::File {
                meta: StorageMetadata {
                    name,
                    item_type: "file".to_string(),
                    read_only: false,
                    size: Some(content.len() as u64),
                    modified: 0,
                },
                content,
            },
        );
        self.record("write", &c, true);
        Ok(())
    }

    pub fn read_as(&mut self, subject: &Subject, path: &str) -> Result<Vec<u8>, StorageError> {
        let c = self.canonicalize(path)?;
        match self.check(subject, &c, "read") {
            Ok(()) => {}
            Err(e) => {
                self.record("read", &c, false);
                return Err(e);
            }
        }
        let entry = self.entries.get(&c).cloned();
        match entry {
            Some(Entry::File { content, .. }) => {
                self.record("read", &c, true);
                Ok(content)
            }
            Some(Entry::Dir { .. }) => {
                self.record("read", &c, false);
                Err(StorageError::IsADirectory)
            }
            None => {
                self.record("read", &c, false);
                Err(StorageError::NotFound(c))
            }
        }
    }

    pub fn metadata_as(
        &mut self,
        subject: &Subject,
        path: &str,
    ) -> Result<StorageMetadata, StorageError> {
        let c = self.canonicalize(path)?;
        match self.check(subject, &c, "read") {
            Ok(()) => {}
            Err(e) => {
                self.record("metadata", &c, false);
                return Err(e);
            }
        }
        if self.is_root(&c) {
            self.record("metadata", &c, true);
            return Ok(StorageMetadata {
                name: c.clone(),
                item_type: "directory".to_string(),
                read_only: false,
                size: None,
                modified: 0,
            });
        }
        let entry = self.entries.get(&c).cloned();
        match entry {
            Some(Entry::File { meta, .. }) => {
                self.record("metadata", &c, true);
                Ok(meta)
            }
            Some(Entry::Dir { meta }) => {
                // Accept both "C:/dir" and "C:/dir/" keys.
                self.record("metadata", &c, true);
                Ok(meta)
            }
            None => {
                // Try trailing-slash variant for dirs.
                let alt = alloc::format!("{}/", c.trim_end_matches('/'));
                let alt_entry = self.entries.get(&alt).cloned();
                if let Some(Entry::Dir { meta }) = alt_entry {
                    self.record("metadata", &c, true);
                    return Ok(meta);
                }
                self.record("metadata", &c, false);
                Err(StorageError::NotFound(c))
            }
        }
    }

    pub fn list_as(&mut self, subject: &Subject, path: &str) -> Result<Vec<String>, StorageError> {
        let c = self.canonicalize(path)?;
        match self.check(subject, &c, "list") {
            Ok(()) => {}
            Err(e) => {
                self.record("list", &c, false);
                return Err(e);
            }
        }
        let prefix = if c.ends_with('/') { c.clone() } else { alloc::format!("{}/", c) };
        let mut out = Vec::new();
        for key in self.entries.keys() {
            if key.starts_with(&prefix) {
                let rest = &key[prefix.len()..];
                if !rest.is_empty() && !rest.trim_end_matches('/').contains('/') {
                    out.push(key.clone());
                }
            }
        }
        self.record("list", &c, true);
        Ok(out)
    }

    pub fn delete_as(&mut self, subject: &Subject, path: &str) -> Result<(), StorageError> {
        let c = self.canonicalize(path)?;
        match self.check(subject, &c, "delete") {
            Ok(()) => {}
            Err(e) => {
                self.record("delete", &c, false);
                return Err(e);
            }
        }
        if self.entries.remove(&c).is_some() {
            self.record("delete", &c, true);
            return Ok(());
        }
        let alt = alloc::format!("{}/", c.trim_end_matches('/'));
        if self.entries.remove(&alt).is_some() {
            self.record("delete", &c, true);
            return Ok(());
        }
        self.record("delete", &c, false);
        Err(StorageError::NotFound(c))
    }

    pub fn copy_as(&mut self, subject: &Subject, from: &str, to: &str) -> Result<(), StorageError> {
        let data = self.read_as(subject, from)?;
        self.write_as(subject, to, data)?;
        Ok(())
    }

    pub fn move_as(&mut self, subject: &Subject, from: &str, to: &str) -> Result<(), StorageError> {
        let data = self.read_as(subject, from)?;
        self.write_as(subject, to, data)?;
        let _ = self.delete_as(subject, from);
        Ok(())
    }

    pub fn set_read_only(&mut self, path: &str, ro: bool) -> Result<(), StorageError> {
        let c = self.canonicalize(path)?;
        match self.entries.get_mut(&c) {
            Some(Entry::File { meta, .. }) => {
                meta.read_only = ro;
                Ok(())
            }
            Some(Entry::Dir { meta }) => {
                meta.read_only = ro;
                Ok(())
            }
            None => Err(StorageError::NotFound(c)),
        }
    }
}

impl Provider for StorageProvider {
    fn id(&self) -> &str {
        "storage"
    }
    fn info(&self) -> ProviderInfo {
        ProviderInfo {
            id: "storage".to_string(),
            name: "File/Storage Provider".to_string(),
            version: "0.1.0".to_string(),
            description: "Shared permission-aware storage service".to_string(),
            capabilities: alloc::vec![
                Capability {
                    name: "list".to_string(),
                    version: "0.1.0".to_string(),
                    description: "List directory contents".to_string(),
                    dependencies: Vec::new(),
                    tags: alloc::vec!["filesystem".to_string()],
                },
                Capability {
                    name: "read".to_string(),
                    version: "0.1.0".to_string(),
                    description: "Read file content".to_string(),
                    dependencies: Vec::new(),
                    tags: alloc::vec!["filesystem".to_string()],
                },
                Capability {
                    name: "write".to_string(),
                    version: "0.1.0".to_string(),
                    description: "Write file content".to_string(),
                    dependencies: Vec::new(),
                    tags: alloc::vec!["filesystem".to_string()],
                },
            ],
            state: ProviderState::Available,
            dependencies: Vec::new(),
            config_schema: None,
        }
    }
    fn init(&mut self) -> Result<(), ProviderError> {
        Ok(())
    }
    fn start(&mut self) -> Result<(), ProviderError> {
        Ok(())
    }
    fn stop(&mut self) -> Result<(), ProviderError> {
        Ok(())
    }
    fn health(&self) -> ProviderState {
        ProviderState::Available
    }
    fn stats(&self) -> ProviderStats {
        ProviderStats {
            uptime_ms: 0,
            operations_total: self.audit_log.len() as u64,
            operations_failed: self.audit_log.iter().filter(|r| !r.allowed).count() as u64,
            bytes_processed: 0,
            last_error: None,
            custom: BTreeMap::new(),
        }
    }
    fn configure(&mut self, _config: &str) -> Result<(), ProviderError> {
        Ok(())
    }
    fn command(&mut self, _cmd: &str, _args: &[&str]) -> Result<String, ProviderError> {
        Ok("ok".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::identity::IdentityId;
    use crate::policy::{Grant, PermissionId, ResourceId};
    use alloc::vec;

    fn allow_all() -> PolicyEngine {
        let mut p = PolicyEngine::new();
        p.set_default_decision(Decision::Allow);
        p
    }

    fn subj(id: u64) -> Subject {
        Subject::Identity(IdentityId(id))
    }

    fn grant(p: &mut PolicyEngine, subject: &Subject, action: &str, resource: &str) {
        p.add_grant(Grant {
            subject: subject.clone(),
            permission: PermissionId::new("storage", action),
            resource: ResourceId(resource.to_string()),
            conditions: Vec::new(),
            granted_by: IdentityId(0),
            granted_at: 0,
            expires_at: None,
        });
    }

    #[test]
    fn allowed_read() {
        let mut s = StorageProvider::new(Some(allow_all()));
        let u = subj(1);
        s.write_as(&u, "C:/a.txt", b"hi".to_vec()).unwrap();
        let data = s.read_as(&u, "C:/a.txt").unwrap();
        assert_eq!(data, b"hi");
    }

    #[test]
    fn denied_read() {
        let mut p = PolicyEngine::new(); // default deny
        let u = subj(1);
        let other = subj(2);
        grant(&mut p, &other, "read", "C:/a.txt");
        grant(&mut p, &other, "write", "C:/a.txt");
        let mut s = StorageProvider::new(Some(p));
        s.write_as(&other, "C:/a.txt", b"x".to_vec()).unwrap();
        assert_eq!(s.read_as(&u, "C:/a.txt").unwrap_err(), StorageError::PermissionDenied);
    }

    #[test]
    fn allowed_write() {
        let mut s = StorageProvider::new(Some(allow_all()));
        let u = subj(1);
        s.write_as(&u, "E:/data/b.bin", alloc::vec![1, 2, 3]).unwrap();
        assert_eq!(s.read_as(&u, "E:/data/b.bin").unwrap(), vec![1, 2, 3]);
    }

    #[test]
    fn denied_write() {
        let mut p = PolicyEngine::new();
        let u = subj(1);
        grant(&mut p, &u, "read", "C:/a.txt");
        let mut s = StorageProvider::new(Some(p));
        assert_eq!(
            s.write_as(&u, "C:/a.txt", b"x".to_vec()).unwrap_err(),
            StorageError::PermissionDenied
        );
    }

    #[test]
    fn missing_file() {
        let mut s = StorageProvider::new(Some(allow_all()));
        let u = subj(1);
        assert!(matches!(
            s.read_as(&u, "C:/nope.txt").unwrap_err(),
            StorageError::NotFound(_)
        ));
    }

    #[test]
    fn invalid_path() {
        let s = StorageProvider::new(Some(allow_all()));
        assert_eq!(s.canonicalize("").unwrap_err(), StorageError::InvalidPath);
        assert_eq!(s.canonicalize("Q:/x").unwrap_err(), StorageError::InvalidPath);
        assert_eq!(s.canonicalize("C:/a*b").unwrap_err(), StorageError::InvalidPath);
    }

    #[test]
    fn path_traversal_blocked() {
        let s = StorageProvider::new(Some(allow_all()));
        assert!(matches!(
            s.canonicalize("C:/a/../../etc").unwrap_err(),
            StorageError::PathTraversal(_)
        ));
        assert!(matches!(
            s.canonicalize("C:/../x").unwrap_err(),
            StorageError::PathTraversal(_)
        ));
    }

    #[test]
    fn read_only_resource() {
        let mut s = StorageProvider::new(Some(allow_all()));
        let u = subj(1);
        s.write_as(&u, "C:/ro.txt", b"v".to_vec()).unwrap();
        s.set_read_only("C:/ro.txt", true).unwrap();
        assert_eq!(
            s.write_as(&u, "C:/ro.txt", b"v2".to_vec()).unwrap_err(),
            StorageError::PermissionDenied
        );
        // Read still works.
        assert_eq!(s.read_as(&u, "C:/ro.txt").unwrap(), b"v");
    }

    #[test]
    fn policy_unavailable() {
        let mut s = StorageProvider::new(None);
        let u = subj(1);
        assert_eq!(
            s.read_as(&u, "C:/a.txt").unwrap_err(),
            StorageError::PolicyUnavailable
        );
    }

    #[test]
    fn audit_receipt_recorded() {
        let mut s = StorageProvider::new(Some(allow_all()));
        let u = subj(1);
        s.write_as(&u, "C:/a.txt", b"1".to_vec()).unwrap();
        let _ = s.read_as(&u, "C:/a.txt").unwrap();
        let _ = s.read_as(&u, "C:/missing.txt");
        assert!(s.audit_log().len() >= 3);
        assert!(s.audit_log().iter().any(|r| r.allowed));
        assert!(s.audit_log().iter().any(|r| !r.allowed));
    }
}
