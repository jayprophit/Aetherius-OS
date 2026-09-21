//! Provider Framework (P10-Providers).
//!
//! Core provider infrastructure for Aetherius shared platform services.
//! Provides a unified interface for all platform capabilities with
// lifecycle management, health monitoring, and capability discovery.

use alloc::boxed::Box;
use alloc::collections::BTreeMap;
use alloc::collections::BTreeSet;
use alloc::string::String;
use alloc::string::ToString;
use alloc::vec::Vec;
use core::fmt;

use crate::identity::IdentityId;

/// Provider lifecycle states.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum ProviderState {
    /// Provider is initializing.
    Initializing,
    /// Provider is healthy and available.
    Available,
    /// Provider is degraded but functional.
    Degraded,
    /// Provider is unavailable.
    Unavailable,
    /// Provider is in simulated/test mode.
    Simulated,
    /// Provider failed initialization.
    Failed,
}

impl core::fmt::Display for ProviderState {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        match self {
            ProviderState::Initializing => write!(f, "initializing"),
            ProviderState::Available => write!(f, "available"),
            ProviderState::Degraded => write!(f, "degraded"),
            ProviderState::Unavailable => write!(f, "unavailable"),
            ProviderState::Simulated => write!(f, "simulated"),
            ProviderState::Failed => write!(f, "failed"),
        }
    }
}

/// Provider capability descriptor.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Capability {
    pub name: String,
    pub version: String,
    pub description: String,
    pub dependencies: Vec<String>,
    pub tags: Vec<String>,
}

/// Provider metadata for registration and discovery.
#[derive(Debug, Clone)]
pub struct ProviderInfo {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub capabilities: Vec<Capability>,
    pub state: ProviderState,
    pub dependencies: Vec<String>, // provider IDs this provider depends on
    pub config_schema: Option<String>, // JSON schema for configuration
}

/// Provider lifecycle trait. All providers must implement this.
pub trait Provider: Send + Sync {
    /// Unique provider identifier.
    fn id(&self) -> &str;
    
    /// Provider metadata for registration.
    fn info(&self) -> ProviderInfo;
    
    /// Initialize the provider. Called once at startup.
    fn init(&mut self) -> Result<(), ProviderError>;
    
    /// Start the provider. Called after init.
    fn start(&mut self) -> Result<(), ProviderError>;
    
    /// Stop the provider gracefully.
    fn stop(&mut self) -> Result<(), ProviderError>;
    
    /// Health check. Returns current state.
    fn health(&self) -> ProviderState;
    
    /// Get provider statistics/metrics.
    fn stats(&self) -> ProviderStats;
    
    /// Handle configuration updates.
    fn configure(&mut self, config: &str) -> Result<(), ProviderError>;
    
    /// Provider-specific command interface.
    fn command(&mut self, cmd: &str, args: &[&str]) -> Result<String, ProviderError>;
}

/// Provider error type.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ProviderError {
    NotInitialized,
    AlreadyRunning,
    NotRunning,
    ConfigurationError(String),
    DependencyMissing(String),
    ResourceExhausted(String),
    PermissionDenied,
    InternalError(String),
    UnsupportedOperation,
    Timeout,
}

impl core::fmt::Display for ProviderError {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        match self {
            ProviderError::NotInitialized => write!(f, "provider not initialized"),
            ProviderError::AlreadyRunning => write!(f, "provider already running"),
            ProviderError::NotRunning => write!(f, "provider not running"),
            ProviderError::ConfigurationError(e) => write!(f, "configuration error: {}", e),
            ProviderError::DependencyMissing(e) => write!(f, "dependency missing: {}", e),
            ProviderError::ResourceExhausted(e) => write!(f, "resource exhausted: {}", e),
            ProviderError::PermissionDenied => write!(f, "permission denied"),
            ProviderError::InternalError(e) => write!(f, "internal error: {}", e),
            ProviderError::UnsupportedOperation => write!(f, "unsupported operation"),
            ProviderError::Timeout => write!(f, "timeout"),
        }
    }
}

impl core::error::Error for ProviderError {}

/// Provider statistics for monitoring.
#[derive(Debug, Clone, Default)]
pub struct ProviderStats {
    pub uptime_ms: u64,
    pub operations_total: u64,
    pub operations_failed: u64,
    pub bytes_processed: u64,
    pub last_error: Option<String>,
    pub custom: alloc::collections::BTreeMap<String, String>,
}

/// Provider registry for managing all registered providers.
pub struct ProviderRegistry {
    providers: alloc::collections::BTreeMap<String, alloc::boxed::Box<dyn Provider>>,
    start_order: alloc::vec::Vec<String>,
    stop_order: alloc::vec::Vec<String>,
    state: ProviderRegistryState,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum ProviderRegistryState {
    Empty,
    Initializing,
    Running,
    Stopping,
    Stopped,
}

impl ProviderRegistry {
    pub fn new() -> Self {
        Self {
            providers: alloc::collections::BTreeMap::new(),
            start_order: alloc::vec::Vec::new(),
            stop_order: alloc::vec::Vec::new(),
            state: ProviderRegistryState::Empty,
        }
    }
    
    /// Register a provider. Provider must be initialized separately.
    pub fn register(&mut self, provider: alloc::boxed::Box<dyn Provider>) -> Result<(), ProviderError> {
        let id = provider.id().to_string();
        if self.providers.contains_key(&id) {
            return Err(ProviderError::ConfigurationError(
                alloc::format!("provider '{}' already registered", id)
            ));
        }
        self.providers.insert(id.clone(), provider);
        Ok(())
    }
    
    /// Initialize all registered providers in dependency order.
    pub fn initialize_all(&mut self) -> Result<(), ProviderError> {
        if self.state != ProviderRegistryState::Empty {
            return Err(ProviderError::AlreadyRunning);
        }
        self.state = ProviderRegistryState::Initializing;
        
        // Build dependency graph and compute start order
        self.compute_start_order()?;
        
        // Initialize in order
        for id in &self.start_order {
            if let Some(provider) = self.providers.get_mut(id) {
                provider.init()?;
            }
        }
        self.state = ProviderRegistryState::Running;
        Ok(())
    }
    
    /// Start all initialized providers.
    pub fn start_all(&mut self) -> Result<(), ProviderError> {
        if self.state != ProviderRegistryState::Running {
            return Err(ProviderError::NotInitialized);
        }
        for id in &self.start_order {
            if let Some(provider) = self.providers.get_mut(id) {
                provider.start()?;
            }
        }
        Ok(())
    }
    
    /// Stop all providers in reverse order.
    pub fn stop_all(&mut self) -> Result<(), ProviderError> {
        self.state = ProviderRegistryState::Stopping;
        for id in self.stop_order.iter().rev() {
            if let Some(provider) = self.providers.get_mut(id) {
                let _ = provider.stop();
            }
        }
        self.state = ProviderRegistryState::Stopped;
        Ok(())
    }
    
    /// Get a provider by ID.
    pub fn get(&self, id: &str) -> Option<&dyn Provider> {
        self.providers.get(id).map(|p| p.as_ref())
    }
    
    /// Get a mutable provider by ID.
    pub fn get_mut(&mut self, id: &str) -> Option<&mut dyn Provider> {
        self.providers.get_mut(id).map(|p| unsafe { &mut *(p.as_mut() as *mut dyn Provider) })
    }
    
    /// Get all provider IDs.
    pub fn list_ids(&self) -> alloc::vec::Vec<String> {
        self.providers.keys().cloned().collect()
    }
    
    /// Get provider info for all providers.
    pub fn list_info(&self) -> alloc::vec::Vec<ProviderInfo> {
        self.providers.values().map(|p| p.info()).collect()
    }
    
    /// Get overall registry health.
    pub fn health(&self) -> ProviderState {
        if self.state == ProviderRegistryState::Running {
            let all_available = self.providers.values().all(|p| p.health() == ProviderState::Available);
            if all_available {
                ProviderState::Available
            } else {
                ProviderState::Degraded
            }
        } else {
            ProviderState::Unavailable
        }
    }
    
    fn compute_start_order(&mut self) -> Result<(), ProviderError> {
        // Simple topological sort for dependency resolution
        let mut visited = alloc::collections::BTreeMap::new();
        let mut temp = alloc::collections::BTreeMap::new();
        let mut order = alloc::vec::Vec::new();
        
        fn visit(
            id: &str,
            providers: &alloc::collections::BTreeMap<String, alloc::boxed::Box<dyn Provider>>,
            visited: &mut alloc::collections::BTreeMap<String, bool>,
            temp: &mut alloc::collections::BTreeMap<String, bool>,
            order: &mut alloc::vec::Vec<String>,
        ) -> Result<(), ProviderError> {
            if temp.get(id) == Some(&true) {
                return Err(ProviderError::ConfigurationError(
                    alloc::format!("circular dependency detected at '{}'", id)
                ));
            }
            if visited.get(id) == Some(&true) {
                return Ok(());
            }
            temp.insert(id.to_string(), true);
            if let Some(provider) = providers.get(id) {
                for dep in provider.info().dependencies {
                    visit(&dep, providers, visited, temp, order)?;
                }
            }
            temp.remove(id);
            visited.insert(id.to_string(), true);
            order.push(id.to_string());
            Ok(())
        }
        
        for id in self.providers.keys() {
            if visited.get(id) != Some(&true) {
                visit(id, &self.providers, &mut visited, &mut temp, &mut order)?;
            }
        }
        self.start_order = order.clone();
        self.stop_order = order.into_iter().rev().collect();
        Ok(())
    }
}