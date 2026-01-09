# Agent Documentation

Complete guide to all agents in oh-my-claude-code.

## Table of Contents

- [Orchestrator](#orchestrator)
- [Explore](#explore)
- [Librarian](#librarian)
- [Oracle](#oracle)
- [Frontend UI/UX Engineer](#frontend-ui-ux-engineer)
- [Document Writer](#document-writer)
- [Multimodal Looker](#multimodal-looker)

---

## Orchestrator

**File**: `.claude/agents/orchestrator.md`
**Model**: `inherit` (uses main conversation model)
**Cost**: EXPENSIVE
**Category**: advisor

### Purpose

The orchestrator is the main coordination agent. It classifies tasks and delegates to appropriate specialists.

### When to Use

- Complex multi-step tasks
- Tasks requiring coordination across multiple domains
- When you're unsure which agent to use
- Full-feature implementation with research

### Key Triggers

```
Complex multi-step tasks → Use orchestrator
```

### What It Does

1. **Intent Classification** - Analyzes request type
2. **Task Planning** - Creates detailed todo lists
3. **Agent Selection** - Routes to appropriate specialist
4. **Result Verification** - Checks delegated work

### Example Usage

```bash
# Complex feature requiring research
claude "Use the orchestrator to add JWT authentication"

# Multi-domain task
claude "Use the orchestrator to refactor the data layer and update UI"
```

---

## Explore

**File**: `.claude/agents/explore.md`
**Model**: `anthropic/claude-haiku-4-5`
**Cost**: FREE
**Category**: exploration

### Purpose

Fast, focused codebase search. Answers "Where is X?", "Which file has Y?", "Find the code that does Z".

### When to Use

- Multiple search angles needed
- Unfamiliar module structure
- Cross-layer pattern discovery
- "Where is X implemented?"
- "Which files contain Y?"

### When NOT to Use

- You know exactly what to search
- Single keyword/pattern suffices
- Known file location

### Key Triggers

```
2+ modules involved → fire explore
```

### Output Format

```xml
<analysis>
Literal Request: [What they literally asked]
Actual Need: [What they're really trying to accomplish]
Success Looks Like: [What result would let them proceed immediately]
</analysis>

<results>
<files>
- /absolute/path/to/file1.ts — [why this file is relevant]
- /absolute/path/to/file2.ts — [why this file is relevant]
</files>

<answer>
[Direct answer to their actual need]
</answer>

<next_steps>
[What they should do with this information]
</next_steps>
</results>
```

### Thoroughness Levels

| Level | Description | When to Use |
|-------|-------------|-------------|
| quick | Fast searches | Targeted lookups |
| medium | Moderate exploration | Default |
| very thorough | Comprehensive | Critical searches |

### Example Usage

```bash
claude "Use the explore agent to find all error handling patterns (medium thoroughness)"
```

---

## Librarian

**File**: `.claude/agents/librarian.md`
**Model**: `anthropic/claude-sonnet-4-5`
**Cost**: CHEAP
**Category**: exploration

### Purpose

External documentation and open-source research. Finds evidence with permalinks.

### When to Use

- "How do I use [library]?"
- "What's the best practice for [framework feature]?"
- "Find examples of [library] usage"
- Weird/unexpected behavior from a library
- Need official documentation
- Need OSS implementation examples

### When NOT to Use

- Internal codebase questions (use explore instead)
- Simple syntax questions
- Questions about well-known standard libraries

### Key Triggers

```
External library mentioned → fire librarian
```

### Output Format

Every claim includes evidence with permalinks:

```markdown
**Claim**: [What you're asserting]

**Evidence** ([source name](permalink)):
\`\`\`[language]
[source code snippet]
\`\`\`

**Context**: [Why this matters]
```

### Example Usage

```bash
claude "Use the librarian agent to find React hooks best practices with useEffect"
```

---

## Oracle

**File**: `.claude/agents/oracle.md`
**Model**: `anthropic/claude-opus-4-5`
**Cost**: EXPENSIVE
**Category**: advisor

### Purpose

Deep reasoning for architecture decisions, code analysis, and engineering guidance.

### When to Use

- Complex architecture design
- After completing significant work (self-review)
- 2+ failed fix attempts
- Unfamiliar code patterns
- Security/performance concerns
- Multi-system tradeoffs

### When NOT to Use

- Simple file operations
- First attempt at any fix
- Questions answerable from code you've read
- Trivial decisions (variable names, formatting)
- Things you can infer from existing code patterns

### Key Triggers

```
2+ failed fixes or complex architecture → Consult Oracle
```

### Output Format

```markdown
## Bottom Line
[2-3 sentences capturing your recommendation]

## Action Plan
1. [First step]
2. [Second step]
...

## Effort Estimate
Quick | Short | Medium | Large
```

### Effort Scale

| Scale | Duration | Examples |
|-------|----------|----------|
| Quick | < 1 hour | Simple changes |
| Short | 1-4 hours | Moderate changes |
| Medium | 1-2 days | Significant refactoring |
| Large | 3+ days | Major architecture changes |

### Example Usage

```bash
# Architecture decision
claude "Use the oracle agent to review this database schema for scalability"

# After failed attempts
claude "I've tried 3 times to fix this memory leak. Use the oracle agent to help."
```

---

## Frontend UI/UX Engineer

**File**: `.claude/agents/frontend-ui-ux-engineer.md`
**Model**: `anthropic/claude-sonnet-4-5`
**Cost**: CHEAP
**Category**: specialist

### Purpose

Visual/UI specialist for styling, layout, animation, and responsive design.

### When to Use

- Styling changes (colors, spacing, typography)
- Layout and positioning
- Animations and transitions
- Responsive design issues
- Hover states and interactions
- Visual polish and refinement

### When NOT to Use

- Pure logic changes (API calls, data fetching, state management)
- Type definitions
- Utility functions
- Business logic

### Key Triggers

```
Frontend VISUAL changes → delegate to frontend-ui-ux-engineer
```

### Visual Keywords

If ANY of these keywords are involved, this agent handles the work:

```
style, className, css, tailwind, color, background, border,
shadow, margin, padding, width, height, flex, grid, animation,
transition, hover, responsive, font, text, spacing, layout
```

### Scope

| You Handle | You DON'T Handle |
|------------|------------------|
| Colors, spacing, typography | API calls, state management |
| Layout, positioning | Event handlers (logic part) |
| Animations, transitions | Type definitions |
| Responsive design | Utility functions |
| Hover states | Business logic |

### Example Usage

```bash
claude "Use the frontend-ui-ux-engineer agent to improve this button's hover state"
claude "Use the frontend-ui-ux-engineer agent to make this layout responsive"
```

---

## Document Writer

**File**: `.claude/agents/document-writer.md`
**Model**: `anthropic/claude-sonnet-4-5`
**Cost**: CHEAP
**Category**: specialist

### Purpose

Technical writing specialist for clear, accurate documentation.

### When to Use

- Creating or updating README
- Writing API documentation
- Creating architecture documentation
- Writing user guides
- Adding code comments
- Creating changelogs
- Writing technical specifications

### When NOT to Use

- Code implementation (main agent task)
- Simple inline comments (implementer should add)
- Non-technical writing

### Key Triggers

```
Documentation tasks → delegate to document-writer
```

### Documentation Types

| Type | Purpose | Key Elements |
|------|---------|--------------|
| README | Project overview | Title, install, usage, contributing |
| API Docs | Interface docs | Endpoints, parameters, examples |
| Architecture Docs | System design | Overview, components, data flow |
| User Guides | How-to instructions | Prerequisites, steps, troubleshooting |
| Changelog | Version history | Version, changes, migration notes |

### Example Usage

```bash
claude "Use the document-writer agent to create API documentation for this module"
claude "Use the document-writer agent to update the README with installation instructions"
```

---

## Multimodal Looker

**File**: `.claude/agents/multimodal-looker.md`
**Model**: `anthropic/claude-sonnet-4-5`
**Cost**: CHEAP
**Category**: specialist

### Purpose

Visual analysis specialist for PDFs, images, screenshots, and diagrams.

### When to Use

- Analyzing PDF documents
- Interpreting screenshots
- Understanding diagrams and flowcharts
- Reading charts and graphs
- Extracting text from images
- Analyzing UI mockups
- Error screenshot analysis

### When NOT to Use

- Code-only tasks (use explore)
- Text-based documentation (use librarian or read directly)
- Questions that don't involve visual media

### Key Triggers

```
PDF/image/screenshot → delegate to multimodal-looker
```

### Media Types Handled

| Type | What It Does |
|------|--------------|
| PDFs | Extract text, understand structure, summarize |
| Screenshots | Interpret UI, read errors, analyze states |
| Diagrams | Understand flowcharts, architecture, ER diagrams |
| Charts | Extract data, identify trends |
| Images | Extract text, describe content |

### Example Usage

```bash
claude "Use the multimodal-looker agent to analyze this error screenshot"
claude "Use the multimodal-looker agent to extract data from this chart"
```

---

## Cost-Based Decision Framework

```
Direct Tools (FREE) → explore (FREE) → librarian (CHEAP) → specialist → oracle (EXPENSIVE)
```

1. **Direct Tools First**: If you know exactly what to do
2. **Explore Agent**: Internal codebase search
3. **Librarian Agent**: External docs and research
4. **Specialist Agents**: Domain-specific work
5. **Oracle Agent**: Complex architecture and deep analysis

## Agent Selection Quick Reference

| Question | Use Agent |
|----------|-----------|
| Where is this code? | explore |
| How do I use this library? | librarian |
| Is this architecture sound? | oracle |
| Make this look better | frontend-ui-ux-engineer |
| Document this code | document-writer |
| What's in this image? | multimodal-looker |
| Complex, multi-step task | orchestrator |
