//! Permission & Policy Engine (P10-Policy).
//!
//! Provides the canonical authorization framework for all Aetherius
//! services. Enforces RBAC/ABAC/capability-based policies at service,
//! API, runtime, and Agent Bridge boundaries.
//!
//! UI hiding is NOT access control. Policy must be enforceable at the
//! service/API/runtime/Bridge boundaries.

use alloc::string::String;
use alloc::vec::Vec;
use alloc::collections::BTreeMap;
use alloc::collections::BTreeSet;
use core::fmt;

extern crate alloc;

use crate::identity;

/// Unique permission identifier. Namespaced by service.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Ord, PartialOrd)]
pub struct PermissionId(pub String);

impl PermissionId {
    pub fn new(service: &str, action: &str) -> Self {
        Self(alloc::format!("{}:{}", service, action))
    }
}

/// Role identifier. Composed of permission sets.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Ord, PartialOrd)]
pub struct RoleId(pub String);

/// Subject (user, service, device) that can be granted permissions.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Ord, PartialOrd)]
pub enum Subject {
    Identity(identity::IdentityId),
    Service(String),
    Device(String),
    Anonymous,
}

/// Resource that can be accessed. Namespaced by service.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Ord, PartialOrd)]
pub struct ResourceId(pub String);

/// Permission grant: subject -> permission on resource.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Grant {
    pub subject: Subject,
    pub permission: PermissionId,
    pub resource: ResourceId,
    pub conditions: Vec<Condition>,
    pub granted_by: identity::IdentityId,
    pub granted_at: u64,
    pub expires_at: Option<u64>,
}

/// Condition for ABAC (Attribute-Based Access Control).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Condition {
    TimeRange(u64, u64),
    NetworkPrefix(String),
    DeviceTrust(u8),
    Attribute(String, String),
    Predicate(String),
}

/// Role definition: a named set of permissions.
#[derive(Debug, Clone)]
pub struct Role {
    pub id: RoleId,
    pub name: String,
    pub description: String,
    pub permissions: BTreeSet<PermissionId>,
    pub implied_roles: BTreeSet<RoleId>,
}

/// Policy decision.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Decision {
    Allow,
    Deny,
    NotApplicable,
}

/// Evaluation context for policy decisions.
#[derive(Debug, Clone)]
pub struct EvalContext {
    pub subject: Subject,
    pub resource: ResourceId,
    pub action: PermissionId,
    pub attributes: alloc::collections::BTreeMap<String, String>,
    pub timestamp: u64,
    pub network_origin: Option<String>,
    pub device_trust: Option<u8>,
}

/// Policy engine. Evaluates grants, roles, and conditions.
pub struct PolicyEngine {
    grants: alloc::collections::BTreeMap<Subject, Vec<Grant>>,
    roles: alloc::collections::BTreeMap<RoleId, Role>,
    subject_roles: alloc::collections::BTreeMap<Subject, alloc::collections::BTreeSet<RoleId>>,
    default_decision: Decision,
}

impl Default for PolicyEngine {
    fn default() -> Self {
        Self {
            grants: alloc::collections::BTreeMap::new(),
            roles: alloc::collections::BTreeMap::new(),
            subject_roles: alloc::collections::BTreeMap::new(),
            default_decision: Decision::Deny,
        }
    }
}

impl PolicyEngine {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn set_default_decision(&mut self, decision: Decision) {
        self.default_decision = decision;
    }

    pub fn add_grant(&mut self, grant: Grant) {
        self.grants.entry(grant.subject.clone()).or_default().push(grant);
    }

    pub fn revoke_grant(&mut self, subject: &Subject, permission: &PermissionId, resource: &ResourceId) -> bool {
        if let Some(grants) = self.grants.get_mut(subject) {
            let len_before = grants.len();
            grants.retain(|g| g.permission != *permission || g.resource != *resource);
            grants.len() != len_before
        } else {
            false
        }
    }

    pub fn add_role(&mut self, role: Role) {
        self.roles.insert(role.id.clone(), role);
    }

    pub fn assign_role(&mut self, subject: Subject, role: RoleId) {
        self.subject_roles.entry(subject).or_default().insert(role);
    }

    pub fn revoke_role(&mut self, subject: &Subject, role: &RoleId) -> bool {
        self.subject_roles.get_mut(subject).map(|s| s.remove(role)).unwrap_or(false)
    }

    /// Evaluate an access request.
    pub fn evaluate(&self, ctx: EvalContext) -> Decision {
        // Check explicit grants for the subject.
        if let Some(grants) = self.grants.get(&ctx.subject) {
            for grant in grants {
                if grant.permission == ctx.action && grant.resource == ctx.resource {
                    if self.check_conditions(&grant.conditions, &ctx) {
                        return Decision::Allow;
                    }
                }
            }

            // Check roles assigned to subject.
            if let Some(roles) = self.subject_roles.get(&ctx.subject) {
                for role_id in roles {
                    if let Some(role) = self.roles.get(role_id) {
                        if role.permissions.contains(&ctx.action) {
                            if self.check_role_conditions(role, &ctx) {
                                return Decision::Allow;
}
}
                        }
                    }
                }
            }

            self.default_decision
        }

    fn check_conditions(&self, conditions: &[Condition], ctx: &EvalContext) -> bool {
        for cond in conditions {
            match cond {
                Condition::TimeRange(start, end) => {
                    if ctx.timestamp < *start || ctx.timestamp > *end {
                        return false;
                    }
                }
                Condition::NetworkPrefix(prefix) => {
                    if let Some(origin) = &ctx.network_origin {
                        if !origin.starts_with(prefix) {
                            return false;
                        }
                    } else {
                        return false;
                    }
                }
                Condition::DeviceTrust(min) => {
                    if ctx.device_trust.unwrap_or(0) < *min {
                        return false;
                    }
                }
                Condition::Attribute(key, value) => {
                    if ctx.attributes.get(key) != Some(value) {
                        return false;
                    }
                }
                Condition::Predicate(_id) => {
                    return false;
                }
            }
        }
        true
    }

    fn check_role_conditions(&self, _role: &Role, _ctx: &EvalContext) -> bool {
        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::identity;

    #[test]
    fn basic_grant_allows() {
        let mut engine = PolicyEngine::new();
        let subject = Subject::Identity(identity::IdentityId(1));
        let perm = PermissionId::new("files", "read");
        let resource = ResourceId("files:/home/user".into());

        engine.add_grant(Grant {
            subject: subject.clone(),
            permission: perm.clone(),
            resource: resource.clone(),
            conditions: Vec::new(),
            granted_by: identity::IdentityId(0),
            granted_at: 0,
            expires_at: None,
        });

        let ctx = EvalContext {
            subject: subject.clone(),
            resource: resource.clone(),
            action: perm.clone(),
            attributes: alloc::collections::BTreeMap::new(),
            timestamp: 0,
            network_origin: None,
            device_trust: None,
        };

        assert_eq!(engine.evaluate(ctx), Decision::Allow);
    }

    #[test]
    fn default_deny() {
        let engine = PolicyEngine::new();
        let ctx = EvalContext {
            subject: Subject::Anonymous,
            resource: ResourceId("files:/secret".into()),
            action: PermissionId::new("files", "read"),
            attributes: alloc::collections::BTreeMap::new(),
            timestamp: 0,
            network_origin: None,
            device_trust: None,
        };
        assert_eq!(engine.evaluate(ctx), Decision::Deny);
    }
}