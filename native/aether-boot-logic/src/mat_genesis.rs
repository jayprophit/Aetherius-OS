//! MAT → Genesis Integration (P10-MG).
//!
//! Provides the knowledge connector between Genesis and the MAT query service.
//! This is the P10-MG task: connecting the Materials Atlas Table Codex
//! query service to Genesis's knowledge/concept system.

use alloc::string::String;
use alloc::vec::Vec;
use alloc::collections::BTreeMap;
use alloc::format;
use core::fmt;

use crate::mat_query::{
    MatQueryService, MatQueryRequest, MatQueryResponse,
    EvidenceClass, EvidenceType,
};

/// Genesis-facing MAT knowledge connector.
///
/// This module provides the integration layer between Genesis's
/// knowledge/cognition system and the MAT query service.
pub struct MatGenesisConnector {
    query_service: MatQueryService,
}

impl MatGenesisConnector {
    /// Create a new MAT-Genesis connector.
    pub fn new(query_service: MatQueryService) -> Self {
        Self { query_service }
    }

    /// Query MAT for a material by symbol (e.g., "H", "Fe", "Au").
    pub fn query_by_symbol(&self, symbol: &str, properties: &[&str]) -> Result<MatGenesisResponse, MatGenesisError> {
        let request = MatQueryRequest {
            symbol: Some(symbol.to_string()),
            mat_id: None,
            properties: properties.iter().map(|s| s.to_string()).collect(),
        };
        let response = self.query_service.query(request)?;
        Ok(MatGenesisResponse::from(response))
    }

    /// Query MAT for a material by MAT ID (e.g., "MAT:0026").
    pub fn query_by_mat_id(&self, mat_id: &str, properties: &[&str]) -> Result<MatGenesisResponse, MatGenesisError> {
        let request = MatQueryRequest {
            symbol: None,
            mat_id: Some(mat_id.to_string()),
            properties: properties.iter().map(|s| s.to_string()).collect(),
        };
        let response = self.query_service.query(request)?;
        Ok(MatGenesisResponse::from(response))
    }

    /// Search MAT for materials matching a text query.
    pub fn search(&self, query: &str) -> Result<Vec<MatGenesisSearchResult>, MatGenesisError> {
        let results = self.query_service.search(query)?;
        Ok(results.into_iter().map(MatGenesisSearchResult::from).collect())
    }

    /// Query a specific property of a material with evidence preservation.
    pub fn query_property(
        &self,
        symbol: &str,
        property_path: &str,
    ) -> Result<MatPropertyValue, MatGenesisError> {
        let request = MatQueryRequest {
            symbol: Some(symbol.to_string()),
            mat_id: None,
            properties: vec![property_path.to_string()],
        };
        let response = self.query_service.query(request)?;
        let prop = response.results.into_iter().next().ok_or(MatGenesisError::PropertyNotFound)?;
        let prop_value = prop.read_property(property_path)?;
        Ok(MatPropertyValue {
            property: property_path.to_string(),
            value: prop_value,
        })
    }
}

/// Response from MAT query, converted for Genesis consumption.
#[derive(Debug, Clone)]
pub struct MatGenesisResponse {
    pub found: bool,
    pub mat_id: String,
    pub record_name: String,
    pub symbol: String,
    pub results: Vec<MatPropertyResult>,
    pub provenance: MatProvenance,
}

/// Individual property result with evidence preservation.
#[derive(Debug, Clone)]
pub struct MatPropertyResult {
    pub property: String,
    pub value: Option<f64>,
    pub unit: Option<String>,
    pub minimum: Option<f64>,
    pub maximum: Option<f64>,
    pub uncertainty: Option<f64>,
    pub confidence: Option<f64>,
    pub evidence_type: String,
    pub evidence_class: EvidenceClass,
    pub source_id: Option<String>,
    pub source_alias: Option<String>,
    pub source_locator: Option<String>,
    pub method: Option<String>,
}

/// Genesis-facing property value with evidence.
#[derive(Debug, Clone)]
pub struct MatPropertyValue {
    pub property: String,
    pub value: MatPropertyValueInner,
}

#[derive(Debug, Clone)]
pub enum MatPropertyValueInner {
    Scalar { value: f64, unit: Option<String>, uncertainty: Option<f64> },
    Range { min: f64, max: f64, unit: Option<String> },
    Enum { value: String, options: Vec<String> },
    Unavailable,
}

/// Search result for Genesis consumption.
#[derive(Debug, Clone)]
pub struct MatGenesisSearchResult {
    pub mat_id: String,
    pub record_name: String,
    pub symbol: String,
    pub path: String,
}

/// Provenance information for Genesis.
#[derive(Debug, Clone)]
pub struct MatProvenance {
    pub service: String,
    pub record_path: String,
    pub generated_at: u64,
    pub service_version: String,
}

/// Error types for MAT-Genesis integration.
#[derive(Debug, thiserror::Error)]
pub enum MatGenesisError {
    #[error("Material not found: {0}")]
    NotFound(String),
    #[error("Property not found: {0}")]
    PropertyNotFound(String),
    #[error("Query service error: {0}")]
    QueryServiceError(String),
    #[error("Property not found in record: {0}")]
    PropertyNotFound(String),
    #[error("Serialization error: {0}")]
    SerializationError(String),
}

impl MatGenesisResponse {
    fn from(response: MatQueryResponse) -> Self {
        Self {
            found: response.found,
            mat_id: response.mat_id,
            record_name: response.record_name,
            symbol: response.symbol,
            results: response.results.into_iter().map(MatPropertyResult::from).collect(),
            provenance: MatProvenance {
                service: response.provenance.service,
                record_path: response.provenance.record_path,
                generated_at: response.provenance.generated_at,
                service_version: response.provenance.service_version,
            },
        }
    }
}

impl MatPropertyResult {
    fn from(result: MatPropertyResult) -> Self {
        Self {
            property: result.property,
            value: result.value,
            unit: result.unit,
            minimum: result.minimum,
            maximum: result.maximum,
            uncertainty: result.uncertainty,
            confidence: result.confidence,
            evidence_type: result.evidence_type,
            evidence_class: result.evidence_class,
            source_id: result.source_id,
            source_alias: result.source_alias,
            source_locator: result.source_locator,
            method: result.method,
        }
    }
}

impl MatGenesisSearchResult {
    fn from(result: MatSearchResult) -> Self {
        Self {
            mat_id: result.mat_id,
            record_name: result.record_name,
            symbol: result.symbol,
            path: result.path,
        }
    }
}

impl MatPropertyValue {
    fn from(result: MatPropertyResult) -> Self {
        Self {
            property: result.property,
            value: MatPropertyValueInner::from_result(result),
        }
    }
}

impl MatPropertyValueInner {
    fn from_result(result: MatPropertyResult) -> Self {
        if let Some(value) = result.value {
            if let (Some(min), Some(max)) = (result.minimum, result.maximum) {
                if min == max {
                    MatPropertyValueInner::Scalar {
                        value,
                        unit: result.unit,
                        uncertainty: result.uncertainty,
                    }
                } else {
                    MatPropertyValueInner::Range {
                        min: result.minimum.unwrap_or(value),
                        max: result.maximum.unwrap_or(value),
                        unit: result.unit,
                    }
                }
            } else {
                MatPropertyValueInner::Scalar {
                    value,
                    unit: result.unit,
                    uncertainty: result.uncertainty,
                }
            }
        } else {
            MatPropertyValueInner::Unavailable
        }
    }
}