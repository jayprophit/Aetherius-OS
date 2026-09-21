//! Notification Provider (P10-Notify).
//!
//! Reliable local/in-app notifications. Transports (desktop/mobile/
//! email/push) are future adapters; core primitives ship now.

extern crate alloc;

use alloc::collections::BTreeMap;
use alloc::string::String;
use alloc::string::ToString;
use alloc::vec::Vec;

use crate::identity::IdentityId;
use crate::provider::{Capability, Provider, ProviderError, ProviderInfo, ProviderState, ProviderStats};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Priority {
    Low,
    Normal,
    High,
    Critical,
}

#[derive(Debug, Clone)]
pub struct Notification {
    pub id: u64,
    pub source: String,
    pub recipient: IdentityId,
    pub kind: String,
    pub priority: Priority,
    pub title: String,
    pub message: String,
    pub timestamp: u64,
    pub read: bool,
    pub action: Option<String>,
    pub expiry: Option<u64>,
}

pub struct NotificationService {
    items: BTreeMap<u64, Notification>,
    next_id: u64,
}

impl NotificationService {
    pub fn new() -> Self {
        Self {
            items: BTreeMap::new(),
            next_id: 1,
        }
    }

    #[allow(clippy::too_many_arguments)]
    pub fn send(
        &mut self,
        source: &str,
        recipient: IdentityId,
        kind: &str,
        priority: Priority,
        title: &str,
        message: &str,
        action: Option<String>,
        expiry: Option<u64>,
    ) -> u64 {
        let id = self.next_id;
        self.next_id += 1;
        self.items.insert(
            id,
            Notification {
                id,
                source: source.to_string(),
                recipient,
                kind: kind.to_string(),
                priority,
                title: title.to_string(),
                message: message.to_string(),
                timestamp: 0,
                read: false,
                action,
                expiry,
            },
        );
        id
    }

    pub fn list_for(&self, recipient: IdentityId) -> Vec<Notification> {
        let mut out: Vec<Notification> = self
            .items
            .values()
            .filter(|n| n.recipient == recipient)
            .cloned()
            .collect();
        out.sort_by_key(|n| n.id);
        out
    }

    pub fn unread_count(&self, recipient: IdentityId) -> usize {
        self.items
            .values()
            .filter(|n| n.recipient == recipient && !n.read)
            .count()
    }

    pub fn mark_read(&mut self, id: u64) -> bool {
        match self.items.get_mut(&id) {
            Some(n) => {
                n.read = true;
                true
            }
            None => false,
        }
    }

    pub fn purge_expired(&mut self, now: u64) -> usize {
        let expired: Vec<u64> = self
            .items
            .iter()
            .filter(|(_, n)| n.expiry.map(|e| e <= now).unwrap_or(false))
            .map(|(id, _)| *id)
            .collect();
        let n = expired.len();
        for id in expired {
            self.items.remove(&id);
        }
        n
    }
}

impl Default for NotificationService {
    fn default() -> Self {
        Self::new()
    }
}

impl Provider for NotificationService {
    fn id(&self) -> &str {
        "notifications"
    }
    fn info(&self) -> ProviderInfo {
        ProviderInfo {
            id: "notifications".to_string(),
            name: "Notification Provider".to_string(),
            version: "0.1.0".to_string(),
            description: "Local/in-app notifications".to_string(),
            capabilities: alloc::vec![Capability {
                name: "notify".to_string(),
                version: "0.1.0".to_string(),
                description: "send/list/ack notifications".to_string(),
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
    fn send_and_list() {
        let mut n = NotificationService::new();
        let u = IdentityId(3);
        let id = n.send("build", u, "info", Priority::Normal, "done", "ok", None, None);
        assert_eq!(id, 1);
        let list = n.list_for(u);
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].title, "done");
        assert!(!list[0].read);
    }

    #[test]
    fn unread_and_mark_read() {
        let mut n = NotificationService::new();
        let u = IdentityId(4);
        let id = n.send("ide", u, "warn", Priority::High, "t", "m", None, None);
        assert_eq!(n.unread_count(u), 1);
        assert!(n.mark_read(id));
        assert_eq!(n.unread_count(u), 0);
    }

    #[test]
    fn expiry_purge() {
        let mut n = NotificationService::new();
        let u = IdentityId(5);
        n.send("sys", u, "info", Priority::Low, "old", "m", None, Some(10));
        n.send("sys", u, "info", Priority::Low, "new", "m", None, Some(100));
        assert_eq!(n.purge_expired(50), 1);
        assert_eq!(n.list_for(u).len(), 1);
    }

    #[test]
    fn isolates_recipients() {
        let mut n = NotificationService::new();
        n.send("a", IdentityId(6), "info", Priority::Normal, "t", "m", None, None);
        assert!(n.list_for(IdentityId(7)).is_empty());
    }
}
