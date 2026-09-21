//! Plugin / Adapter Framework (P10-Plugin).
//!
//! Reuses Agent Bridge / Universal-Bridge adapter patterns — does NOT
//! invent a third incompatible system. Minimal registry: manifest +
//! health + policy-gated activation. Consumers: storage/search/MAT/
//! Bridge adapters.

extern crate alloc;

use alloc::collections::BTreeMap;
use alloc::string::String;
use alloc::string::ToString;
use alloc::vec::Vec;

use crate::policy::{Decision, EvalContext, PermissionId, PolicyEngine, ResourceId, Subject};
use crate::provider::{Capability, Provider, ProviderError, ProviderInfo, ProviderState, ProviderStats};

/// Adapter manifest shared with Bridge/UB conventions.
#[derive(Debug, Clone)]
pub struct AdapterManifest {
    pub id: String,
    pub version: String,
    pub provider: String,
    pub protocol: String,
    pub capabilities: Vec<String>,
    pub configuration: BTreeMap<String, String>,
    pub permissions: Vec<String>,
    pub dependencies: Vec<String>,
    pub health: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PluginError {
    AlreadyRegistered,
    NotFound,
    PermissionDenied,
    PolicyUnavailable,
    DependencyMissing(String),
}

impl core::fmt::Display for PluginError {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        match self {
            PluginError::AlreadyRegistered => write!(f, "already registered"),
            PluginError::NotFound => write!(f, "not found"),
            PluginError::PermissionDenied => write!(f, "permission denied"),
            PluginError::PolicyUnavailable => write!(f, "policy unavailable"),
            PluginError::DependencyMissing(d) => write!(f, "dependency missing: {}", d),
        }
    }
}

impl core::error::Error for PluginError {}

pub struct PluginRegistry {
    adapters: BTreeMap<String, AdapterManifest>,
    policy: Option<PolicyEngine>,
}

impl PluginRegistry {
    pub fn new(policy: Option<PolicyEngine>) -> Self {
        Self {
            adapters: BTreeMap::new(),
            policy,
        }
    }

    pub fn register(&mut self, m: AdapterManifest) -> Result<(), PluginError> {
        if self.adapters.contains_key(&m.id) {
            return Err(PluginError::AlreadyRegistered);
        }
        for dep in &m.dependencies {
            if !self.adapters.contains_key(dep) {
                return Err(PluginError::DependencyMissing(dep.clone()));
            }
        }
        self.adapters.insert(m.id.clone(), m);
        Ok(())
    }

    /// Policy-gated activation: adapter's first permission must be allowed.
    pub fn activate_as(&self, subject: &Subject, id: &str) -> Result<(), PluginError> {
        let m = self.adapters.get(id).ok_or(PluginError::NotFound)?;
        let engine = self.policy.as_ref().ok_or(PluginError::PolicyUnavailable)?;
        if m.permissions.is_empty() {
            return Ok(());
        }
        let perm = &m.permissions[0];
        let (svc, act) = match perm.split_once(':') {
            Some((s, a)) => (s, a),
            None => ("plugin", perm.as_str()),
        };
        let ctx = EvalContext {
            subject: subject.clone(),
            resource: ResourceId(alloc::format!("plugin:{}", id)),
            action: PermissionId::new(svc, act),
            attributes: BTreeMap::new(),
            timestamp: 0,
            network_origin: None,
            device_trust: None,
        };
        match engine.evaluate(ctx) {
            Decision::Allow => Ok(()),
            _ => Err(PluginError::PermissionDenied),
        }
    }

    pub fn get(&self, id: &str) -> Option<&AdapterManifest> {
        self.adapters.get(id)
    }

    pub fn list(&self) -> Vec<&AdapterManifest> {
        self.adapters.values().collect()
    }

    pub fn set_health(&mut self, id: &str, health: &str) -> bool {
        match self.adapters.get_mut(id) {
            Some(m) => {
                m.health = health.to_string();
                true
            }
            None => false,
        }
    }
}

impl Provider for PluginRegistry {
    fn id(&self) -> &str {
        "plugins"
    }
    fn info(&self) -> ProviderInfo {
        ProviderInfo {
            id: "plugins".to_string(),
            name: "Plugin/Adapter Framework".to_string(),
            version: "0.1.0".to_string(),
            description: "Bridge-compatible adapter registry".to_string(),
            capabilities: alloc::vec![Capability {
                name: "adapters".to_string(),
                version: "0.1.0".to_string(),
                description: "register/activate adapters".to_string(),
                dependencies: Vec::new(),
                tags: Vec::new(),
            }],
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
        ProviderStats::default()
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

    fn manifest(id: &str, perms: Vec<&str>, deps: Vec<&str>) -> AdapterManifest {
        AdapterManifest {
            id: id.to_string(),
            version: "1.0.0".to_string(),
            provider: "agent-bridge".to_string(),
            protocol: "mcp".to_string(),
            capabilities: alloc::vec!["fs.read".to_string()],
            configuration: BTreeMap::new(),
            permissions: perms.into_iter().map(|s| s.to_string()).collect(),
            dependencies: deps.into_iter().map(|s| s.to_string()).collect(),
            health: "unknown".to_string(),
        }
    }

    #[test]
    fn register_and_list() {
        let mut r = PluginRegistry::new(None);
        r.register(manifest("fs", alloc::vec!["storage:read"], alloc::vec![]))
            .unwrap();
        assert!(r.get("fs").is_some());
        assert_eq!(r.list().len(), 1);
    }

    #[test]
    fn rejects_duplicate_and_missing_dep() {
        let mut r = PluginRegistry::new(None);
        r.register(manifest("a", alloc::vec![], alloc::vec![])).unwrap();
        assert_eq!(
            r.register(manifest("a", alloc::vec![], alloc::vec![]))
                .unwrap_err(),
            PluginError::AlreadyRegistered
        );
        assert!(matches!(
            r.register(manifest("b", alloc::vec![], alloc::vec!["ghost"]))
                .unwrap_err(),
            PluginError::DependencyMissing(_)
        ));
    }

    #[test]
    fn activation_policy_gated() {
        let mut p = PolicyEngine::new();
        p.set_default_decision(Decision::Allow);
        let mut r = PluginRegistry::new(Some(p));
        r.register(manifest("fs", alloc::vec!["storage:read"], alloc::vec![]))
            .unwrap();
        let u = Subject::Identity(IdentityId(1));
        assert!(r.activate_as(&u, "fs").is_ok());
        assert_eq!(r.activate_as(&u, "ghost").unwrap_err(), PluginError::NotFound);
    }

    #[test]
    fn activation_denied_without_grant() {
        let r0 = PluginRegistry::new(Some(PolicyEngine::new()));
        let mut r = r0;
        r.register(manifest("fs", alloc::vec!["storage:read"], alloc::vec![]))
            .unwrap();
        let u = Subject::Identity(IdentityId(2));
        assert_eq!(
            r.activate_as(&u, "fs").unwrap_err(),
            PluginError::PermissionDenied
        );
    }
}
