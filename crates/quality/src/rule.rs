//! 规则类型与严重级别 — 移植自 SonarQube `RuleType.java` + `ImpactSeverityMapper.java`

use serde::{Deserialize, Serialize};

/// 规则类型
///
/// 移植自 SonarQube `RuleType`
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum RuleType {
    /// 代码 Bug — 影响可靠性
    Bug,
    /// 漏洞 — 影响安全性
    Vulnerability,
    /// 代码异味 — 影响可维护性
    CodeSmell,
    /// 安全热点 — 需要人工审查的安全相关代码
    SecurityHotspot,
}

impl RuleType {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Bug => "BUG",
            Self::Vulnerability => "VULNERABILITY",
            Self::CodeSmell => "CODE_SMELL",
            Self::SecurityHotspot => "SECURITY_HOTSPOT",
        }
    }
}

impl std::fmt::Display for RuleType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Bug => write!(f, "Bug"),
            Self::Vulnerability => write!(f, "Vulnerability"),
            Self::CodeSmell => write!(f, "Code Smell"),
            Self::SecurityHotspot => write!(f, "Security Hotspot"),
        }
    }
}

/// 严重级别
///
/// 移植自 SonarQube severity 体系，参考 `ImpactSeverityMapper`
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, PartialOrd, Ord)]
pub enum Severity {
    /// 信息 — 不影响质量门
    Info,
    /// 次要 — 低影响
    Minor,
    /// 主要 — 中等影响
    Major,
    /// 严重 — 高影响，默认阻断
    Critical,
    /// 阻断 — 最高影响，必须修复
    Blocker,
}

impl Severity {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Info => "INFO",
            Self::Minor => "MINOR",
            Self::Major => "MAJOR",
            Self::Critical => "CRITICAL",
            Self::Blocker => "BLOCKER",
        }
    }

    /// 从 SonarQube 字符串解析
    pub fn from_sonar_str(s: &str) -> Option<Self> {
        match s.to_uppercase().as_str() {
            "INFO" => Some(Self::Info),
            "MINOR" => Some(Self::Minor),
            "MAJOR" => Some(Self::Major),
            "CRITICAL" => Some(Self::Critical),
            "BLOCKER" => Some(Self::Blocker),
            _ => None,
        }
    }

    /// 是否为阻断级别（Critical 或 Blocker）
    pub fn is_blocking(&self) -> bool {
        matches!(self, Self::Critical | Self::Blocker)
    }
}

impl std::fmt::Display for Severity {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

/// 分析器来源标识
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AnalyzerSource {
    /// cargo clippy
    Clippy,
    /// cargo check
    CargoCheck,
    /// cargo fmt
    CargoFmt,
    /// cargo test
    CargoTest,
    /// pnpm lint (ESLint)
    EsLint,
    /// pnpm check (TypeScript)
    TypeScript,
    /// pnpm test:run (Vitest)
    Vitest,
    /// SonarQube 本地分析
    Sonar,
    /// 安全审计脚本
    SecurityAudit,
    /// 其他
    Other(String),
}

impl std::fmt::Display for AnalyzerSource {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Clippy => write!(f, "clippy"),
            Self::CargoCheck => write!(f, "cargo-check"),
            Self::CargoFmt => write!(f, "cargo-fmt"),
            Self::CargoTest => write!(f, "cargo-test"),
            Self::EsLint => write!(f, "eslint"),
            Self::TypeScript => write!(f, "typescript"),
            Self::Vitest => write!(f, "vitest"),
            Self::Sonar => write!(f, "sonarqube"),
            Self::SecurityAudit => write!(f, "security-audit"),
            Self::Other(name) => write!(f, "{}", name),
        }
    }
}
