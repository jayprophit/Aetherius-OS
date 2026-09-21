//! Communication Core (P10-Comms).
//!
//! Shared primitives + adapters (not every external platform):
//! Conversation / Participant / Message / Thread / Channel /
//! Presence / Attachment.

extern crate alloc;

use alloc::collections::BTreeMap;
use alloc::string::String;
use alloc::string::ToString;
use alloc::vec::Vec;

use crate::identity::IdentityId;
use crate::provider::{Capability, Provider, ProviderError, ProviderInfo, ProviderState, ProviderStats};

#[derive(Debug, Clone)]
pub struct Participant {
    pub identity: IdentityId,
    pub role: String,
}

#[derive(Debug, Clone)]
pub struct Attachment {
    pub name: String,
    pub media_id: String,
    pub size: u64,
}

#[derive(Debug, Clone)]
pub struct Message {
    pub id: u64,
    pub thread: String,
    pub channel: String,
    pub author: IdentityId,
    pub body: String,
    pub timestamp: u64,
    pub attachments: Vec<Attachment>,
}

#[derive(Debug, Clone)]
pub struct Conversation {
    pub id: String,
    pub participants: Vec<Participant>,
    pub messages: Vec<Message>,
}

pub struct CommsCore {
    conversations: BTreeMap<String, Conversation>,
    presence: BTreeMap<IdentityId, String>,
    next_msg: u64,
}

impl CommsCore {
    pub fn new() -> Self {
        Self {
            conversations: BTreeMap::new(),
            presence: BTreeMap::new(),
            next_msg: 1,
        }
    }

    pub fn open(&mut self, id: &str, participants: Vec<Participant>) {
        self.conversations.entry(id.to_string()).or_insert(Conversation {
            id: id.to_string(),
            participants,
            messages: Vec::new(),
        });
    }

    pub fn post(
        &mut self,
        conv: &str,
        channel: &str,
        thread: &str,
        author: IdentityId,
        body: &str,
        attachments: Vec<Attachment>,
    ) -> Option<u64> {
        let c = self.conversations.get_mut(conv)?;
        if !c.participants.iter().any(|p| p.identity == author) {
            return None;
        }
        let id = self.next_msg;
        self.next_msg += 1;
        c.messages.push(Message {
            id,
            thread: thread.to_string(),
            channel: channel.to_string(),
            author,
            body: body.to_string(),
            timestamp: 0,
            attachments,
        });
        Some(id)
    }

    pub fn thread_messages(&self, conv: &str, thread: &str) -> Vec<Message> {
        self.conversations
            .get(conv)
            .map(|c| c.messages.iter().filter(|m| m.thread == thread).cloned().collect())
            .unwrap_or_default()
    }

    pub fn set_presence(&mut self, who: IdentityId, state: &str) {
        self.presence.insert(who, state.to_string());
    }

    pub fn presence(&self, who: IdentityId) -> Option<&String> {
        self.presence.get(&who)
    }
}

impl Default for CommsCore {
    fn default() -> Self {
        Self::new()
    }
}

impl Provider for CommsCore {
    fn id(&self) -> &str {
        "comms"
    }
    fn info(&self) -> ProviderInfo {
        ProviderInfo {
            id: "comms".to_string(),
            name: "Communication Core".to_string(),
            version: "0.1.0".to_string(),
            description: "Shared conversation primitives".to_string(),
            capabilities: alloc::vec![Capability {
                name: "comms".to_string(),
                version: "0.1.0".to_string(),
                description: "conversations/messages/presence".to_string(),
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
    fn open_post_thread() {
        let mut c = CommsCore::new();
        c.open(
            "c1",
            alloc::vec![
                Participant { identity: IdentityId(1), role: "member".to_string() },
                Participant { identity: IdentityId(2), role: "member".to_string() },
            ],
        );
        let id = c.post("c1", "general", "t1", IdentityId(1), "hello", Vec::new()).unwrap();
        assert_eq!(id, 1);
        assert_eq!(c.thread_messages("c1", "t1").len(), 1);
    }

    #[test]
    fn non_participant_cannot_post() {
        let mut c = CommsCore::new();
        c.open(
            "c1",
            alloc::vec![Participant { identity: IdentityId(1), role: "member".to_string() }],
        );
        assert!(c.post("c1", "general", "t1", IdentityId(9), "hi", Vec::new()).is_none());
    }

    #[test]
    fn presence_tracks() {
        let mut c = CommsCore::new();
        c.set_presence(IdentityId(1), "online");
        assert_eq!(c.presence(IdentityId(1)).unwrap(), "online");
    }
}
