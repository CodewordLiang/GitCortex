# SonarCloud 历史报告归档索引 / SonarCloud Historical Report Archive Index

> 本目录保存 Phase 26 期间（2026-02-25 ~ 2026-03-01）生成的 SonarCloud 分析快照。
> 自 Phase 29 起，质量报告由 `quality_run` / `quality_issue` 数据库表管理，不再以 Markdown 文件形式沉淀。

## 归档文件清单

| 文件 | 类型 | 生成时间 | 行数 | 说明 |
|------|------|----------|------|------|
| `sonarcloud-issues-2026-02-25T19-17-59代码质量审计报告.md` | Issues 详细 | 2026-02-26 03:17 | 15388 | 初始全量审计，含全部历史债务 |
| `sonarcloud-issues-2026-02-26T14-55-39.md` | Issues 详细 | 2026-02-26 22:55 | 5637 | 第一轮修复后复查 |
| `sonarcloud-issues-2026-02-26T18-08-14.md` | Issues 详细 | 2026-02-27 02:08 | 4333 | 第二轮修复后复查 |
| `sonarcloud-issues-2026-02-27T09-50-32.md` | Issues 详细 | 2026-02-27 17:50 | 7211 | 第三轮修复（含新增规则） |
| `sonarcloud-issues-2026-03-01T05-19-54.md` | Issues 详细 | 2026-03-01 13:19 | 254 | 最终清零确认 |
| `sonarcloud-full-report-2026-02-28T15-36-45.md` | 完整报告 | 2026-02-28 23:36 | 300 | 阶段性完整报告 |
| `sonarcloud-full-report-2026-03-01T03-46-12.md` | 完整报告 | 2026-03-01 11:46 | 579 | 接近清零的完整报告 |
| `sonarcloud-full-report-2026-03-01T04-49-19.md` | 完整报告 | 2026-03-01 12:49 | 554 | 最终 100/100 完整报告 |

## 命名规范

历史文件采用以下格式（已固定，不再重命名）：

```
sonarcloud-{type}-{ISO8601-timestamp}.md
```

- `type`: `issues`（问题详细列表）或 `full-report`（含指标摘要的完整报告）
- 时间戳: UTC，格式 `YYYY-MM-DDTHH-MM-SS`

## 迁移说明

### 为什么不再生成 Markdown 报告

Phase 29 引入了结构化质量数据模型（`quality_run` + `quality_issue` 表），质量报告通过以下方式管理：

1. **数据库存储**: 每次质量运行的元数据、通过/失败状态、问题详情存入 SQLite
2. **API 查询**: `GET /api/terminals/:id/quality/latest` 等 REST 端点提供实时查询
3. **WebSocket 推送**: `quality.gate_result` 事件实时推送到前端
4. **UI 展示**: QualityReportPanel / QualityBadge 组件直接渲染结构化数据

### 历史文件处置

- 本目录文件作为 Phase 26 审计的历史记录**只读保留**
- 不再向本目录新增文件
- 如需清理仓库体积，可安全删除本目录（所有修复已合入主分支）

## 其他非 SonarCloud 文件

本目录还包含以下历史分析文档（与质量门无关，保留供参考）：

| 文件 | 说明 |
|------|------|
| `2026-02-10-terminal-handoff-multi-angle-analysis.md` | Terminal handoff 多角度分析 |
| `2026-02-11-claude-glm47-double-call-probe-report.md` | Claude/GLM-4.7 双调用探测报告 |
| `2026-02-11-round5-real-code-bug-analysis.md` | 第五轮真实代码 bug 分析 |
| `2026-02-11-terminal-history-disconnect-root-cause.md` | Terminal 历史断连根因分析 |
| `2026-02-11-terminal-status-regression-multi-agent-round10.md` | 多 Agent 第十轮状态回归 |
| `2026-02-12-vite-ws-proxy-and-terminal-log-fk-analysis.md` | Vite WS 代理与日志外键分析 |
| `2026-02-24-full-code-audit-master.md` | 全量代码审计主报告 |

## 相关文档

- 归档策略详情: [`docs/developed/ops/sonarcloud-report-archival.md`](../ops/sonarcloud-report-archival.md)
- 质量门用户指南: [`docs/developed/ops/quality-gate-user-guide.md`](../ops/quality-gate-user-guide.md)
- 质量门设计文档: [`docs/developed/ops/quality-gate-reference.md`](../ops/quality-gate-reference.md)
