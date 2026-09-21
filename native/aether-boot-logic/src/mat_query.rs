//! MAT query service (P10-P6 / P10-MG backing store).
//!
//! Minimal in-memory structured materials knowledge used by the native
//! MAT → Genesis connector. Preserves provenance, evidence class,
//! uncertainty and unavailable/error paths. no_std compatible.

extern crate alloc;

use alloc::string::String;
use alloc::string::ToString;
use alloc::vec::Vec;
use alloc::collections::BTreeMap;

/// Evidence classification preserved across the integration contract.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EvidenceClass {
    Measured,
    Calculated,
    Predicted,
    Unavailable,
}

impl EvidenceClass {
    pub fn as_str(&self) -> &'static str {
        match self {
            EvidenceClass::Measured => "measured",
            EvidenceClass::Calculated => "calculated",
            EvidenceClass::Predicted => "predicted",
            EvidenceClass::Unavailable => "unavailable",
        }
    }
}

/// Raw evidence type string (e.g. "ionization-energy", "density").
pub type EvidenceType = String;

/// Single property datum with provenance + uncertainty.
#[derive(Debug, Clone)]
pub struct MatPropertyDatum {
    pub property: String,
    pub value: Option<f64>,
    pub unit: Option<String>,
    pub minimum: Option<f64>,
    pub maximum: Option<f64>,
    pub uncertainty: Option<f64>,
    pub confidence: Option<f64>,
    pub evidence_type: EvidenceType,
    pub evidence_class: EvidenceClass,
    pub source_id: Option<String>,
    pub source_alias: Option<String>,
    pub source_locator: Option<String>,
    pub method: Option<String>,
}

/// One material record.
#[derive(Debug, Clone)]
pub struct MatRecord {
    pub mat_id: String,
    pub record_name: String,
    pub symbol: String,
    pub path: String,
    pub properties: Vec<MatPropertyDatum>,
}

/// Query request: by symbol or by MAT id, with property filter.
#[derive(Debug, Clone)]
pub struct MatQueryRequest {
    pub symbol: Option<String>,
    pub mat_id: Option<String>,
    pub properties: Vec<String>,
}

/// Provenance block that must survive the Genesis contract.
#[derive(Debug, Clone)]
pub struct MatProvenanceInfo {
    pub service: String,
    pub record_path: String,
    pub generated_at: u64,
    pub service_version: String,
}

/// Query response crossing the integration contract.
#[derive(Debug, Clone)]
pub struct MatQueryResponse {
    pub found: bool,
    pub mat_id: String,
    pub record_name: String,
    pub symbol: String,
    pub results: Vec<MatPropertyDatum>,
    pub provenance: MatProvenanceInfo,
}

/// Search hit.
#[derive(Debug, Clone)]
pub struct MatSearchResult {
    pub mat_id: String,
    pub record_name: String,
    pub symbol: String,
    pub path: String,
}

/// Query service errors.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MatQueryError {
    NotFound(String),
    PropertyNotFound(String),
    InvalidRequest(String),
}

impl core::fmt::Display for MatQueryError {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        match self {
            MatQueryError::NotFound(s) => write!(f, "not found: {}", s),
            MatQueryError::PropertyNotFound(s) => write!(f, "property not found: {}", s),
            MatQueryError::InvalidRequest(s) => write!(f, "invalid request: {}", s),
        }
    }
}

impl core::error::Error for MatQueryError {}

/// In-memory MAT query service with a few canonical records.
pub struct MatQueryService {
    by_symbol: BTreeMap<String, MatRecord>,
    by_id: BTreeMap<String, String>, // mat_id -> symbol
}

fn datum(
    property: &str,
    value: Option<f64>,
    unit: &str,
    uncertainty: Option<f64>,
    evidence_type: &str,
    evidence_class: EvidenceClass,
    source_id: &str,
) -> MatPropertyDatum {
    MatPropertyDatum {
        property: property.to_string(),
        value,
        unit: if unit.is_empty() { None } else { Some(unit.to_string()) },
        minimum: value,
        maximum: value,
        uncertainty,
        confidence: if value.is_some() { Some(0.99) } else { None },
        evidence_type: evidence_type.to_string(),
        evidence_class,
        source_id: Some(source_id.to_string()),
        source_alias: Some("MAT-core".to_string()),
        source_locator: Some("records/elements".to_string()),
        method: Some("tabulated".to_string()),
    }
}

impl MatQueryService {
    pub fn new() -> Self {
        let mut by_symbol: BTreeMap<String, MatRecord> = BTreeMap::new();
        let mut by_id: BTreeMap<String, String> = BTreeMap::new();

        let h = MatRecord {
            mat_id: "MAT:0001".to_string(),
            record_name: "Hydrogen".to_string(),
            symbol: "H".to_string(),
            path: "records/elements/H".to_string(),
            properties: alloc::vec![
                datum(
                    "ionization.first",
                    Some(13.598),
                    "eV",
                    Some(0.001),
                    "ionization-energy",
                    EvidenceClass::Calculated,
                    "NIST-ATOMIC",
                ),
                datum(
                    "density.stp",
                    Some(0.00008988),
                    "g/cm3",
                    Some(0.00000001),
                    "density",
                    EvidenceClass::Measured,
                    "CRC-HANDBOOK",
                ),
            ],
        };
        by_id.insert(h.mat_id.clone(), h.symbol.clone());
        by_symbol.insert(h.symbol.clone(), h);

        let fe = MatRecord {
            mat_id: "MAT:0026".to_string(),
            record_name: "Iron".to_string(),
            symbol: "Fe".to_string(),
            path: "records/elements/Fe".to_string(),
            properties: alloc::vec![
                datum(
                    "density.room",
                    Some(7.874),
                    "g/cm3",
                    Some(0.001),
                    "density",
                    EvidenceClass::Measured,
                    "CRC-HANDBOOK",
                ),
                datum(
                    "melting.point",
                    Some(1811.0),
                    "K",
                    Some(0.5),
                    "melting-point",
                    EvidenceClass::Measured,
                    "NIST-MAT",
                ),
            ],
        };
        by_id.insert(fe.mat_id.clone(), fe.symbol.clone());
        by_symbol.insert(fe.symbol.clone(), fe);

        let au = MatRecord {
            mat_id: "MAT:0079".to_string(),
            record_name: "Gold".to_string(),
            symbol: "Au".to_string(),
            path: "records/elements/Au".to_string(),
            properties: alloc::vec![
                datum(
                    "density.room",
                    Some(19.30),
                    "g/cm3",
                    Some(0.01),
                    "density",
                    EvidenceClass::Measured,
                    "CRC-HANDBOOK",
                ),
            ],
        };
        by_id.insert(au.mat_id.clone(), au.symbol.clone());
        by_symbol.insert(au.symbol.clone(), au);

        Self { by_symbol, by_id }
    }

    fn record_for(&self, req: &MatQueryRequest) -> Result<&MatRecord, MatQueryError> {
        if let Some(sym) = &req.symbol {
            self.by_symbol
                .get(sym)
                .ok_or_else(|| MatQueryError::NotFound(alloc::format!("symbol {}", sym)))
        } else if let Some(id) = &req.mat_id {
            let sym = self
                .by_id
                .get(id)
                .ok_or_else(|| MatQueryError::NotFound(alloc::format!("mat id {}", id)))?;
            self.by_symbol
                .get(sym)
                .ok_or_else(|| MatQueryError::NotFound(alloc::format!("mat id {}", id)))
        } else {
            Err(MatQueryError::InvalidRequest("symbol or mat_id required".to_string()))
        }
    }

    fn provenance_for(&self, rec: &MatRecord) -> MatProvenanceInfo {
        MatProvenanceInfo {
            service: "mat-query-service".to_string(),
            record_path: rec.path.clone(),
            generated_at: 0,
            service_version: "1.0.0".to_string(),
        }
    }

    /// Query material properties. Empty `properties` vec returns all.
    pub fn query(&self, req: MatQueryRequest) -> Result<MatQueryResponse, MatQueryError> {
        let rec = self.record_for(&req)?;
        let results: Vec<MatPropertyDatum> = if req.properties.is_empty() {
            rec.properties.clone()
        } else {
            let mut out = Vec::new();
            for want in &req.properties {
                match rec.properties.iter().find(|d| &d.property == want) {
                    Some(d) => out.push(d.clone()),
                    None => return Err(MatQueryError::PropertyNotFound(want.clone())),
                }
            }
            out
        };
        Ok(MatQueryResponse {
            found: true,
            mat_id: rec.mat_id.clone(),
            record_name: rec.record_name.clone(),
            symbol: rec.symbol.clone(),
            results,
            provenance: self.provenance_for(rec),
        })
    }

    /// Read a single property value from a record (used by Genesis connector).
    pub fn read_property(
        &self,
        symbol: &str,
        property_path: &str,
    ) -> Result<MatPropertyDatum, MatQueryError> {
        let req = MatQueryRequest {
            symbol: Some(symbol.to_string()),
            mat_id: None,
            properties: alloc::vec![property_path.to_string()],
        };
        let mut resp = self.query(req)?;
        resp.results.pop().ok_or_else(|| {
            MatQueryError::PropertyNotFound(property_path.to_string())
        })
    }

    /// Case-insensitive substring search over symbol / name / id.
    pub fn search(&self, query: &str) -> Result<Vec<MatSearchResult>, MatQueryError> {
        let q = query.to_lowercase();
        let mut out = Vec::new();
        for rec in self.by_symbol.values() {
            if rec.symbol.to_lowercase().contains(&q)
                || rec.record_name.to_lowercase().contains(&q)
                || rec.mat_id.to_lowercase().contains(&q)
            {
                out.push(MatSearchResult {
                    mat_id: rec.mat_id.clone(),
                    record_name: rec.record_name.clone(),
                    symbol: rec.symbol.clone(),
                    path: rec.path.clone(),
                });
            }
        }
        Ok(out)
    }
}

impl Default for MatQueryService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use alloc::vec;

    #[test]
    fn query_h_by_symbol_returns_ionization() {
        let svc = MatQueryService::new();
        let resp = svc
            .query(MatQueryRequest {
                symbol: Some("H".to_string()),
                mat_id: None,
                properties: vec!["ionization.first".to_string()],
            })
            .unwrap();
        assert!(resp.found);
        assert_eq!(resp.mat_id, "MAT:0001");
        assert_eq!(resp.results.len(), 1);
        let v = resp.results[0].value.unwrap();
        assert!((v - 13.598).abs() < 1e-9);
        assert_eq!(resp.results[0].evidence_class, EvidenceClass::Calculated);
        assert!(resp.results[0].uncertainty.is_some());
        assert!(!resp.provenance.record_path.is_empty());
    }

    #[test]
    fn query_by_mat_id_fe() {
        let svc = MatQueryService::new();
        let resp = svc
            .query(MatQueryRequest {
                symbol: None,
                mat_id: Some("MAT:0026".to_string()),
                properties: vec![],
            })
            .unwrap();
        assert_eq!(resp.symbol, "Fe");
        assert!(resp.results.len() >= 2);
    }

    #[test]
    fn missing_material_errors() {
        let svc = MatQueryService::new();
        let err = svc
            .query(MatQueryRequest {
                symbol: Some("Xx".to_string()),
                mat_id: None,
                properties: vec![],
            })
            .unwrap_err();
        assert_eq!(err, MatQueryError::NotFound("symbol Xx".to_string()));
    }

    #[test]
    fn missing_property_errors() {
        let svc = MatQueryService::new();
        let err = svc
            .query(MatQueryRequest {
                symbol: Some("H".to_string()),
                mat_id: None,
                properties: vec!["nope.prop".to_string()],
            })
            .unwrap_err();
        assert_eq!(err, MatQueryError::PropertyNotFound("nope.prop".to_string()));
    }

    #[test]
    fn search_finds_iron() {
        let svc = MatQueryService::new();
        let hits = svc.search("iron").unwrap();
        assert!(hits.iter().any(|h| h.symbol == "Fe"));
    }

    #[test]
    fn provenance_and_evidence_preserved() {
        let svc = MatQueryService::new();
        let resp = svc
            .query(MatQueryRequest {
                symbol: Some("Au".to_string()),
                mat_id: None,
                properties: vec![],
            })
            .unwrap();
        assert_eq!(resp.provenance.service, "mat-query-service");
        assert_eq!(resp.provenance.service_version, "1.0.0");
        assert_eq!(resp.results[0].evidence_class, EvidenceClass::Measured);
    }
}
