# oh-my-claude-code

> Claude Code 的多智能体编排系统，灵感来自 [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode)

[English](README.md) | 中文

一个 Claude Code 插件，通过智能委托让专业化智能体协同工作。

## 概述

oh-my-claude-code 为 Claude Code 带来多智能体编排能力：

- **专业化智能体** - 每个智能体专精于特定领域
- **智能委托** - 编排器自动将任务路由到合适的智能体
- **成本感知** - FREE → CHEAP → EXPENSIVE 决策框架
- **结构化元数据** - 基于 YAML 的智能体定义
- **Ultrawork 模式** - 使用 `ulw` 魔法关键词触发执着的任务完成模式
- **Todo 延续** - 西西弗斯式的任务完成强制机制

## 安装

### 本地安装（推荐用于开发）

1. 克隆或下载本仓库：

```bash
git clone https://github.com/user/oh-my-claude-code.git
cd oh-my-claude-code
```

2. 添加本地 marketplace：

```bash
/plugin marketplace add ./oh-my-claude-code
```

3. 安装插件：

```bash
/plugin install oh-my-claude-code@oh-my-claude-code-plugins
```

## 插件结构

```
oh-my-claude-code/
├── .claude-plugin/
│   ├── plugin.json           # 插件清单
│   └── marketplace.json      # 本地 marketplace 配置
├── hooks/
│   ├── hooks.json            # Hooks 配置
│   ├── ultrawork-detector.js # 检测 ulw 关键词
│   ├── todo-continuation-enforcer.js
│   ├── comment-checker.js    # 检查过多注释
│   └── auto-diagnostics.js   # 自动诊断提醒
├── commands/
│   └── ulw.md                # Slash 命令
├── agents/
│   ├── orchestrator.md       # 编排器
│   ├── explore.md            # 代码搜索
│   ├── librarian.md          # 文档研究
│   └── ...
├── skills/
│   └── ultrawork/
│       └── SKILL.md
└── package.json
```

## 智能体

| 智能体 | 模型 | 成本 | 用途 |
|--------|------|------|------|
| **orchestrator** | inherit | 昂贵 | 任务分类和委托 |
| **explore** | haiku | 免费 | 内部代码库搜索 |
| **librarian** | sonnet | 便宜 | 外部文档和研究 |
| **oracle** | opus | 昂贵 | 架构和深度分析 |
| **frontend-ui-ux-engineer** | sonnet | 便宜 | 视觉/UI 变更 |
| **document-writer** | sonnet | 便宜 | 技术文档 |
| **multimodal-looker** | sonnet | 便宜 | PDF/图片分析 |

详见 [AGENTS.md](AGENTS.md) 了解每个智能体的详细信息。

## Ultrawork 模式（西西弗斯模式）

Ultrawork 是一种特殊模式，启用执着的任务完成机制。

### 激活方式

在消息中任意位置添加 `ulw`、`ultrawork` 或 `uw`：

```bash
claude "实现用户认证功能, ulw"
claude "ulw 重构数据库层"
```

### 参数

ULW 支持可选参数进行精细控制：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--max-iterations N` | 50 | 最大继续尝试次数 |
| `--thoroughness LEVEL` | thorough | 搜索深度: `quick`, `medium`, `thorough` |
| `--no-diagnostics` | (启用) | 禁用自动诊断提醒 |
| `--completion-signal "TEXT"` | (无) | 自定义完成信号短语 |

**示例：**

```bash
# 限制迭代次数
claude "实现认证, ulw --max-iterations 20"

# 自定义完成信号
claude "添加测试 ulw --completion-signal '所有测试通过'"

# 快速搜索模式
claude "ulw --thoroughness quick 修复拼写错误"

# 组合参数
claude "重构缓存层, ulw --max-iterations 30 --thoroughness medium"
```

### 功能

- 为每个任务创建详尽的 todo 列表
- 在所有 todos 完成前**不会停止**
- 使用最高搜索深度
- 每次变更后自动验证
- 如果尝试停止但有未完成任务，会自动继续

### 西西弗斯承诺

> "像西西弗斯一样，你每天推动巨石。在到达山顶之前，你不会停止。"

### ULW vs Ralph Loop

ULW 和 [Ralph Loop](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/ralph-loop) 都旨在让 Claude 持续工作直到完成，但方式不同：

| 维度 | ULW (Ultrawork) | Ralph Loop |
|------|-----------------|------------|
| **状态跟踪** | 有状态，通过 todos | 无状态，重新注入相同 prompt |
| **进度追踪** | 通过 todo 项目 | 通过文件/git 变更 |
| **完成信号** | 所有 todos 标记完成 | 输出 `<promise>COMPLETE</promise>` |
| **激活方式** | `ulw` 关键词 | `/ralph-loop "prompt"` 命令 |
| **适用场景** | 有明确步骤的复杂任务 | Greenfield，"走开让它跑"的任务 |
| **迭代控制** | `maxContinuations: 50` | `--max-iterations N` |

**何时使用哪个：**
- **ULW**：需要细粒度任务跟踪，想看到进度时
- **Ralph Loop**：想让 Claude 自由迭代直到它认为完成时

## Hooks

本插件包含多个增强工作流的 hooks：

| Hook | 事件 | 用途 |
|------|------|------|
| `ultrawork-detector` | UserPromptSubmit | 检测 `ulw` 关键词并注入 ultrawork 指令 |
| `todo-continuation-enforcer` | Stop | 在 todos 未完成时阻止停止 |
| `comment-checker` | PostToolUse | 警告过多或 AI 风格的注释 |
| `auto-diagnostics` | PostToolUse | 文件修改后提醒运行 `lsp_diagnostics` |

## 使用示例

```bash
# 使用编排器处理复杂任务
claude "使用 orchestrator 分析这个代码库, ulw"

# 委托给特定智能体
claude "使用 explore agent 查找所有错误处理模式"
claude "使用 librarian agent 研究 React hooks 最佳实践"
```

## 许可证

MIT

## 致谢

- 灵感来自 [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode)，作者 YeonGyu Kim
- 为 [Claude Code](https://code.claude.com) 构建
