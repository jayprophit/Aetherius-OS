//! Application Registry (P10-AppReg).
//!
//! Shared Aetherius application registry. Single source of truth for
//! app metadata; no scattered hardcoded definitions in UI.

extern crate alloc;

use alloc::collections::BTreeMap;
use alloc::string::String;
use alloc::string::ToString;
use alloc::vec::Vec;

use crate::provider::{Capability, Provider, ProviderError, ProviderInfo, ProviderState, ProviderStats};

#[derive(Debug, Clone)]
pub struct AppInfo {
    pub id: String,
    pub name: String,
    pub version: String,
    pub publisher: String,
    pub description: String,
    pub entrypoint: String,
    pub icon: String,
    pub capabilities: Vec<String>,
    pub required_permissions: Vec<String>,
    pub supported_platform: String,
    pub integration_endpoints: Vec<String>,
    pub health: String,
    pub launch_method: String,
    pub dependencies: Vec<String>,
    pub update_uri: String,
}

pub struct AppRegistry {
    apps: BTreeMap<String, AppInfo>,
}

impl AppRegistry {
    pub fn new() -> Self {
        let mut r = Self {
            apps: BTreeMap::new(),
        };
        r.register(canonical_ide());
        r.register(canonical_mat());
        r.register(canonical_poietek());
        r
    }

    pub fn register(&mut self, app: AppInfo) {
        self.apps.insert(app.id.clone(), app);
    }

    pub fn get(&self, id: &str) -> Option<&AppInfo> {
        self.apps.get(id)
    }

    pub fn list(&self) -> Vec<&AppInfo> {
        self.apps.values().collect()
    }

    pub fn set_health(&mut self, id: &str, health: &str) -> bool {
        match self.apps.get_mut(id) {
            Some(a) => {
                a.health = health.to_string();
                true
            }
            None => false,
        }
    }
}

impl Default for AppRegistry {
    fn default() -> Self {
        Self::new()
    }
}

fn canonical_ide() -> AppInfo {
    AppInfo {
        id: "ide-workspace".to_string(),
        name: "IDE Workspace".to_string(),
        version: "0.1.0".to_string(),
        publisher: "Aetherius".to_string(),
        description: "Creation/work interface + Genesis presence".to_string(),
        entrypoint: "ide://workspace".to_string(),
        icon: "ide".to_string(),
        capabilities: alloc::vec!["chat".to_string(), "work".to_string(), "code".to_string()],
        required_permissions: alloc::vec!["storage:read".to_string(), "storage:write".to_string()],
        supported_platform: "aetherius-hosted".to_string(),
        integration_endpoints: alloc::vec!["genesis".to_string(), "agent-bridge".to_string()],
        health: "unknown".to_string(),
        launch_method: "embedded".to_string(),
        dependencies: Vec::new(),
        update_uri: "".to_string(),
    }
}

fn canonical_mat() -> AppInfo {
    AppInfo {
        id: "mat".to_string(),
        name: "MAT".to_string(),
        version: "1.0.0".to_string(),
        publisher: "Aetherius".to_string(),
        description: "Structured materials knowledge".to_string(),
        entrypoint: "mat://query".to_string(),
        icon: "mat".to_string(),
        capabilities: alloc::vec!["query".to_string(), "search".to_string()],
        required_permissions: alloc::vec!["mat:read".to_string()],
        supported_platform: "aetherius-hosted".to_string(),
        integration_endpoints: alloc::vec!["mat-query-service".to_string()],
        health: "unknown".to_string(),
        launch_method: "service".to_string(),
        dependencies: Vec::new(),
        update_uri: "".to_string(),
    }
}

fn canonical_poietek() -> AppInfo {
    AppInfo {
        id: "poietek".to_string(),
        name: "Poietek".to_string(),
        version: "0.5.0".to_string(),
        publisher: "Aetherius".to_string(),
        description: "Music/DAW application".to_string(),
        entrypoint: "poietek://studio".to_string(),
        icon: "poietek".to_string(),
        capabilities: alloc::vec!["daw".to_string(), "midi".to_string()],
        required_permissions: alloc::vec!["media:read".to_string()],
        supported_platform: "aetherius-hosted".to_string(),
        integration_endpoints: alloc::vec!["universal-bridge".to_string()],
        health: "unknown".to_string(),
        launch_method: "embedded".to_string(),
        dependencies: alloc::vec!["universal-bridge".to_string()],
        update_uri: "".to_string(),
    }
}

impl Provider for AppRegistry {
    fn id(&self) -> &str {
        "appreg"
    }
    fn info(&self) -> ProviderInfo {
        ProviderInfo {
            id: "appreg".to_string(),
            name: "Application Registry".to_string(),
            version: "0.1.0".to_string(),
            description: "Shared Aetherius application registry".to_string(),
            capabilities: alloc::vec![Capability {
                name: "appreg".to_string(),
                version: "0.1.0".to_string(),
                description: "register/discover apps".to_string(),
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

    #[test]
    fn canonical_apps_registered() {
        let r = AppRegistry::new();
        assert!(r.get("ide-workspace").is_some());
        assert!(r.get("mat").is_some());
        assert!(r.get("poietek").is_some());
        assert!(r.list().len() >= 3);
    }

    #[test]
    fn metadata_complete() {
        let r = AppRegistry::new();
        let ide = r.get("ide-workspace").unwrap();
        assert!(!ide.entrypoint.is_empty());
        assert!(!ide.capabilities.is_empty());
        assert!(!ide.required_permissions.is_empty());
        assert!(!ide.supported_platform.is_empty());
    }

    #[test]
    fn health_update() {
        let mut r = AppRegistry::new();
        assert!(r.set_health("mat", "healthy"));
        assert_eq!(r.get("mat").unwrap().health, "healthy");
        assert!(!r.set_health("missing", "healthy"));
    }
}
