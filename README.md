# oh-my-claude-code

> Multi-agent orchestration for Claude Code, inspired by [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode)

[English](README.md) | [中文](README_CN.md)

**Version:** 1.2.0 | [Changelog](#changelog) | [ROADMAP](ROADMAP.md)

A Claude Code plugin providing specialized agents that work together through intelligent delegation.

## Overview

oh-my-claude-code brings the power of multi-agent orchestration to Claude Code. It provides:

- **Specialized Agents** - Each agent excels at a specific domain
- **Intelligent Delegation** - The orchestrator routes tasks to the right agent
- **Cost-Aware Selection** - FREE → CHEAP → EXPENSIVE decision framework
- **Structured Metadata** - YAML-based agent definitions with rich metadata
- **Ultrawork Mode** - Obsessive task completion with `ulw` magic keyword
- **Todo Continuation** - Sisyphus-style enforcement to complete all tasks

### v1.2.0 Architecture Improvements

- **Centralized Configuration** - All config managed in `config/index.js`
- **Parameter Validation** - Type-safe validation with helpful error messages
- **Progress Visualization** - Beautiful progress bars and time estimates
- **Performance Optimized** - Parallel PostToolUse processing (~40% faster)
- **Modular Utils** - Reusable validation, patterns, and progress reporting

## Installation

### From Marketplace (Recommended)

```bash
# Add the marketplace
/plugin marketplace add https://github.com/zephyrpersonal/oh-my-claude-code

# Install the plugin
/plugin install oh-my-claude-code@oh-my-claude-code-plugins
```

### Local Installation (For Development)

1. Clone the repository:

```bash
git clone https://github.com/zephyrpersonal/oh-my-claude-code.git
```

2. Add local marketplace and install:

```bash
/plugin marketplace add ./oh-my-claude-code
/plugin install oh-my-claude-code@oh-my-claude-code-plugins
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
│   ├── todo-continuation-enforcer.js
│   └── post-tool-processor.js # Unified PostToolUse handler
├── config/
│   └── index.js              # Centralized configuration
├── utils/
│   ├── validation.js         # Parameter validation
│   ├── patterns.js           # Pre-compiled regex
│   └── progress-reporter.js  # Progress visualization
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
├── docs/
│   └── WEEK1-2-SUMMARY.md    # Development summaries
├── ROADMAP.md                # 48-week iteration plan
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
| `post-tool-processor` | PostToolUse | Unified handler for comment checking and diagnostics reminders |

## Usage Examples

```bash
# Use the orchestrator for complex tasks
claude "Use the orchestrator to analyze this codebase, ulw"

# Delegate to specific agents
claude "Use the explore agent to find all error handling patterns"
claude "Use the librarian agent to research React hooks best practices"
```

## Changelog

### [1.2.0] - 2025-01-11

**Week1-2 Architecture Optimization**

#### Added
- **Centralized Configuration** (`config/index.js`)
  - All constants and settings in one place
  - Easy customization for users
  - Pre-compiled regex patterns
- **Parameter Validation** (`utils/validation.js`)
  - Type-safe validation for ultrawork parameters
  - Helpful error messages with field names
  - Range checking and enum validation
- **Progress Visualization** (`utils/progress-reporter.js`)
  - Beautiful ASCII progress bars
  - Time estimates for remaining tasks
  - Compact and detailed report formats
- **Pre-compiled Patterns** (`utils/patterns.js`)
  - All regex patterns defined centrally
  - Performance optimization through pre-compilation
  - Helper functions for pattern matching

#### Changed
- **PostToolUse Hooks Unified**
  - Merged `comment-checker` and `auto-diagnostics` into single processor
  - Parallel execution via `Promise.all` (~40% performance gain)
  - Reduced process count from 2 to 1
- **ultrawork-detector.js**
  - Now uses centralized configuration
  - Integrated parameter validation
  - Better error messages
- **todo-continuation-enforcer.js**
  - Enhanced with progress visualization
  - Uses pre-compiled patterns
  - Cleaner code structure

#### Documentation
- **ROADMAP.md** - 48-week iteration plan (4 quarters)
- **docs/WEEK1-2-SUMMARY.md** - Complete summary of Week1-2 changes
- **notes.md** - Optimization analysis and technical debt tracking
- **task_plan.md** - Task planning and progress tracking

### [1.1.0] - 2025-01-09
- Simplified model config to haiku/sonnet/opus format
- Updated repository URL to zephyrpersonal/oh-my-claude-code

### [1.0.0] - 2025-01-08
- Initial release of oh-my-claude-code plugin

## License

MIT

## Acknowledgments

- Inspired by [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode) by YeonGyu Kim
- Built for [Claude Code](https://code.claude.com)
