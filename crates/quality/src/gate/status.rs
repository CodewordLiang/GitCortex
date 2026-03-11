//! 质量门状态 — 移植自 SonarQube `QualityGateStatus.java` + `Measure.Level`
//!
//! SonarQube 原版只有 `OK` 和 `ERROR` 两种状态。
//! 我们扩展了 `Warn` 用于 shadow/warn 模式下的非阻断警告。

use serde::{Deserialize, Serialize};

/// 质量门聚合状态
///
/// 移植并扩展自 SonarQube `QualityGateStatus`
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum QualityGateStatus {
    /// 通过 — 所有条件满足
    Ok,
    /// 警告 — 有条件未满足但模式为 warn（不阻断）
    Warn,
    /// 错误 — 有条件未满足且模式为 enforce（阻断）
    Error,
}

impl std::fmt::Display for QualityGateStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Ok => write!(f, "OK"),
            Self::Warn => write!(f, "WARN"),
            Self::Error => write!(f, "ERROR"),
        }
    }
}

/// 条件求值等级
///
/// 移植自 SonarQube `Measure.Level`
/// 用于单个条件的求值结果
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Level {
    /// 通过
    Ok,
    /// 警告（非阻断）
    Warn,
    /// 失败（阻断）
    Error,
}

impl std::fmt::Display for Level {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Ok => write!(f, "OK"),
            Self::Warn => write!(f, "WARN"),
            Self::Error => write!(f, "ERROR"),
        }
    }
}
