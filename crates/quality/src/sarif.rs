//! SARIF 2.1.0 报告解析
//!
//! 支持解析 SARIF (Static Analysis Results Interchange Format) 标准报告。
//! SARIF schema 复用自 SonarQube `sonar-sarif/src/main/resources/sarif/sarif-schema-2.1.0.json`
//!
//! 参考: https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html

use serde::{Deserialize, Serialize};

use crate::issue::QualityIssue;
use crate::rule::{AnalyzerSource, RuleType, Severity};

/// SARIF 2.1.0 顶层结构（简化版）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SarifReport {
    #[serde(rename = "$schema", default)]
    pub schema: Option<String>,
    pub version: String,
    #[serde(default)]
    pub runs: Vec<SarifRun>,
}

/// SARIF Run — 单次分析运行
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SarifRun {
    pub tool: SarifTool,
    #[serde(default)]
    pub results: Vec<SarifResult>,
}

/// SARIF Tool 描述
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SarifTool {
    pub driver: SarifDriver,
}

/// SARIF Tool Driver
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SarifDriver {
    pub name: String,
    #[serde(default)]
    pub version: Option<String>,
    #[serde(rename = "informationUri", default)]
    pub information_uri: Option<String>,
    #[serde(default)]
    pub rules: Vec<SarifRule>,
}

/// SARIF Rule 定义
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SarifRule {
    pub id: String,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(rename = "shortDescription", default)]
    pub short_description: Option<SarifMessage>,
    #[serde(rename = "defaultConfiguration", default)]
    pub default_configuration: Option<SarifRuleConfig>,
}

/// SARIF Rule 默认配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SarifRuleConfig {
    #[serde(default)]
    pub level: Option<String>,
}

/// SARIF Message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SarifMessage {
    pub text: String,
}

/// SARIF Result — 单个发现
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SarifResult {
    #[serde(rename = "ruleId")]
    pub rule_id: String,
    #[serde(default)]
    pub level: Option<String>,
    pub message: SarifMessage,
    #[serde(default)]
    pub locations: Vec<SarifLocation>,
}

/// SARIF Location
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SarifLocation {
    #[serde(rename = "physicalLocation", default)]
    pub physical_location: Option<SarifPhysicalLocation>,
}

/// SARIF Physical Location
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SarifPhysicalLocation {
    #[serde(rename = "artifactLocation", default)]
    pub artifact_location: Option<SarifArtifactLocation>,
    #[serde(default)]
    pub region: Option<SarifRegion>,
}

/// SARIF Artifact Location
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SarifArtifactLocation {
    pub uri: String,
}

/// SARIF Region (行/列范围)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SarifRegion {
    #[serde(rename = "startLine", default)]
    pub start_line: Option<u32>,
    #[serde(rename = "startColumn", default)]
    pub start_column: Option<u32>,
    #[serde(rename = "endLine", default)]
    pub end_line: Option<u32>,
    #[serde(rename = "endColumn", default)]
    pub end_column: Option<u32>,
}

/// 将 SARIF 报告转换为 QualityIssue 列表
pub fn sarif_to_issues(report: &SarifReport, source: AnalyzerSource) -> Vec<QualityIssue> {
    let mut issues = Vec::new();

    for run in &report.runs {
        for result in &run.results {
            let severity = sarif_level_to_severity(result.level.as_deref().unwrap_or("warning"));
            let rule_type = severity_to_rule_type(severity);

            let mut issue = QualityIssue::new(
                &result.rule_id,
                rule_type,
                severity,
                source.clone(),
                &result.message.text,
            );

            // 提取位置信息
            if let Some(location) = result.locations.first() {
                if let Some(ref phys) = location.physical_location {
                    if let Some(ref artifact) = phys.artifact_location {
                        let file_path = artifact.uri.trim_start_matches("file:///").to_string();
                        if let Some(ref region) = phys.region {
                            if let (Some(sl), Some(sc), Some(el), Some(ec)) =
                                (region.start_line, region.start_column, region.end_line, region.end_column)
                            {
                                issue = issue.with_range(file_path, sl, sc, el, ec);
                            } else if let Some(line) = region.start_line {
                                issue = issue.with_location(file_path, line);
                            }
                        } else {
                            issue.file_path = Some(file_path);
                        }
                    }
                }
            }

            issues.push(issue);
        }
    }

    issues
}

/// SARIF level → Severity 映射
fn sarif_level_to_severity(level: &str) -> Severity {
    match level {
        "error" => Severity::Critical,
        "warning" => Severity::Major,
        "note" => Severity::Minor,
        "none" => Severity::Info,
        _ => Severity::Major,
    }
}

/// Severity → RuleType 的默认映射
fn severity_to_rule_type(severity: Severity) -> RuleType {
    match severity {
        Severity::Blocker | Severity::Critical => RuleType::Bug,
        Severity::Major => RuleType::CodeSmell,
        Severity::Minor | Severity::Info => RuleType::CodeSmell,
    }
}

/// 从 JSON 字符串解析 SARIF 报告
pub fn parse_sarif(json: &str) -> anyhow::Result<SarifReport> {
    serde_json::from_str(json).map_err(|e| anyhow::anyhow!("Failed to parse SARIF report: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_minimal_sarif() {
        let json = r#"{
            "version": "2.1.0",
            "runs": [{
                "tool": {
                    "driver": {
                        "name": "clippy",
                        "rules": []
                    }
                },
                "results": [{
                    "ruleId": "clippy::unwrap_used",
                    "level": "warning",
                    "message": { "text": "used unwrap() on Option value" },
                    "locations": [{
                        "physicalLocation": {
                            "artifactLocation": { "uri": "src/main.rs" },
                            "region": { "startLine": 42, "startColumn": 5 }
                        }
                    }]
                }]
            }]
        }"#;

        let report = parse_sarif(json).unwrap();
        assert_eq!(report.runs.len(), 1);
        assert_eq!(report.runs[0].results.len(), 1);

        let issues = sarif_to_issues(&report, AnalyzerSource::Clippy);
        assert_eq!(issues.len(), 1);
        assert_eq!(issues[0].rule_id, "clippy::unwrap_used");
        assert_eq!(issues[0].line, Some(42));
        assert_eq!(issues[0].severity, Severity::Major);
    }
}
