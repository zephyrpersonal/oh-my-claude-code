# oh-my-claude-code 长期迭代路线图

> 版本: 1.0.0
> 最后更新: 2025-01-11
> 状态: 活跃开发中

---

## 执行摘要

本路线图将优化工作分为 **4 个季度**，每个季度聚焦特定主题，确保在提升代码质量的同时持续交付用户价值。

### 季度主题概览

| 季度 | 主题 | 核心目标 | 关键成果 |
|------|------|----------|----------|
| **Q1** | 性能与稳定性 | 解决核心性能瓶颈 | Hook 延迟降低 80% |
| **Q2** | 质量与可维护性 | 建立测试和类型系统 | 测试覆盖率 > 60% |
| **Q3** | 智能与自动化 | 增强 agent 智能选择 | Agent 准确率 > 90% |
| **Q4** | 生态与扩展 | 插件化和可扩展性 | 支持第三方扩展 |

---

## Q1 2025: 性能与稳定性 (Week 1-12)

### 目标
- 解决核心性能瓶颈
- 提升系统稳定性
- 改善用户体验基础

### Week 1-2: 速赢项目

#### 配置集中化
**优先级**: 🔴 高 | **难度**: 低 | **负责人**: 待分配

```javascript
// 创建: config/index.js
module.exports = {
  ULTRAWORK: {
    DEFAULT_MAX_ITERATIONS: 50,
    DEFAULT_THOROUGHNESS: 'thorough',
    KEYWORDS: ['ulw', 'ultrawork', 'uw'],
    VALID_THOROUGHNESS: ['quick', 'medium', 'thorough'],
  },
  COMMENT_CHECKER: {
    THRESHOLD: 0.40,
    AI_INDICATORS: [
      'this function', 'this method', 'this variable',
      'we need to', 'we use', 'here we',
      'this is used to', 'this handles', 'this checks',
      'initialize', 'set up', 'configure',
    ],
  },
  PERFORMANCE: {
    TRANSCRIPT_SCAN_LINES: 100, // 反向扫描行数
    HOOK_TIMEOUT_MS: 5000,
  },
};
```

**交付物**:
- [ ] `config/index.js` 配置模块
- [ ] 所有 hooks 迁移到使用集中配置
- [ ] 配置验证函数

#### 参数验证与友好错误
**优先级**: 🔴 高 | **难度**: 低

```javascript
// 创建: utils/validation.js
class ValidationError extends Error {
  constructor(message, field, value) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

function validateUltraworkParams(params) {
  const errors = [];

  if (params.maxIterations < 1 || params.maxIterations > 1000) {
    errors.push(new ValidationError(
      'max-iterations must be between 1 and 1000',
      'maxIterations',
      params.maxIterations
    ));
  }

  if (!config.ULTRAWORK.VALID_THOROUGHNESS.includes(params.thoroughness)) {
    errors.push(new ValidationError(
      `thoroughness must be one of: ${config.ULTRAWORK.VALID_THOROUGHNESS.join(', ')}`,
      'thoroughness',
      params.thoroughness
    ));
  }

  return errors;
}
```

**交付物**:
- [ ] `utils/validation.js` 验证模块
- [ ] `ultrawork-detector.js` 集成验证
- [ ] 友好的错误提示 UI

#### PostToolUse Hooks 合并
**优先级**: 🔴 高 | **难度**: 低

```javascript
// 创建: hooks/post-tool-processor.js
const { checkComments } = require('./lib/comment-checker');
const { checkDiagnostics } = require('./lib/diagnostics-checker');

async function processPostToolUse(data) {
  const results = await Promise.all([
    checkComments(data),
    checkDiagnostics(data),
  ]);

  const warnings = results.filter(r => r !== null);
  if (warnings.length === 0) {
    process.exit(0);
  }

  const output = {
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: warnings.map(w => w.message).join('\n\n'),
    },
  };

  console.log(JSON.stringify(output));
  process.exit(0);
}
```

**交付物**:
- [ ] `hooks/post-tool-processor.js` 统一处理器
- [ ] `hooks/lib/comment-checker.js`
- [ ] `hooks/lib/diagnostics-checker.js`
- [ ] `hooks.json` 更新配置

#### 进度报告可视化
**优先级**: 🔴 高 | **难度**: 低

```javascript
// 在 todo-continuation-enforcer.js 中添加
function generateProgressReport(total, completed, pending) {
  const progressPercent = Math.round((completed / total) * 100);
  const barLength = 40;
  const filled = Math.round((progressPercent / 100) * barLength);
  const empty = barLength - filled;

  return `
[PROGRESS]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${'█'.repeat(filled)}${'░'.repeat(empty)} ${progressPercent}%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Completed: ${completed}/${total}
Pending: ${pending}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}
```

**交付物**:
- [ ] 进度条可视化组件
- [ ] 时间估算显示
- [ ] 剩余任务列表格式化

---

### Week 3-4: 性能核心优化

#### Transcript 反向扫描
**优先级**: 🔴 高 | **难度**: 中 | **性能提升**: 80%+

```javascript
// 优化: hooks/lib/transcript-parser.js
class TranscriptParser {
  constructor(transcriptPath) {
    this.transcriptPath = transcriptPath;
    this.cache = new Map();
  }

  /**
   * 从末尾反向扫描，只解析最近 N 行
   * @param {number} linesToScan - 要扫描的行数
   */
  parseFromEnd(linesToScan = 100) {
    const content = fs.readFileSync(this.transcriptPath, 'utf8');
    const lines = content.trim().split('\n');

    // 只取最后 N 行
    const recentLines = lines.slice(-linesToScan);
    const results = {
      ultraworkActive: false,
      incompleteTodos: [],
      continuationCount: 0,
    };

    for (const line of recentLines) {
      try {
        const entry = JSON.parse(line);
        this.processEntry(entry, results);
      } catch (e) {
        continue;
      }
    }

    return results;
  }

  processEntry(entry, results) {
    const content = JSON.stringify(entry);

    // 检测 ultrawork 关键词
    if (!results.ultraworkActive) {
      for (const keyword of config.ULTRAWORK.KEYWORDS) {
        if (content.includes(keyword)) {
          results.ultraworkActive = true;
          break;
        }
      }
    }

    // 统计 continuation 次数
    if (content.includes('Continue working on the next pending task')) {
      results.continuationCount++;
    }

    // 解析 todo 状态
    if (entry.type === 'tool_use' || entry.type === 'tool_result') {
      const todos = this.extractTodos(entry);
      const pending = todos.filter(t => t.status === 'pending' || t.status === 'in_progress');
      if (pending.length > 0) {
        results.incompleteTodos = pending;
      }
    }
  }

  extractTodos(entry) {
    // 实现提取逻辑
    // ...
  }
}
```

**交付物**:
- [ ] `hooks/lib/transcript-parser.js`
- [ ] 单元测试 (性能基准)
- [ ] 性能对比报告

#### Hook 状态管理
**优先级**: 🟡 中 | **难度**: 中

```javascript
// 创建: hooks/lib/state-manager.js
const os = require('os');
const path = require('path');
const crypto = require('crypto');

class StateManager {
  constructor() {
    this.stateDir = path.join(os.tmpdir(), 'oh-my-claude-code-state');
    this.ensureStateDir();
  }

  ensureStateDir() {
    if (!fs.existsSync(this.stateDir)) {
      fs.mkdirSync(this.stateDir, { recursive: true });
    }
  }

  /**
   * 生成会话 ID
   */
  generateSessionId(transcriptPath) {
    return crypto.createHash('md5')
      .update(transcriptPath)
      .digest('hex');
  }

  /**
   * 设置状态
   */
  setState(sessionId, key, value, ttl = 3600000) {
    const stateFile = path.join(this.stateDir, `${sessionId}_${key}.json`);
    const state = {
      value,
      timestamp: Date.now(),
      ttl,
    };
    fs.writeFileSync(stateFile, JSON.stringify(state));
  }

  /**
   * 获取状态
   */
  getState(sessionId, key) {
    const stateFile = path.join(this.stateDir, `${sessionId}_${key}.json`);
    if (!fs.existsSync(stateFile)) {
      return null;
    }

    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    const age = Date.now() - state.timestamp;

    if (age > state.ttl) {
      fs.unlinkSync(stateFile);
      return null;
    }

    return state.value;
  }

  /**
   * 清理过期状态
   */
  cleanup() {
    const files = fs.readdirSync(this.stateDir);
    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(this.stateDir, file);
      const stat = fs.statSync(filePath);

      // 清理 1 天前的文件
      if (now - stat.mtimeMs > 86400000) {
        fs.unlinkSync(filePath);
      }
    }
  }
}

module.exports = new StateManager();
```

**交付物**:
- [ ] `hooks/lib/state-manager.js`
- [ ] `ultrawork-detector.js` 集成状态传递
- [ ] 自动清理机制

#### 预编译正则表达式
**优先级**: 🟢 低 | **难度**: 低 | **性能提升**: 10-20%

```javascript
// 创建: utils/patterns.js
const COMMENT_PATTERNS = {
  js: [
    /\/\/.*$/gm,
    /\/\*[\s\S]*?\*\//gm,
  ],
  ts: [
    /\/\/.*$/gm,
    /\/\*[\s\S]*?\*\//gm,
  ],
  // ... 其他语言
};

const ULTRAWORK_PARAM_PATTERNS = {
  maxIterations: /--max-iterations\s+(\d+)/i,
  thoroughness: /--thoroughness\s+(quick|medium|thorough)/i,
  noDiagnostics: /--no-diagnostics/i,
  completionSignal: /--completion-signal\s+["']([^"']+)["']/i,
};

module.exports = {
  COMMENT_PATTERNS,
  ULTRAWORK_PARAM_PATTERNS,
};
```

---

### Week 5-6: 类型安全与文档

#### JSDoc 类型注解
**优先级**: 🟡 中 | **难度**: 低

```javascript
/**
 * @typedef {Object} UltraworkParams
 * @property {number} maxIterations - 最大迭代次数 (1-1000)
 * @property {'quick'|'medium'|'thorough'} thoroughness - 搜索深度
 * @property {boolean} diagnostics - 是否启用自动诊断
 * @property {string|null} completionSignal - 完成信号短语
 */

/**
 * 从用户提示词中解析 ultrawork 参数
 * @param {string} prompt - 用户输入的提示词
 * @returns {UltraworkParams} 解析后的参数对象
 * @throws {ValidationError} 如果参数值无效
 *
 * @example
 * parseParams('ulw --max-iterations 20 --thoroughness quick')
 * // => { maxIterations: 20, thoroughness: 'quick', diagnostics: true, completionSignal: null }
 */
function parseParams(prompt) {
  // 实现...
}

/**
 * @typedef {Object} HookOutput
 * @property {string} hookEventName - 钩子事件名称
 * @property {string} additionalContext - 额外的上下文信息
 */

/**
 * 构建输出对象
 * @param {string} eventName - 事件名称
 * @param {string[]} messages - 消息数组
 * @returns {HookOutput} 钩子输出对象
 */
function buildHookOutput(eventName, messages) {
  // 实现...
}
```

**交付物**:
- [ ] 所有 hooks 添加 JSDoc 注解
- [ ] `utils/` 模块添加类型定义
- [ ] 生成类型文档 (JSDoc)

#### API 文档生成
**优先级**: 🟢 低 | **难度**: 低

```bash
# 安装 JSDoc
npm install --save-dev jsdoc

# 配置: jsdoc.conf.json
{
  "source": {
    "include": ["hooks/", "utils/"],
    "includePattern": "\\.(js|jsx)$"
  },
  "opts": {
    "destination": "./docs/api/",
    "recurse": true
  }
}

# 生成文档
npx jsdoc -c jsdoc.conf.json
```

**交付物**:
- [ ] JSDoc 配置文件
- [ ] API 文档网站
- [ ] GitHub Pages 集成

---

### Week 7-8: 用户配置系统

#### 用户配置文件支持
**优先级**: 🟡 中 | **难度**: 中

```javascript
// 创建: config/user-config.js
const path = require('path');
const fs = require('fs');

const DEFAULT_USER_CONFIG = {
  ultrawork: {
    defaultMaxIterations: 50,
    defaultThoroughness: 'thorough',
    autoDiagnostics: true,
    aliases: [],
  },
  commentChecker: {
    enabled: true,
    threshold: 0.40,
    strictMode: false,
  },
  performance: {
    transcriptScanLines: 100,
    hookTimeout: 5000,
  },
};

class UserConfig {
  constructor(projectRoot) {
    this.configPath = path.join(projectRoot, '.claude', 'oh-my-claude-code.local.json');
    this.config = this.loadConfig();
  }

  loadConfig() {
    if (!fs.existsSync(this.configPath)) {
      return { ...DEFAULT_USER_CONFIG };
    }

    try {
      const userConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      return this.mergeConfig(DEFAULT_USER_CONFIG, userConfig);
    } catch (error) {
      console.error(`Failed to load user config: ${error.message}`);
      return { ...DEFAULT_USER_CONFIG };
    }
  }

  mergeConfig(defaults, user) {
    // 深度合并
    const merged = { ...defaults };
    for (const key in user) {
      if (typeof user[key] === 'object' && !Array.isArray(user[key])) {
        merged[key] = { ...defaults[key], ...user[key] };
      } else {
        merged[key] = user[key];
      }
    }
    return merged;
  }

  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.config);
  }

  save(config) {
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    this.config = config;
  }
}

module.exports = UserConfig;
```

**交付物**:
- [ ] `config/user-config.js`
- [ ] `.claude/oh-my-claude-code.local.json` 示例
- [ ] 配置迁移脚本
- [ ] 配置文档

---

### Week 9-10: 错误处理改进

#### 结构化错误处理
**优先级**: 🟡 中 | **难度**: 中

```javascript
// 创建: utils/errors.js
/**
 * 基础 Hook 错误类
 */
class HookError extends Error {
  constructor(message, code, context = {}) {
    super(message);
    this.name = 'HookError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp,
    };
  }
}

/**
 * 验证错误
 */
class ValidationError extends HookError {
  constructor(message, field, value) {
    super(message, 'VALIDATION_ERROR', { field, value });
    this.name = 'ValidationError';
  }
}

/**
 * 配置错误
 */
class ConfigurationError extends HookError {
  constructor(message, configPath) {
    super(message, 'CONFIG_ERROR', { configPath });
    this.name = 'ConfigurationError';
  }
}

/**
 * 解析错误
 */
class ParseError extends HookError {
  constructor(message, source, position) {
    super(message, 'PARSE_ERROR', { source, position });
    this.name = 'ParseError';
  }
}

/**
 * 错误日志记录器
 */
class ErrorLogger {
  static log(error, hookName) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      hook: hookName,
      error: error.toJSON ? error.toJSON() : {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    };

    // 输出到 stderr
    console.error(JSON.stringify(logEntry));

    // 可选: 写入日志文件
    // ErrorLogger.writeToLogfile(logEntry);
  }
}

module.exports = {
  HookError,
  ValidationError,
  ConfigurationError,
  ParseError,
  ErrorLogger,
};
```

**交付物**:
- [ ] `utils/errors.js` 错误类层次结构
- [ ] 所有 hooks 集成错误处理
- [ ] 错误日志格式规范

---

### Week 11-12: Q1 验收与总结

#### 性能测试与基准
**优先级**: 🔴 高 | **难度**: 中

```javascript
// 创建: benchmarks/q1-performance.js
const Benchmark = require('benchmark');
const TranscriptParser = require('../hooks/lib/transcript-parser');

const suite = new Benchmark.Suite();

// 生成测试数据
const largeTranscript = generateTranscript(1000);

suite
  .add('Transcript Parser - Full Scan', () => {
    parseTranscriptFull(largeTranscript);
  })
  .add('Transcript Parser - Reverse Scan (100 lines)', () => {
    const parser = new TranscriptParser('/tmp/test.json');
    parser.parseFromEnd(100);
  })
  .add('PostToolUse Hooks - Old (Sequential)', () => {
    runOldHooks();
  })
  .add('PostToolUse Hooks - New (Parallel)', () => {
    runNewHooks();
  })
  .on('cycle', (event) => {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run();
```

**交付物**:
- [ ] 性能基准测试套件
- [ ] Q1 性能报告
- [ ] 优化前后对比数据

#### Q1 里程碑检查
- [ ] Hook 平均延迟 < 20ms ✅
- [ ] Transcript 解析 < 10ms ✅
- [ ] 所有 hooks 有 JSDoc 注解 ✅
- [ ] 用户配置系统就绪 ✅
- [ ] 错误处理改进完成 ✅

---

## Q2 2025: 质量与可维护性 (Week 13-24)

### 目标
- 建立完整的测试体系
- 提升代码质量
- 改善开发者体验

### Week 13-16: 测试框架建立

#### 单元测试基础设施
**优先级**: 🔴 高 | **难度**: 中

```bash
# 安装依赖
npm install --save-dev jest \
  @types/jest \
  jest-extended \
  @jest/globals
```

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  collectCoverageFrom: [
    'hooks/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
  ],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js',
  ],
};
```

```javascript
// hooks/__tests__/transcript-parser.test.js
import { describe, it, expect, beforeEach } from '@jest/globals';
import TranscriptParser from '../lib/transcript-parser';
import fs from 'fs';
import os from 'os';

describe('TranscriptParser', () => {
  let tempTranscriptPath;
  let parser;

  beforeEach(() => {
    // 创建临时测试文件
    tempTranscriptPath = `${os.tmpdir()}/test-transcript-${Date.now()}.json`;
    const testData = [
      { type: 'message', role: 'user', content: 'test ulw' },
      { type: 'tool_use', name: 'TodoWrite', input: { todos: [
        { content: 'Task 1', status: 'pending' },
        { content: 'Task 2', status: 'in_progress' },
      ]}},
    ].map(line => JSON.stringify(line)).join('\n');

    fs.writeFileSync(tempTranscriptPath, testData);
    parser = new TranscriptParser(tempTranscriptPath);
  });

  afterEach(() => {
    if (fs.existsSync(tempTranscriptPath)) {
      fs.unlinkSync(tempTranscriptPath);
    }
  });

  describe('parseFromEnd', () => {
    it('should detect ultrawork keywords', () => {
      const result = parser.parseFromEnd(100);
      expect(result.ultraworkActive).toBe(true);
    });

    it('should extract incomplete todos', () => {
      const result = parser.parseFromEnd(100);
      expect(result.incompleteTodos).toHaveLength(2);
    });

    it('should count continuation prompts', () => {
      const testData = [
        { type: 'message', content: 'Continue working on the next pending task' },
        { type: 'message', content: 'Continue working on the next pending task' },
      ].map(line => JSON.stringify(line)).join('\n');
      fs.appendFileSync(tempTranscriptPath, testData);

      const result = parser.parseFromEnd(100);
      expect(result.continuationCount).toBe(2);
    });
  });
});
```

**交付物**:
- [ ] Jest 配置和测试框架
- [ ] `hooks/__tests__/` 测试目录
- [ ] `utils/__tests__/` 测试目录
- [ ] 覆盖率报告配置

#### 集成测试
**优先级**: 🟡 中 | **难度**: 中

```javascript
// integration/__tests__/ultrawork-flow.test.js
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { execFile } from 'child_process';
import promisify from 'util';
import fs from 'fs';

const execFileAsync = promisify(execFile);

describe('Ultrawork Mode Integration', () => {
  let tempTranscript;

  beforeAll(() => {
    tempTranscript = `/tmp/test-transcript-${Date.now()}.json`;
  });

  afterAll(() => {
    if (fs.existsSync(tempTranscript)) {
      fs.unlinkSync(tempTranscript);
    }
  });

  it('should detect ulw keyword and inject context', async () => {
    const input = JSON.stringify({
      prompt: 'implement auth, ulw --max-iterations 10',
    });

    const { stdout } = await execFileAsync(
      'node',
      ['hooks/ultrawork-detector.js'],
      { input }
    );

    const result = JSON.parse(stdout);
    expect(result.hookSpecificOutput).toBeDefined();
    expect(result.hookSpecificOutput.ultraworkParams).toMatchObject({
      maxIterations: 10,
      thoroughness: 'thorough',
    });
  });

  it('should enforce continuation when todos are incomplete', async () => {
    // 创建包含未完成 todos 的 transcript
    const testTranscript = [
      { type: 'message', role: 'user', content: 'test ulw' },
      { type: 'tool_use', name: 'TodoWrite', input: { todos: [
        { content: 'Incomplete task', status: 'pending' },
      ]}},
    ].map(line => JSON.stringify(line)).join('\n');

    fs.writeFileSync(tempTranscript, testTranscript);

    const input = JSON.stringify({
      transcript_path: tempTranscript,
      stop_hook_active: false,
    });

    const { stdout } = await execFileAsync(
      'node',
      ['hooks/todo-continuation-enforcer.js'],
      { input }
    );

    const result = JSON.parse(stdout);
    expect(result.decision).toBe('block');
    expect(result.reason).toContain('Incomplete tasks detected');
  });
});
```

**交付物**:
- [ ] 集成测试套件
- [ ] 端到端场景覆盖
- [ ] CI/CD 集成

---

### Week 17-20: 代码质量提升

#### TypeScript 迁移计划
**优先级**: 🟡 中 | **难度**: 高

```bash
# 安装 TypeScript
npm install --save-dev typescript @tsconfig/node20

# tsconfig.json
{
  "extends": "@tsconfig/node20/tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": ".",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": [
    "hooks/**/*",
    "utils/**/*",
    "config/**/*"
  ],
  "exclude": ["node_modules", "**/__tests__/**", "**/*.test.ts"]
}
```

```typescript
// hooks/lib/transcript-parser.ts
interface Todo {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  activeForm: string;
}

interface TranscriptEntry {
  type: string;
  [key: string]: any;
}

interface ParseResult {
  ultraworkActive: boolean;
  incompleteTodos: string[];
  continuationCount: number;
}

interface TranscriptParserOptions {
  scanLines?: number;
  cacheEnabled?: boolean;
}

class TranscriptParser {
  private transcriptPath: string;
  private options: Required<TranscriptParserOptions>;
  private cache: Map<string, any>;

  constructor(transcriptPath: string, options: TranscriptParserOptions = {}) {
    this.transcriptPath = transcriptPath;
    this.options = {
      scanLines: options.scanLines ?? 100,
      cacheEnabled: options.cacheEnabled ?? true,
    };
    this.cache = new Map();
  }

  /**
   * 从末尾反向扫描 transcript
   */
  parseFromEnd(linesToScan?: number): ParseResult {
    const scanLines = linesToScan ?? this.options.scanLines;
    const content = fs.readFileSync(this.transcriptPath, 'utf8');
    const lines = content.trim().split('\n');

    const recentLines = lines.slice(-scanLines);
    const result: ParseResult = {
      ultraworkActive: false,
      incompleteTodos: [],
      continuationCount: 0,
    };

    for (const line of recentLines) {
      try {
        const entry: TranscriptEntry = JSON.parse(line);
        this.processEntry(entry, result);
      } catch (e) {
        continue;
      }
    }

    return result;
  }

  private processEntry(entry: TranscriptEntry, result: ParseResult): void {
    // 实现处理逻辑
  }

  private extractTodos(entry: TranscriptEntry): Todo[] {
    // 实现提取逻辑
    return [];
  }
}

export default TranscriptParser;
```

**交付物**:
- [ ] TypeScript 配置
- [ ] 类型定义文件
- [ ] 渐进式迁移指南
- [ ] 构建脚本

#### Lint 与格式化
**优先级**: 🟡 中 | **难度**: 低

```bash
# 安装工具
npm install --save-dev eslint \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin \
  prettier \
  eslint-config-prettier \
  eslint-plugin-prettier
```

```javascript
// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': 'off',
  },
};
```

```javascript
// .prettierrc.js
module.exports = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 100,
};
```

**交付物**:
- [ ] ESLint 配置
- [ ] Prettier 配置
- [ ] pre-commit hook (husky + lint-staged)
- [ ] CI lint 检查

---

### Week 21-24: Q2 验收

#### 测试覆盖率目标
- [ ] 单元测试覆盖率 > 60%
- [ ] 集成测试覆盖关键流程
- [ ] E2E 测试覆盖 ultrawork 模式

#### 代码质量指标
- [ ] ESLint 零警告
- [ ] TypeScript 覆盖率 > 80%
- [ ] 所有公共 API 有文档

---

## Q3 2025: 智能与自动化 (Week 25-36)

### 目标
- 增强 agent 智能选择
- 实现成本追踪
- 添加自动化测试

### Week 25-28: 智能 Agent 选择

#### Agent 选择器重构
**优先级**: 🔴 高 | **难度**: 高

```typescript
// agents/selector/AgentSelector.ts
interface TaskContext {
  prompt: string;
  complexity: 'low' | 'medium' | 'high';
  domain: string[];
  requiresFiles: string[];
}

interface AgentCandidate {
  agent: AgentMetadata;
  confidence: number;
  estimatedCost: number;
  reasoning: string;
}

interface AgentMetadata {
  name: string;
  model: string;
  cost: 'FREE' | 'CHEAP' | 'EXPENSIVE';
  triggers: TriggerRule[];
  capabilities: string[];
}

interface TriggerRule {
  pattern: RegExp | string;
  confidence: number;
  requiredDomain?: string;
}

class AgentSelector {
  private agents: Map<string, AgentMetadata>;
  private history: Map<string, SelectionHistory>;
  private confidenceCache: LRUCache<string, number>;

  constructor() {
    this.agents = new Map();
    this.history = new Map();
    this.confidenceCache = new LRUCache({ max: 1000 });
  }

  /**
   * 为任务选择最佳 agent
   */
  selectBestAgent(context: TaskContext): AgentCandidate {
    const candidates: AgentCandidate[] = [];

    for (const [name, agent] of this.agents) {
      const confidence = this.calculateConfidence(context, agent);
      if (confidence > 0.3) {
        candidates.push({
          agent,
          confidence,
          estimatedCost: this.estimateCost(agent, context),
          reasoning: this.explainSelection(context, agent, confidence),
        });
      }
    }

    // 按置信度排序
    candidates.sort((a, b) => b.confidence - a.confidence);

    // 考虑成本限制
    return this.applyCostConstraints(candidates, context);
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(context: TaskContext, agent: AgentMetadata): number {
    let baseConfidence = 0.5;

    // 检查触发规则匹配
    for (const trigger of agent.triggers) {
      if (trigger.pattern instanceof RegExp) {
        if (trigger.pattern.test(context.prompt)) {
          baseConfidence = Math.max(baseConfidence, trigger.confidence);
        }
      } else if (context.prompt.includes(trigger.pattern)) {
        baseConfidence = Math.max(baseConfidence, trigger.confidence);
      }
    }

    // 检查领域匹配
    if (trigger.requiredDomain) {
      const domainMatch = context.domain.some(d =>
        d.toLowerCase().includes(trigger.requiredDomain!.toLowerCase())
      );
      if (!domainMatch) {
        baseConfidence *= 0.5;
      }
    }

    // 调整历史成功率
    const history = this.history.get(agent.name);
    if (history) {
      const successRate = history.successes / history.total;
      baseConfidence *= (0.5 + successRate);
    }

    return Math.min(1, Math.max(0, baseConfidence));
  }

  /**
   * 应用成本约束
   */
  private applyCostConstraints(
    candidates: AgentCandidate[],
    context: TaskContext
  ): AgentCandidate {
    // 低复杂度任务优先使用免费/廉价 agent
    if (context.complexity === 'low') {
      const cheapCandidate = candidates.find(c =>
        c.agent.cost === 'FREE' || c.agent.cost === 'CHEAP'
      );
      if (cheapCandidate && cheapCandidate.confidence > 0.6) {
        return cheapCandidate;
      }
    }

    // 返回最高置信度的候选
    return candidates[0] || this.getDefaultAgent();
  }

  /**
   * 记录选择结果
   */
  recordSelection(agentName: string, success: boolean): void {
    if (!this.history.has(agentName)) {
      this.history.set(agentName, {
        successes: 0,
        total: 0,
      });
    }

    const history = this.history.get(agentName)!;
    history.total++;
    if (success) {
      history.successes++;
    }
  }
}

interface SelectionHistory {
  successes: number;
  total: number;
}

export default AgentSelector;
```

**交付物**:
- [ ] `AgentSelector` 类实现
- [ ] 触发规则配置化
- [ ] 历史记录持久化
- [ ] A/B 测试框架

---

### Week 29-32: 成本追踪系统

#### 成本监控
**优先级**: 🟡 中 | **难度**: 中

```typescript
// monitoring/CostTracker.ts
interface ModelPricing {
  input: number;  // per 1K tokens
  output: number; // per 1K tokens
}

interface CostRecord {
  timestamp: number;
  agent: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

interface CostReport {
  byAgent: Record<string, AgentCost>;
  byModel: Record<string, ModelCost>;
  total: number;
  session: string;
}

interface AgentCost {
  calls: number;
  tokens: number;
  cost: number;
}

interface ModelCost {
  calls: number;
  tokens: number;
  cost: number;
}

class CostTracker {
  private static MODEL_PRICING: Record<string, ModelPricing> = {
    'haiku': { input: 0.00025, output: 0.00125 },
    'sonnet': { input: 0.003, output: 0.015 },
    'opus': { input: 0.015, output: 0.075 },
  };

  private records: CostRecord[] = [];
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  /**
   * 记录 agent 调用成本
   */
  recordCall(
    agent: string,
    model: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    const pricing = CostTracker.MODEL_PRICING[model];
    if (!pricing) {
      console.warn(`Unknown model: ${model}`);
      return 0;
    }

    const cost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1000;

    this.records.push({
      timestamp: Date.now(),
      agent,
      model,
      inputTokens,
      outputTokens,
      cost,
    });

    return cost;
  }

  /**
   * 生成成本报告
   */
  generateReport(): CostReport {
    const byAgent: Record<string, AgentCost> = {};
    const byModel: Record<string, ModelCost> = {};
    let total = 0;

    for (const record of this.records) {
      // 按 agent 统计
      if (!byAgent[record.agent]) {
        byAgent[record.agent] = { calls: 0, tokens: 0, cost: 0 };
      }
      byAgent[record.agent].calls++;
      byAgent[record.agent].tokens += record.inputTokens + record.outputTokens;
      byAgent[record.agent].cost += record.cost;

      // 按 model 统计
      if (!byModel[record.model]) {
        byModel[record.model] = { calls: 0, tokens: 0, cost: 0 };
      }
      byModel[record.model].calls++;
      byModel[record.model].tokens += record.inputTokens + record.outputTokens;
      byModel[record.model].cost += record.cost;

      total += record.cost;
    }

    return {
      byAgent,
      byModel,
      total,
      session: this.sessionId,
    };
  }

  /**
   * 检查预算限制
   */
  checkBudget(limit: number): boolean {
    const total = this.records.reduce((sum, r) => sum + r.cost, 0);
    return total < limit;
  }

  /**
   * 获取成本警告
   */
  getWarnings(thresholds: { agent?: number; session?: number }): string[] {
    const warnings: string[] = [];
    const report = this.generateReport();

    if (thresholds.session && report.total > thresholds.session) {
      warnings.push(`Session cost $${report.total.toFixed(4)} exceeds $${thresholds.session}`);
    }

    if (thresholds.agent) {
      for (const [agent, data] of Object.entries(report.byAgent)) {
        if (data.cost > thresholds.agent) {
          warnings.push(`${agent} cost $${data.cost.toFixed(4)} exceeds $${thresholds.agent}`);
        }
      }
    }

    return warnings;
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default CostTracker;
```

**交付物**:
- [ ] `CostTracker` 实现
- [ ] 成本报告 CLI
- [ ] 预算警告系统
- [ ] 历史成本数据

---

### Week 33-36: Q3 验收

#### 智能化指标
- [ ] Agent 选择准确率 > 90%
- [ ] 成本追踪 100% 覆盖
- [ ] 历史学习生效

---

## Q4 2025: 生态与扩展 (Week 37-48)

### 目标
- 实现插件系统
- 支持自定义 agent
- 建立开发者生态

### Week 37-40: 插件系统

#### 插件架构
**优先级**: 🟡 中 | **难度**: 高

```typescript
// plugin-system/PluginManager.ts
interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  main: string;
  hooks?: HookDefinition[];
  agents?: AgentDefinition[];
  dependencies?: Record<string, string>;
}

interface HookDefinition {
  name: string;
  event: string;
  handler: string;
  priority?: number;
}

interface AgentDefinition {
  name: string;
  file: string;
  metadata: Record<string, any>;
}

interface Plugin {
  manifest: PluginManifest;
  path: string;
  loaded: boolean;
  hooks: Map<string, Function>;
  agents: Map<string, any>;
}

class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private hooks: Map<string, Array<{ fn: Function; priority: number }>> = new Map();

  /**
   * 加载插件
   */
  async loadPlugin(pluginPath: string): Promise<Plugin> {
    const manifestPath = path.join(pluginPath, 'plugin.json');
    const manifest: PluginManifest = JSON.parse(
      fs.readFileSync(manifestPath, 'utf8')
    );

    // 检查依赖
    await this.checkDependencies(manifest.dependencies);

    const plugin: Plugin = {
      manifest,
      path: pluginPath,
      loaded: false,
      hooks: new Map(),
      agents: new Map(),
    };

    // 加载 hooks
    if (manifest.hooks) {
      for (const hookDef of manifest.hooks) {
        const hookFile = path.join(pluginPath, hookDef.handler);
        const hookModule = require(hookFile);
        plugin.hooks.set(hookDef.name, hookModule);
        this.registerHook(hookDef.event, hookModule, hookDef.priority);
      }
    }

    // 加载 agents
    if (manifest.agents) {
      for (const agentDef of manifest.agents) {
        const agentFile = path.join(pluginPath, agentDef.file);
        const agent = await this.loadAgent(agentFile);
        plugin.agents.set(agentDef.name, agent);
      }
    }

    plugin.loaded = true;
    this.plugins.set(manifest.name, plugin);

    console.log(`Plugin loaded: ${manifest.name} v${manifest.version}`);
    return plugin;
  }

  /**
   * 注册 hook
   */
  registerHook(event: string, handler: Function, priority = 10): void {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }
    this.hooks.get(event)!.push({ fn: handler, priority });
    // 按优先级排序
    this.hooks.get(event)!.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 触发 hook
   */
  async triggerHook(event: string, data: any): Promise<any> {
    const hooks = this.hooks.get(event);
    if (!hooks) {
      return data;
    }

    let result = data;
    for (const { fn } of hooks) {
      result = await fn(result);
    }
    return result;
  }

  /**
   * 卸载插件
   */
  async unloadPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin not found: ${name}`);
    }

    // 清理 hooks
    for (const [hookName, hookFn] of plugin.hooks) {
      this.unregisterHook(hookName, hookFn);
    }

    plugin.loaded = false;
    this.plugins.delete(name);

    console.log(`Plugin unloaded: ${name}`);
  }

  private async checkDependencies(dependencies?: Record<string, string>): Promise<void> {
    if (!dependencies) return;

    for (const [name, version] of Object.entries(dependencies)) {
      // 检查依赖是否满足
      // ...
    }
  }

  private unregisterHook(event: string, handler: Function): void {
    const hooks = this.hooks.get(event);
    if (hooks) {
      const index = hooks.findIndex(h => h.fn === handler);
      if (index >= 0) {
        hooks.splice(index, 1);
      }
    }
  }

  private async loadAgent(agentFile: string): Promise<any> {
    // 加载 agent 文件
    const content = fs.readFileSync(agentFile, 'utf8');
    // 解析 frontmatter 和内容
    // 返回 agent 对象
  }

  /**
   * 获取所有已加载的 agents
   */
  getAvailableAgents(): string[] {
    const agents: string[] = [];

    // 内置 agents
    agents.push(...getBuiltinAgents());

    // 插件提供的 agents
    for (const plugin of this.plugins.values()) {
      if (plugin.loaded) {
        agents.push(...Array.from(plugin.agents.keys()));
      }
    }

    return agents;
  }
}

export default PluginManager;
```

**交付物**:
- [ ] `PluginManager` 实现
- [ ] 插件开发文档
- [ ] 示例插件
- [ ] 插件市场基础设施

---

### Week 41-44: Agent 动态加载

#### Agent 发现机制
**优先级**: 🟡 中 | **难度**: 中

```typescript
// agents/AgentLoader.ts
interface AgentInfo {
  name: string;
  file: string;
  metadata: AgentMetadata;
  valid: boolean;
  errors: string[];
}

class AgentLoader {
  private agentsDir: string;
  private cache: Map<string, AgentInfo> = new Map();

  constructor(agentsDir: string) {
    this.agentsDir = agentsDir;
  }

  /**
   * 发现所有 agents
   */
  async discoverAgents(): Promise<AgentInfo[]> {
    const files = await glob(path.join(this.agentsDir, '**/*.md'));
    const agents: AgentInfo[] = [];

    for (const file of files) {
      const info = await this.loadAgentInfo(file);
      agents.push(info);
      this.cache.set(info.name, info);
    }

    return agents;
  }

  /**
   * 加载 agent 信息
   */
  private async loadAgentInfo(file: string): Promise<AgentInfo> {
    const content = fs.readFileSync(file, 'utf8');
    const errors: string[] = [];

    // 解析 frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---/);
    if (!frontmatterMatch) {
      return {
        name: path.basename(file),
        file,
        metadata: {} as AgentMetadata,
        valid: false,
        errors: ['No frontmatter found'],
      };
    }

    let metadata: AgentMetadata;
    try {
      metadata = yaml.parse(frontmatterMatch[1]);
    } catch (e) {
      return {
        name: path.basename(file),
        file,
        metadata: {} as AgentMetadata,
        valid: false,
        errors: [`Invalid YAML: ${e.message}`],
      };
    }

    // 验证必需字段
    if (!metadata.name) {
      errors.push('Missing required field: name');
    }
    if (!metadata.model) {
      errors.push('Missing required field: model');
    }

    return {
      name: metadata.name || path.basename(file),
      file,
      metadata,
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 获取 agent
   */
  async getAgent(name: string): Promise<AgentInfo | null> {
    if (this.cache.has(name)) {
      return this.cache.get(name)!;
    }

    const agents = await this.discoverAgents();
    return agents.find(a => a.name === name) || null;
  }
}

export default AgentLoader;
```

**交付物**:
- [ ] `AgentLoader` 实现
- [ ] Agent 验证框架
- [ ] 热重载支持

---

### Week 45-48: Q4 验收与 2026 规划

#### 年度总结
- [ ] 所有 Q1-Q4 目标达成
- [ ] 性能指标总结
- [ ] 用户反馈收集
- [ ] 2026 路线图规划

---

## 成功指标汇总

### 性能指标

| 指标 | 当前 | Q1 目标 | Q2 目标 | Q3 目标 | Q4 目标 |
|------|------|---------|---------|---------|---------|
| Hook 平均延迟 | ~100ms | < 20ms | < 15ms | < 10ms | < 10ms |
| Transcript 解析 (1000 lines) | ~500ms | < 10ms | < 5ms | < 5ms | < 5ms |
| Agent 选择准确率 | ~70% | 75% | 85% | 90% | 95% |

### 质量指标

| 指标 | 当前 | Q1 目标 | Q2 目标 | Q3 目标 | Q4 目标 |
|------|------|---------|---------|---------|---------|
| 测试覆盖率 | 0% | 20% | 60% | 75% | 80% |
| 类型覆盖率 | 0% | JSDoc | TS 50% | TS 80% | TS 100% |
| 文档完整性 | 60% | 80% | 90% | 95% | 100% |
| ESLint 警告 | N/A | 0 | 0 | 0 | 0 |

### 用户体验指标

| 指标 | 当前 | Q1 目标 | Q2 目标 | Q3 目标 | Q4 目标 |
|------|------|---------|---------|---------|---------|
| 配置错误率 | 未知 | < 10% | < 5% | < 2% | < 1% |
| 任务完成率 | ~85% | 90% | 95% | 98% | 99% |
| 新用户引导完成率 | 0% | 50% | 70% | 80% | 90% |

---

## 风险与缓解

### 技术风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| TypeScript 迁移破坏现有功能 | 中 | 高 | 渐进式迁移，保留 JS 兼容 |
| 性能优化引入新 bug | 中 | 中 | 全面的回归测试 |
| 插件系统安全性问题 | 低 | 高 | 沙箱隔离，权限控制 |
| Agent 选择准确率不达标 | 中 | 中 | A/B 测试，持续调优 |

### 资源风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 开发时间不足 | 中 | 高 | 优先级排序，灵活调整 |
| 维护负担增加 | 高 | 中 | 自动化测试，文档完善 |
| 社区贡献质量不一 | 中 | 低 | 严格的 PR 审查流程 |

---

## 附录

### A. 术语表

| 术语 | 定义 |
|------|------|
| **Agent** | 专门化的 AI 实体，负责特定领域的任务 |
| **Hook** | 在特定事件发生时触发的函数 |
| **Ultrawork** | 强制任务完成模式，类似 Sisyphus |
| **Orchestrator** | 主协调 agent，负责任务分类和委派 |
| **Transcript** | 会话历史记录的 JSON 文件 |

### B. 相关资源

- [Claude Code 文档](https://code.claude.com/docs)
- [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode) - 灵感来源
- [Agent 优化最佳实践](AGENTS.md)

### C. 贡献指南

参见 [CONTRIBUTING.md](CONTRIBUTING.md) (待创建)

---

**文档版本**: 1.0.0
**最后更新**: 2025-01-11
**维护者**: oh-my-claude-code 团队
