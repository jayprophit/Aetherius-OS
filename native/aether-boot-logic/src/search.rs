//! Search Provider (P10-Search).
//!
//! One shared search architecture over adapters (apps, files, MAT,
//! settings, commands). Results carry type/source/identifier/title/
//! summary/score/provenance and are filtered by policy (no leaks).

extern crate alloc;

use alloc::collections::BTreeMap;
use alloc::string::String;
use alloc::string::ToString;
use alloc::vec::Vec;

use crate::policy::{Decision, EvalContext, PermissionId, PolicyEngine, ResourceId, Subject};
use crate::provider::{Capability, Provider, ProviderError, ProviderInfo, ProviderState, ProviderStats};

/// A single search hit.
#[derive(Debug, Clone)]
pub struct SearchResult {
    pub kind: String,
    pub source: String,
    pub identifier: String,
    pub title: String,
    pub summary: String,
    pub score: u32,
    pub provenance: String,
    /// Resource gated by policy, e.g. "files:C:/a.txt".
    pub resource: String,
}

/// One searchable adapter (apps, files, MAT, settings, commands...).
#[derive(Debug, Clone)]
pub struct SearchAdapter {
    pub name: String,
    pub items: Vec<SearchResult>,
}

pub struct SearchProvider {
    adapters: Vec<SearchAdapter>,
    policy: Option<PolicyEngine>,
}

impl SearchProvider {
    pub fn new(policy: Option<PolicyEngine>) -> Self {
        Self {
            adapters: Vec::new(),
            policy,
        }
    }

    pub fn register_adapter(&mut self, adapter: SearchAdapter) {
        self.adapters.push(adapter);
    }

    fn allowed(&self, subject: &Subject, resource: &str) -> bool {
        match &self.policy {
            None => true, // no policy => treat as public corpus in tests
            Some(engine) => {
                let ctx = EvalContext {
                    subject: subject.clone(),
                    resource: ResourceId(resource.to_string()),
                    action: PermissionId::new("search", "read"),
                    attributes: BTreeMap::new(),
                    timestamp: 0,
                    network_origin: None,
                    device_trust: None,
                };
                matches!(engine.evaluate(ctx), Decision::Allow)
            }
        }
    }

    /// Search across adapters; denied resources are never returned.
    pub fn search_as(&self, subject: &Subject, query: &str) -> Vec<SearchResult> {
        let q = query.to_lowercase();
        let mut out = Vec::new();
        for adapter in &self.adapters {
            for item in &adapter.items {
                let hay = alloc::format!("{} {} {} {}", item.title, item.summary, item.identifier, item.kind)
                    .to_lowercase();
                if q.is_empty() || hay.contains(&q) {
                    if self.allowed(subject, &item.resource) {
                        out.push(item.clone());
                    }
                }
            }
        }
        out.sort_by(|a, b| b.score.cmp(&a.score));
        out
    }
}

impl Provider for SearchProvider {
    fn id(&self) -> &str {
        "search"
    }
    fn info(&self) -> ProviderInfo {
        ProviderInfo {
            id: "search".to_string(),
            name: "Search Provider".to_string(),
            version: "0.1.0".to_string(),
            description: "Shared policy-filtered search over adapters".to_string(),
            capabilities: alloc::vec![Capability {
                name: "search".to_string(),
                version: "0.1.0".to_string(),
                description: "search adapters".to_string(),
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
    use crate::policy::{Grant, PermissionId, ResourceId};

    fn subj() -> Subject {
        Subject::Identity(IdentityId(9))
    }

    fn item(kind: &str, source: &str, id: &str, title: &str, resource: &str, score: u32) -> SearchResult {
        SearchResult {
            kind: kind.to_string(),
            source: source.to_string(),
            identifier: id.to_string(),
            title: title.to_string(),
            summary: alloc::format!("{} from {}", title, source),
            score,
            provenance: source.to_string(),
            resource: resource.to_string(),
        }
    }

    fn seeded(policy: Option<PolicyEngine>) -> SearchProvider {
        let mut s = SearchProvider::new(policy);
        s.register_adapter(SearchAdapter {
            name: "applications".to_string(),
            items: alloc::vec![item("app", "appreg", "ide", "IDE Workspace", "apps:ide", 90)],
        });
        s.register_adapter(SearchAdapter {
            name: "files".to_string(),
            items: alloc::vec![item("file", "storage", "C:/notes.txt", "notes", "files:C:/notes.txt", 70)],
        });
        s.register_adapter(SearchAdapter {
            name: "mat".to_string(),
            items: alloc::vec![item("material", "mat", "MAT:0001", "Hydrogen", "mat:MAT:0001", 80)],
        });
        s.register_adapter(SearchAdapter {
            name: "settings".to_string(),
            items: alloc::vec![item("setting", "settings", "ui.theme", "UI theme", "settings:ui.theme", 60)],
        });
        s.register_adapter(SearchAdapter {
            name: "commands".to_string(),
            items: alloc::vec![item("command", "shell", "build", "build project", "cmd:build", 50)],
        });
        s
    }

    #[test]
    fn finds_across_adapters() {
        let s = seeded(None);
        let hits = s.search_as(&subj(), "hydrogen");
        assert_eq!(hits.len(), 1);
        assert_eq!(hits[0].source, "mat");
        assert_eq!(hits[0].kind, "material");
    }

    #[test]
    fn ranks_by_score() {
        let s = seeded(None);
        let hits = s.search_as(&subj(), "");
        assert!(hits.len() >= 5);
        assert!(hits[0].score >= hits[1].score);
    }

    #[test]
    fn denies_inaccessible_resources() {
        let mut p = PolicyEngine::new(); // default deny
        let u = subj();
        // Allow only the IDE app resource.
        p.add_grant(Grant {
            subject: u.clone(),
            permission: PermissionId::new("search", "read"),
            resource: ResourceId("apps:ide".to_string()),
            conditions: Vec::new(),
            granted_by: IdentityId(0),
            granted_at: 0,
            expires_at: None,
        });
        let s = seeded(Some(p));
        let hits = s.search_as(&u, "");
        assert_eq!(hits.len(), 1);
        assert_eq!(hits[0].identifier, "ide");
        // Provenance + permission context preserved.
        assert!(!hits[0].provenance.is_empty());
        assert!(!hits[0].resource.is_empty());
    }
}
