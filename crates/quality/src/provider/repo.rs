//! Repo/Infra 分析器 Provider
//!
//! 覆盖 generate-types:check、prepare-db:check 等仓库级检查

use async_trait::async_trait;
use std::path::Path;
use std::time::Instant;
use tracing::{debug, warn};

use crate::gate::result::MeasureValue;
use crate::metrics::MetricKey;
use crate::provider::{ProviderReport, QualityProvider};

/// 仓库级分析器 Provider
pub struct RepoProvider {
    pub enable_types_check: bool,
    pub enable_db_check: bool,
}

impl Default for RepoProvider {
    fn default() -> Self {
        Self {
            enable_types_check: true,
            enable_db_check: true,
        }
    }
}

#[async_trait]
impl QualityProvider for RepoProvider {
    fn name(&self) -> &str {
        "repo"
    }

    fn supported_metrics(&self) -> Vec<MetricKey> {
        vec![
            MetricKey::GenerateTypesCheckFailures,
            MetricKey::PrepareDbCheckFailures,
        ]
    }

    async fn analyze(
        &self,
        project_root: &Path,
        _changed_files: Option<&[String]>,
    ) -> anyhow::Result<ProviderReport> {
        let start = Instant::now();
        let mut report = ProviderReport::success("repo", 0);

        // generate-types:check
        if self.enable_types_check {
            debug!("Running generate-types:check...");
            let output = tokio::process::Command::new("pnpm")
                .args(["generate-types:check"])
                .current_dir(project_root)
                .output()
                .await;

            match output {
                Ok(out) => {
                    let failures = if out.status.success() { 0 } else { 1 };
                    report.metrics.insert(MetricKey::GenerateTypesCheckFailures, MeasureValue::Int(failures));
                }
                Err(e) => {
                    warn!("generate-types:check failed: {}", e);
                    report.metrics.insert(MetricKey::GenerateTypesCheckFailures, MeasureValue::Int(-1));
                }
            }
        }

        // prepare-db:check
        if self.enable_db_check {
            debug!("Running prepare-db:check...");
            let output = tokio::process::Command::new("pnpm")
                .args(["prepare-db:check"])
                .current_dir(project_root)
                .output()
                .await;

            match output {
                Ok(out) => {
                    let failures = if out.status.success() { 0 } else { 1 };
                    report.metrics.insert(MetricKey::PrepareDbCheckFailures, MeasureValue::Int(failures));
                }
                Err(e) => {
                    warn!("prepare-db:check failed: {}", e);
                    report.metrics.insert(MetricKey::PrepareDbCheckFailures, MeasureValue::Int(-1));
                }
            }
        }

        report.duration_ms = start.elapsed().as_millis() as u64;
        Ok(report)
    }
}
