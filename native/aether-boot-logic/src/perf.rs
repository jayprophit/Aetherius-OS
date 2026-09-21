//! Provider throughput floors (P15-PROVBENCH).
//!
//! Regression timing tests: policy evaluation, MAT query and storage
//! read throughput must stay above conservative floors. Bounds are
//! deliberately generous (debug builds, shared CI) — they catch
//! algorithmic regressions, not machine noise.

#[cfg(test)]
mod tests {
    use crate::identity::IdentityId;
    use crate::mat_query::{MatQueryRequest, MatQueryService};
    use crate::policy::{Decision, EvalContext, PermissionId, PolicyEngine, ResourceId, Subject};
    use crate::storage::StorageProvider;
    use alloc::vec::Vec;

    fn bench_ctx(i: u64) -> EvalContext {
        EvalContext {
            subject: Subject::Identity(IdentityId(i % 64)),
            resource: ResourceId(alloc::format!("storage:C:/bench/{}.txt", i % 64)),
            action: PermissionId::new("storage", "read"),
            attributes: alloc::collections::BTreeMap::new(),
            timestamp: 0,
            network_origin: None,
            device_trust: None,
        }
    }

    #[test]
    fn policy_eval_throughput_floor() {
        let mut engine = PolicyEngine::new();
        engine.set_default_decision(Decision::Allow);
        let n: u64 = 20_000;
        let start = std::time::Instant::now();
        let mut allowed = 0u64;
        for i in 0..n {
            if engine.evaluate(bench_ctx(i)) == Decision::Allow {
                allowed += 1;
            }
        }
        let dt = start.elapsed();
        assert_eq!(allowed, n);
        // Floor: 2k evals/sec (typical: >500k/sec release, >50k/sec debug).
        assert!(
            dt.as_secs() < 10,
            "policy eval regression: {:?} for {} evals",
            dt,
            n
        );
    }

    #[test]
    fn mat_query_throughput_floor() {
        let svc = MatQueryService::new();
        let n = 2_000;
        let start = std::time::Instant::now();
        for _ in 0..n {
            let resp = svc
                .query(MatQueryRequest {
                    symbol: Some("H".to_string()),
                    mat_id: None,
                    properties: Vec::new(),
                })
                .unwrap();
            assert!(resp.found);
        }
        let dt = start.elapsed();
        assert!(
            dt.as_secs() < 10,
            "mat query regression: {:?} for {} queries",
            dt,
            n
        );
    }

    #[test]
    fn storage_read_throughput_floor() {
        let mut engine = PolicyEngine::new();
        engine.set_default_decision(Decision::Allow);
        let mut store = StorageProvider::new(Some(engine));
        let u = Subject::Identity(IdentityId(1));
        store.write_as(&u, "C:/bench.txt", b"0123456789abcdef".to_vec()).unwrap();
        let n = 2_000;
        let start = std::time::Instant::now();
        for _ in 0..n {
            let data = store.read_as(&u, "C:/bench.txt").unwrap();
            assert_eq!(data.len(), 16);
        }
        let dt = start.elapsed();
        assert!(
            dt.as_secs() < 10,
            "storage read regression: {:?} for {} reads",
            dt,
            n
        );
    }
}
