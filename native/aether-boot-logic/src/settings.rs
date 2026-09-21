//! Settings / Config Provider (P10-Settings).
//!
//! Layered configuration: system defaults < user < app < env overrides.
//! Validation, schema/versioning, migration, reset. Secrets rejected in
//! ordinary settings; privileged keys gated by policy.

extern crate alloc;

use alloc::collections::BTreeMap;
use alloc::string::String;
use alloc::string::ToString;
use alloc::vec::Vec;

use crate::policy::{Decision, EvalContext, PermissionId, PolicyEngine, ResourceId, Subject};
use crate::provider::{Capability, Provider, ProviderError, ProviderInfo, ProviderState, ProviderStats};

#[derive(Debug, Clone, PartialEq)]
pub enum SettingValue {
    Text(String),
    Integer(i64),
    Boolean(bool),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SettingsError {
    InvalidKey,
    InvalidValue(String),
    SecretRejected,
    PermissionDenied,
    PolicyUnavailable,
    NotFound,
}

impl core::fmt::Display for SettingsError {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        match self {
            SettingsError::InvalidKey => write!(f, "invalid key"),
            SettingsError::InvalidValue(s) => write!(f, "invalid value: {}", s),
            SettingsError::SecretRejected => write!(f, "secrets not allowed in ordinary settings"),
            SettingsError::PermissionDenied => write!(f, "permission denied"),
            SettingsError::PolicyUnavailable => write!(f, "policy unavailable"),
            SettingsError::NotFound => write!(f, "not found"),
        }
    }
}

impl core::error::Error for SettingsError {}

fn is_privileged(key: &str) -> bool {
    key.starts_with("priv.") || key.starts_with("system.secret") || key.starts_with("system.priv")
}

fn looks_secret(key: &str) -> bool {
    let k = key.to_lowercase();
    k.contains("secret") || k.contains("password") || k.contains("token") || k.contains("private_key")
}

fn validate(key: &str, value: &SettingValue) -> Result<(), SettingsError> {
    if key.is_empty() || key.contains(' ') || key.len() > 128 {
        return Err(SettingsError::InvalidKey);
    }
    if looks_secret(key) && !is_privileged(key) {
        return Err(SettingsError::SecretRejected);
    }
    match (key, value) {
        ("ui.theme", SettingValue::Text(t)) => {
            let ok = ["dark", "light", "frost", "aurora", "amber", "classic", "graphite", "forest"]
                .contains(&t.as_str());
            if !ok {
                return Err(SettingsError::InvalidValue("unknown theme".to_string()));
            }
            Ok(())
        }
        ("system.locale", SettingValue::Text(t)) => {
            if t.is_empty() || t.len() > 16 {
                return Err(SettingsError::InvalidValue("bad locale".to_string()));
            }
            Ok(())
        }
        _ => Ok(()),
    }
}

pub struct SettingStore {
    version: u32,
    defaults: BTreeMap<String, SettingValue>,
    user: BTreeMap<String, SettingValue>,
    app: BTreeMap<String, BTreeMap<String, SettingValue>>,
    env_overrides: BTreeMap<String, SettingValue>,
    policy: Option<PolicyEngine>,
}

impl SettingStore {
    pub fn new(policy: Option<PolicyEngine>) -> Self {
        let mut defaults = BTreeMap::new();
        defaults.insert("ui.theme".to_string(), SettingValue::Text("dark".to_string()));
        defaults.insert("system.locale".to_string(), SettingValue::Text("en-GB".to_string()));
        defaults.insert("work.mode".to_string(), SettingValue::Text("chat".to_string()));
        Self {
            version: 1,
            defaults,
            user: BTreeMap::new(),
            app: BTreeMap::new(),
            env_overrides: BTreeMap::new(),
            policy,
        }
    }

    pub fn version(&self) -> u32 {
        self.version
    }

    pub fn migrate(&mut self, target: u32) {
        if target > self.version {
            // v1->v2 example: rename legacy key.
            if self.version < 2 && target >= 2 {
                if let Some(v) = self.user.remove("ui.colour") {
                    self.user.insert("ui.theme".to_string(), v);
                }
            }
            self.version = target;
        }
    }

    fn check_priv(&self, subject: &Subject, key: &str) -> Result<(), SettingsError> {
        if !is_privileged(key) {
            return Ok(());
        }
        let engine = self.policy.as_ref().ok_or(SettingsError::PolicyUnavailable)?;
        let ctx = EvalContext {
            subject: subject.clone(),
            resource: ResourceId(alloc::format!("settings:{}", key)),
            action: PermissionId::new("settings", "write_privileged"),
            attributes: BTreeMap::new(),
            timestamp: 0,
            network_origin: None,
            device_trust: None,
        };
        match engine.evaluate(ctx) {
            Decision::Allow => Ok(()),
            _ => Err(SettingsError::PermissionDenied),
        }
    }

    pub fn set_user(
        &mut self,
        subject: &Subject,
        key: &str,
        value: SettingValue,
    ) -> Result<(), SettingsError> {
        validate(key, &value)?;
        self.check_priv(subject, key)?;
        self.user.insert(key.to_string(), value);
        Ok(())
    }

    pub fn set_app(
        &mut self,
        subject: &Subject,
        app: &str,
        key: &str,
        value: SettingValue,
    ) -> Result<(), SettingsError> {
        validate(key, &value)?;
        self.check_priv(subject, key)?;
        self.app
            .entry(app.to_string())
            .or_default()
            .insert(key.to_string(), value);
        Ok(())
    }

    pub fn set_env(&mut self, key: &str, value: SettingValue) -> Result<(), SettingsError> {
        validate(key, &value)?;
        if is_privileged(key) {
            return Err(SettingsError::PermissionDenied);
        }
        self.env_overrides.insert(key.to_string(), value);
        Ok(())
    }

    /// Resolution: env > app > user > defaults.
    pub fn get(&self, key: &str, app: Option<&str>) -> Option<SettingValue> {
        if let Some(v) = self.env_overrides.get(key) {
            return Some(v.clone());
        }
        if let Some(a) = app {
            if let Some(m) = self.app.get(a) {
                if let Some(v) = m.get(key) {
                    return Some(v.clone());
                }
            }
        }
        if let Some(v) = self.user.get(key) {
            return Some(v.clone());
        }
        self.defaults.get(key).cloned()
    }

    pub fn reset_user(&mut self, key: &str) {
        self.user.remove(key);
    }

    pub fn reset_all_user(&mut self) {
        self.user.clear();
    }
}

impl Provider for SettingStore {
    fn id(&self) -> &str {
        "settings"
    }
    fn info(&self) -> ProviderInfo {
        ProviderInfo {
            id: "settings".to_string(),
            name: "Settings/Config Provider".to_string(),
            version: "0.1.0".to_string(),
            description: "Layered validated settings with policy-gated privileged keys".to_string(),
            capabilities: alloc::vec![Capability {
                name: "settings".to_string(),
                version: "0.1.0".to_string(),
                description: "layered settings".to_string(),
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

    fn subj() -> Subject {
        Subject::Identity(IdentityId(7))
    }

    #[test]
    fn system_defaults_present() {
        let s = SettingStore::new(None);
        assert_eq!(
            s.get("ui.theme", None),
            Some(SettingValue::Text("dark".to_string()))
        );
    }

    #[test]
    fn user_overrides_default() {
        let mut s = SettingStore::new(None);
        s.set_user(&subj(), "ui.theme", SettingValue::Text("aurora".to_string()))
            .unwrap();
        assert_eq!(
            s.get("ui.theme", None),
            Some(SettingValue::Text("aurora".to_string()))
        );
    }

    #[test]
    fn app_and_env_precedence() {
        let mut s = SettingStore::new(None);
        s.set_user(&subj(), "ui.theme", SettingValue::Text("amber".to_string()))
            .unwrap();
        s.set_app(&subj(), "ide", "ui.theme", SettingValue::Text("frost".to_string()))
            .unwrap();
        assert_eq!(
            s.get("ui.theme", Some("ide")),
            Some(SettingValue::Text("frost".to_string()))
        );
        s.set_env("ui.theme", SettingValue::Text("light".to_string()))
            .unwrap();
        assert_eq!(
            s.get("ui.theme", Some("ide")),
            Some(SettingValue::Text("light".to_string()))
        );
    }

    #[test]
    fn validation_rejects_bad_theme() {
        let mut s = SettingStore::new(None);
        let e = s
            .set_user(&subj(), "ui.theme", SettingValue::Text("neon".to_string()))
            .unwrap_err();
        assert!(matches!(e, SettingsError::InvalidValue(_)));
    }

    #[test]
    fn secrets_rejected_in_ordinary_settings() {
        let mut s = SettingStore::new(None);
        let e = s
            .set_user(&subj(), "api.token", SettingValue::Text("abc".to_string()))
            .unwrap_err();
        assert_eq!(e, SettingsError::SecretRejected);
    }

    #[test]
    fn privileged_requires_policy_allow() {
        let mut s = SettingStore::new(Some(PolicyEngine::new()));
        let e = s
            .set_user(&subj(), "priv.admin", SettingValue::Boolean(true))
            .unwrap_err();
        assert_eq!(e, SettingsError::PermissionDenied);

        let mut p = PolicyEngine::new();
        p.set_default_decision(Decision::Allow);
        let mut s2 = SettingStore::new(Some(p));
        s2.set_user(&subj(), "priv.admin", SettingValue::Boolean(true))
            .unwrap();
        assert_eq!(s2.get("priv.admin", None), Some(SettingValue::Boolean(true)));
    }

    #[test]
    fn reset_restores_default() {
        let mut s = SettingStore::new(None);
        s.set_user(&subj(), "ui.theme", SettingValue::Text("amber".to_string()))
            .unwrap();
        s.reset_user("ui.theme");
        assert_eq!(
            s.get("ui.theme", None),
            Some(SettingValue::Text("dark".to_string()))
        );
    }

    #[test]
    fn migration_bumps_version() {
        let mut s = SettingStore::new(None);
        assert_eq!(s.version(), 1);
        s.migrate(2);
        assert_eq!(s.version(), 2);
    }
}
