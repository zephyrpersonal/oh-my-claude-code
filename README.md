# oh-my-claude-code

> Multi-agent orchestration for Claude Code, inspired by [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode)

[English](README.md) | [中文](README_CN.md)

A Claude Code plugin providing specialized agents that work together through intelligent delegation.

## Overview

oh-my-claude-code brings the power of multi-agent orchestration to Claude Code. It provides:

- **Specialized Agents** - Each agent excels at a specific domain
- **Intelligent Delegation** - The orchestrator routes tasks to the right agent
- **Cost-Aware Selection** - FREE → CHEAP → EXPENSIVE decision framework
- **Structured Metadata** - YAML-based agent definitions with rich metadata
- **Ultrawork Mode** - Obsessive task completion with `ulw` magic keyword
- **Todo Continuation** - Sisyphus-style enforcement to complete all tasks

## Installation

### Local Installation (Recommended for Development)

1. Clone or download this repository:

```bash
git clone https://github.com/user/oh-my-claude-code.git
cd oh-my-claude-code
```

2. Add the local marketplace:

```bash
/plugin marketplace add ./oh-my-claude-code
```

3. Install the plugin:

```bash
/plugin install oh-my-claude-code@oh-my-claude-code-marketplace
```

### From GitHub (Coming Soon)

```bash
# When published to a marketplace
claude plugin install oh-my-claude-code@official-marketplace --scope user
```

## Plugin Structure

```
oh-my-claude-code/
├── .claude-plugin/
│   ├── plugin.json           # Plugin manifest
│   └── marketplace.json      # Local marketplace config
├── hooks/
│   ├── hooks.json            # Hooks configuration
│   ├── ultrawork-detector.js # Detects ulw keyword
│   └── todo-continuation-enforcer.js
├── commands/
│   └── ulw.md                # Slash command
├── agents/
│   ├── orchestrator.md
│   ├── explore.md
│   ├── librarian.md
│   └── ...
├── skills/
│   └── ultrawork/
│       └── SKILL.md
└── package.json
```

## Agents

| Agent | Model | Cost | Purpose |
|-------|-------|------|---------|
| **orchestrator** | inherit | EXPENSIVE | Task classification and delegation |
| **explore** | haiku | FREE | Internal codebase search |
| **librarian** | sonnet | CHEAP | External docs and research |
| **oracle** | opus | EXPENSIVE | Architecture and deep analysis |
| **frontend-ui-ux-engineer** | sonnet | CHEAP | Visual/UI changes |
| **document-writer** | sonnet | CHEAP | Technical documentation |
| **multimodal-looker** | sonnet | CHEAP | PDF/image analysis |

See [AGENTS.md](AGENTS.md) for detailed information about each agent.

## Ultrawork Mode (Sisyphus Mode)

Ultrawork is a special mode that enables obsessive task completion.

### Activation

Add `ulw`, `ultrawork`, or `uw` anywhere in your message:

```bash
claude "Implement user authentication, ulw"
claude "ulw refactor the database layer"
```

### Parameters

ULW supports optional parameters for fine-tuned control:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `--max-iterations N` | 50 | Maximum continuation attempts |
| `--thoroughness LEVEL` | thorough | Search depth: `quick`, `medium`, `thorough` |
| `--no-diagnostics` | (enabled) | Disable auto-diagnostics reminders |
| `--completion-signal "TEXT"` | (none) | Custom completion signal phrase |

**Examples:**

```bash
# Limit iterations
claude "implement auth, ulw --max-iterations 20"

# Custom completion signal
claude "add tests ulw --completion-signal 'all tests pass'"

# Quick search mode
claude "ulw --thoroughness quick fix the typo"

# Combined parameters
claude "refactor cache layer, ulw --max-iterations 30 --thoroughness medium"
```

### What It Does

- Creates comprehensive todo lists for every task
- Does NOT stop until ALL todos are complete
- Uses maximum thoroughness for searches
- Verifies every change with diagnostics
- Automatically continues if stopped with incomplete tasks

### The Sisyphus Promise

> "Like Sisyphus, you roll the boulder every day. You don't stop until you reach the top."

### ULW vs Ralph Loop

Both ULW and [Ralph Loop](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/ralph-loop) aim to keep Claude working until completion, but with different approaches:

| Dimension | ULW (Ultrawork) | Ralph Loop |
|-----------|-----------------|------------|
| **State Tracking** | Stateful via todos | Stateless, re-injects same prompt |
| **Progress** | Tracks via todo items | Tracks via file/git changes |
| **Completion Signal** | All todos marked complete | Outputs `<promise>COMPLETE</promise>` |
| **Activation** | `ulw` keyword anywhere | `/ralph-loop "prompt"` command |
| **Best For** | Complex tasks with clear steps | Greenfield, "walk away" tasks |
| **Iteration Control** | `maxContinuations: 50` | `--max-iterations N` |

**When to use which:**
- **ULW**: When you need fine-grained task tracking and want to see progress
- **Ralph Loop**: When you want Claude to iterate freely until it decides it's done

## Hooks

This plugin includes several hooks for enhanced workflow:

| Hook | Event | Purpose |
|------|-------|---------|
| `ultrawork-detector` | UserPromptSubmit | Detects `ulw` keyword and injects ultrawork instructions |
| `todo-continuation-enforcer` | Stop | Blocks stopping when todos are incomplete |
| `comment-checker` | PostToolUse | Warns about excessive or AI-style comments |
| `auto-diagnostics` | PostToolUse | Reminds to run `lsp_diagnostics` after file changes |

## Usage Examples

```bash
# Use the orchestrator for complex tasks
claude "Use the orchestrator to analyze this codebase, ulw"

# Delegate to specific agents
claude "Use the explore agent to find all error handling patterns"
claude "Use the librarian agent to research React hooks best practices"
```

## License

MIT

## Acknowledgments

- Inspired by [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode) by YeonGyu Kim
- Built for [Claude Code](https://code.claude.com)
