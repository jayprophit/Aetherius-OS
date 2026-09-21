//! Media Abstraction (P10-Media).
//!
//! Shared platform representation only (Poietek keeps specialist DAW
//! behaviour): image / audio / video / document / stream + metadata
//! (format/codec/size/duration/dimensions/location/owner/permissions/
//! provenance).

extern crate alloc;

use alloc::string::String;
use alloc::string::ToString;
use alloc::vec::Vec;
use alloc::collections::BTreeMap;

use crate::provider::{Capability, Provider, ProviderError, ProviderInfo, ProviderState, ProviderStats};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MediaKind {
    Image,
    Audio,
    Video,
    Document,
    Stream,
}

#[derive(Debug, Clone)]
pub struct MediaAsset {
    pub id: String,
    pub kind: MediaKind,
    pub title: String,
    pub format: String,
    pub codec: String,
    pub size: Option<u64>,
    pub duration_ms: Option<u64>,
    pub dimensions: Option<(u32, u32)>,
    pub location: String,
    pub owner: String,
    pub permissions: Vec<String>,
    pub provenance: String,
}

pub struct MediaRegistry {
    assets: BTreeMap<String, MediaAsset>,
}

impl MediaRegistry {
    pub fn new() -> Self {
        Self {
            assets: BTreeMap::new(),
        }
    }

    pub fn put(&mut self, asset: MediaAsset) {
        self.assets.insert(asset.id.clone(), asset);
    }

    pub fn get(&self, id: &str) -> Option<&MediaAsset> {
        self.assets.get(id)
    }

    pub fn list_by_kind(&self, kind: &MediaKind) -> Vec<&MediaAsset> {
        self.assets.values().filter(|a| &a.kind == kind).collect()
    }
}

impl Default for MediaRegistry {
    fn default() -> Self {
        Self::new()
    }
}

impl Provider for MediaRegistry {
    fn id(&self) -> &str {
        "media"
    }
    fn info(&self) -> ProviderInfo {
        ProviderInfo {
            id: "media".to_string(),
            name: "Media Abstraction".to_string(),
            version: "0.1.0".to_string(),
            description: "Shared media representation".to_string(),
            capabilities: alloc::vec![Capability {
                name: "media".to_string(),
                version: "0.1.0".to_string(),
                description: "register/describe media".to_string(),
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

    fn asset(id: &str, kind: MediaKind) -> MediaAsset {
        MediaAsset {
            id: id.to_string(),
            kind,
            title: id.to_string(),
            format: "wav".to_string(),
            codec: "pcm".to_string(),
            size: Some(1024),
            duration_ms: Some(1000),
            dimensions: None,
            location: "E:/media".to_string(),
            owner: "user".to_string(),
            permissions: alloc::vec!["media:read".to_string()],
            provenance: "poietek-render".to_string(),
        }
    }

    #[test]
    fn put_and_get_with_provenance() {
        let mut m = MediaRegistry::new();
        m.put(asset("a1", MediaKind::Audio));
        let a = m.get("a1").unwrap();
        assert_eq!(a.provenance, "poietek-render");
        assert!(!a.permissions.is_empty());
    }

    #[test]
    fn filter_by_kind() {
        let mut m = MediaRegistry::new();
        m.put(asset("a1", MediaKind::Audio));
        m.put(asset("i1", MediaKind::Image));
        assert_eq!(m.list_by_kind(&MediaKind::Audio).len(), 1);
        assert_eq!(m.list_by_kind(&MediaKind::Video).len(), 0);
    }
}
