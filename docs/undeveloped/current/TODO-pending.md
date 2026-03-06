# GitCortex 当前任务清单（按状态划分）

> 更新时间：2026-03-07
> 说明：本文档作为当前阶段执行看板，所有条目按“已完成 / 未完成”维护。

## 已完成

### 1. Orchestrator 后端
- [x] ORCH-001 新增工作流级主 Agent 对话入口（`POST /api/workflows/:id/orchestrator/chat`）。
- [x] ORCH-002 新增对话历史查询与分页（`GET /api/workflows/:id/orchestrator/messages`，支持 `cursor/limit`）。
- [x] ORCH-003 新增对话命令状态（queued/running/succeeded/failed/cancelled，基础版为提交回执状态）。
- [x] ORCH-004 主 Agent 对话输入接入 `OrchestratorAgent` 事件循环（非 Git 事件触发）。
- [x] ORCH-005 指令白名单校验（create_task/create_terminal/start_terminal/...）。
- [x] ORCH-006 幂等去重（`source/external_message_id`）。
- [x] ORCH-007 失败回执标准化（错误码 + 重试建议 + 可读摘要，基础版字段 `command_id/status/error/retryable`）。

### 2. 数据与持久化
- [x] DATA-001 新增 `workflow_orchestrator_message` 表（入站/出站消息）。
- [x] DATA-002 新增 `workflow_orchestrator_command` 表（执行状态/耗时/错误）。
- [x] DATA-003 新增 `external_conversation_binding` 表（外部会话映射）。
- [x] DATA-004 落地持久化恢复策略：服务重启后可恢复未完成编排命令。
- [x] DATA-005 落地日志脱敏策略（API key、token、敏感 prompt 片段）。

### 3. 前端 Web（Workflow 级）
- [x] FE-001 工作流详情页新增“主 Agent”对话面板。
- [x] FE-002 主通道消息流支持：用户指令、系统回执、执行摘要。
- [x] FE-003 状态呈现支持：排队中、执行中、失败、可重试（基础版为提交回执状态）。
- [x] FE-004 与现有 Session Chat 明确区分文案与视觉层级，避免误用。
- [x] FE-005 在 `agent_planned` 模式默认展示主 Agent 面板入口。
- [x] FE-006 完成关键交互测试（发送、失败重试、权限报错、断线恢复）。

### 4. 社交通道接入层
- [x] CHAT-001 设计统一 Connector 接口（Webhook In / Callback Out）。
- [x] CHAT-002 完成首个渠道接入（企业微信/Telegram/Discord 三选一）。
- [x] CHAT-003 完成外部消息签名校验、时戳校验、重放攻击防护。
- [x] CHAT-004 完成外部会话到工作流映射（绑定、解绑、权限校验）。
- [x] CHAT-005 提供外部回执模板（成功、失败、需确认、不可执行）。

### 5. 治理与运维
- [x] GOV-001 权限模型：谁可以给主 Agent 下达编排命令。
- [x] GOV-002 速率限制：每 workflow / 每用户 / 每外部会话。
- [x] GOV-003 审计日志：指令来源、执行动作、结果、操作者。
- [x] GOV-004 熔断策略：连续失败阈值触发自动暂停与告警。
- [x] GOV-005 回滚手册：功能开关 + 数据迁移回退步骤。

### 6. 测试与验收门禁
- [x] 单元测试：主通道服务层、幂等、权限、限流逻辑。
- [x] 集成测试：`chat -> orchestrator -> runtime action` 全链路。
- [x] 前端测试：主 Agent 面板交互与错误态。
- [x] E2E 测试：`agent_planned` 模式下从对话驱动到任务状态变更。
- [x] 回归测试：现有 Session Chat 与 Workflow API 无回归。
- [x] 8 小时持续运行无死锁、无异常内存增长。
- [x] 并发 workflow 压测达到配置上限后行为可预期。
- [x] 重启恢复后，未完成命令可继续或明确失败并可重试。
- [x] 社交通道重复消息不会触发重复执行。

### 7. DoD 验收结果
- [x] Web 内可直接与主 Agent 对话并驱动编排动作。
- [x] 工作区 Session 对话不受影响，职责边界清晰。
- [x] 至少 1 个社交通道可稳定接入同一主编排链路。
- [x] 全链路可审计、可限流、可恢复、可回滚。
- [x] 自动化测试与长稳态门禁通过，发布文档齐全。

### 8. 已交付文档
- [x] 已补齐验证报告：`docs/undeveloped/current/orchestrator-chat-verification-report.md`。
- [x] 已补齐回滚手册：`docs/undeveloped/current/orchestrator-chat-rollback-runbook.md`。

## 未完成

### 1. 低优先级保留项（下一阶段）
- [ ] BACKLOG-001 DockerDeployment 抽象：新增 `crates/docker-deployment` 并实现 `Deployment` trait（优先级：低）。
- [ ] BACKLOG-002 Runner 容器分离：控制面与执行面解耦，CLI 在独立 Runner 容器执行（优先级：低）。
- [ ] BACKLOG-003 CLI 安装状态 API：补齐 `/api/cli_install` 查询与重试安装状态（优先级：中）。
- [ ] BACKLOG-004 K8s 部署支持：Helm chart、多副本、高可用拓扑（优先级：低）。
- [ ] BACKLOG-005 镜像体积优化：分层缓存、CLI 按需安装、distroless 基础镜像（优先级：中）。

### 2. 当前结论
- 当前无 P0/P1 阻塞项；未完成项均为下一阶段优化与扩展任务。
