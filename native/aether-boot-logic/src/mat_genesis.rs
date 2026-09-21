//! MAT → Genesis Integration (P10-MG).
//!
//! Knowledge connector between Genesis and the MAT query service.
//! Preserves provenance, evidence class, uncertainty/status and
//! error/unavailable paths across the integration contract.

extern crate alloc;

use alloc::string::String;
use alloc::string::ToString;
use alloc::vec::Vec;

use crate::mat_query::{
    EvidenceClass, MatPropertyDatum, MatQueryError, MatQueryRequest, MatQueryResponse,
    MatQueryService, MatSearchResult,
};

/// Genesis-facing MAT knowledge connector.
pub struct MatGenesisConnector {
    query_service: MatQueryService,
}

impl MatGenesisConnector {
    pub fn new(query_service: MatQueryService) -> Self {
        Self { query_service }
    }

    /// Query MAT for a material by symbol (e.g. "H", "Fe", "Au").
    pub fn query_by_symbol(
        &self,
        symbol: &str,
        properties: &[&str],
    ) -> Result<MatGenesisResponse, MatGenesisError> {
        let request = MatQueryRequest {
            symbol: Some(symbol.to_string()),
            mat_id: None,
            properties: properties.iter().map(|s| s.to_string()).collect(),
        };
        let response = self.query_service.query(request)?;
        Ok(MatGenesisResponse::from(response))
    }

    /// Query MAT for a material by MAT ID (e.g. "MAT:0026").
    pub fn query_by_mat_id(
        &self,
        mat_id: &str,
        properties: &[&str],
    ) -> Result<MatGenesisResponse, MatGenesisError> {
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

    /// Query a specific property with evidence preservation.
    pub fn query_property(
        &self,
        symbol: &str,
        property_path: &str,
    ) -> Result<MatPropertyValue, MatGenesisError> {
        let datum = self
            .query_service
            .read_property(symbol, property_path)?;
        Ok(MatPropertyValue::from_datum(datum))
    }
}

/// Response converted for Genesis consumption.
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
    pub uncertainty: Option<f64>,
    pub evidence_class: EvidenceClass,
}

#[derive(Debug, Clone, PartialEq)]
pub enum MatPropertyValueInner {
    Scalar { value: f64, unit: Option<String> },
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
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MatGenesisError {
    NotFound(String),
    PropertyNotFound(String),
    QueryServiceError(String),
    InvalidRequest(String),
}

impl core::fmt::Display for MatGenesisError {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        match self {
            MatGenesisError::NotFound(s) => write!(f, "material not found: {}", s),
            MatGenesisError::PropertyNotFound(s) => write!(f, "property not found: {}", s),
            MatGenesisError::QueryServiceError(s) => write!(f, "query service error: {}", s),
            MatGenesisError::InvalidRequest(s) => write!(f, "invalid request: {}", s),
        }
    }
}

impl core::error::Error for MatGenesisError {}

impl From<MatQueryError> for MatGenesisError {
    fn from(e: MatQueryError) -> Self {
        match e {
            MatQueryError::NotFound(s) => MatGenesisError::NotFound(s),
            MatQueryError::PropertyNotFound(s) => MatGenesisError::PropertyNotFound(s),
            MatQueryError::InvalidRequest(s) => MatGenesisError::InvalidRequest(s),
        }
    }
}

impl From<MatQueryResponse> for MatGenesisResponse {
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

impl From<MatPropertyDatum> for MatPropertyResult {
    fn from(d: MatPropertyDatum) -> Self {
        Self {
            property: d.property,
            value: d.value,
            unit: d.unit,
            minimum: d.minimum,
            maximum: d.maximum,
            uncertainty: d.uncertainty,
            confidence: d.confidence,
            evidence_type: d.evidence_type,
            evidence_class: d.evidence_class,
            source_id: d.source_id,
            source_alias: d.source_alias,
            source_locator: d.source_locator,
            method: d.method,
        }
    }
}

impl From<MatSearchResult> for MatGenesisSearchResult {
    fn from(r: MatSearchResult) -> Self {
        Self {
            mat_id: r.mat_id,
            record_name: r.record_name,
            symbol: r.symbol,
            path: r.path,
        }
    }
}

impl MatPropertyValue {
    fn from_datum(d: MatPropertyDatum) -> Self {
        let inner = match d.value {
            Some(v) => MatPropertyValueInner::Scalar { value: v, unit: d.unit.clone() },
            None => MatPropertyValueInner::Unavailable,
        };
        Self {
            property: d.property.clone(),
            value: inner,
            uncertainty: d.uncertainty,
            evidence_class: d.evidence_class.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use alloc::vec;

    fn connector() -> MatGenesisConnector {
        MatGenesisConnector::new(MatQueryService::new())
    }

    #[test]
    fn genesis_can_issue_mat_request() {
        let c = connector();
        let r = c.query_by_symbol("H", &["ionization.first"]).unwrap();
        assert!(r.found);
        assert_eq!(r.symbol, "H");
    }

    #[test]
    fn real_mat_data_returns() {
        let c = connector();
        let v = c.query_property("H", "ionization.first").unwrap();
        match v.value {
            MatPropertyValueInner::Scalar { value, .. } => {
                assert!((value - 13.598).abs() < 1e-9);
            }
            MatPropertyValueInner::Unavailable => panic!("expected scalar"),
        }
    }

    #[test]
    fn result_crosses_contract_with_provenance() {
        let c = connector();
        let r = c.query_by_mat_id("MAT:0026", &[]).unwrap();
        assert_eq!(r.symbol, "Fe");
        assert_eq!(r.provenance.service, "mat-query-service");
        assert!(!r.provenance.record_path.is_empty());
        assert!(!r.results.is_empty());
    }

    #[test]
    fn evidence_class_survives() {
        let c = connector();
        let r = c.query_by_symbol("H", &["ionization.first"]).unwrap();
        assert_eq!(r.results[0].evidence_class, EvidenceClass::Calculated);
        assert_eq!(r.results[0].evidence_type, "ionization-energy");
    }

    #[test]
    fn uncertainty_status_survives() {
        let c = connector();
        let v = c.query_property("H", "ionization.first").unwrap();
        assert!(v.uncertainty.is_some());
        let r = c.query_by_symbol("Au", &[]).unwrap();
        assert!(r.results[0].uncertainty.is_some());
        assert!(r.results[0].confidence.is_some());
    }

    #[test]
    fn error_unavailable_handled() {
        let c = connector();
        let e = c.query_by_symbol("Xx", &[]).unwrap_err();
        assert_eq!(e, MatGenesisError::NotFound("symbol Xx".to_string()));
        let e2 = c.query_by_symbol("H", &["bogus.prop"]).unwrap_err();
        assert!(matches!(e2, MatGenesisError::PropertyNotFound(_)));
    }

    #[test]
    fn search_crosses_contract() {
        let c = connector();
        let hits = c.search("gold").unwrap();
        assert!(hits.iter().any(|h| h.symbol == "Au"));
        assert!(!hits[0].path.is_empty());
    }

    #[test]
    fn query_by_id_and_symbol_agree() {
        let c = connector();
        let a = c.query_by_symbol("Fe", &[]).unwrap();
        let b = c.query_by_mat_id("MAT:0026", &[]).unwrap();
        assert_eq!(a.mat_id, b.mat_id);
        assert_eq!(a.results.len(), b.results.len());
        let _ = vec![a, b];
    }
}
