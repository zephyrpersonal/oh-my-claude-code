/**
 * 预编译正则表达式模式
 *
 * 将所有正则表达式集中定义并预编译，提升性能
 */

const config = require('../config/index');

/**
 * Ultrawork 检测模式
 */
const ULTRAWORK_PATTERN = new RegExp(
  `\\b(${config.ULTRAWORK.KEYWORDS.join('|')})\\b`,
  'i'
);

/**
 * Ultrawork 参数解析模式
 */
const ULTRAWORK_PARAMS = {
  MAX_ITERATIONS: /--max-iterations\s+(\d+)/i,
  THOROUGHNESS: /--thoroughness\s+(quick|medium|thorough)/i,
  NO_DIAGNOSTICS: /--no-diagnostics/i,
  COMPLETION_SIGNAL: /--completion-signal\s+["']([^"']+)["']/i,
};

/**
 * Transcript 解析模式
 */
const TRANSCRIPT_PATTERNS = {
  // Ultrawork 关键词检测（在 JSON 字符串中）
  ULTRAWORK_KEYWORD: new RegExp(
    `(${config.ULTRAWORK.KEYWORDS.join('|')})`,
    'i'
  ),

  // 继续提示检测
  CONTINUATION_PROMPT: /Continue working on the next pending task/i,

  // Todo 状态检测
  PENDING_TODO: /"status":\s*"pending"/i,
  IN_PROGRESS_TODO: /"status":\s*"in_progress"/i,
  COMPLETED_TODO: /"status":\s*"completed"/i,

  // Todo 内容提取
  TODO_CONTENT: /"content"\s*:\s*"([^"]+)"/i,

  // Tool use 类型检测
  TOOL_USE: /"type":\s*"tool_use"/i,
  TOOL_RESULT: /"type":\s*"tool_result"/i,
};

/**
 * 注释模式
 */
const COMMENT_PATTERNS = {
  // JavaScript/TypeScript
  JS_SINGLE_LINE: /\/\/.*$/gm,
  JS_MULTI_LINE: /\/\*[\s\S]*?\*\//gm,

  // Python
  PY_SINGLE_LINE: /#.*$/gm,
  PY_TRIPLE_DOUBLE: /"""[\s\S]*?"""/gm,
  PY_TRIPLE_SINGLE: /'''[\s\S]*?'''/gm,

  // Ruby
  RB_SINGLE_LINE: /#.*$/gm,
  RB_MULTI_LINE: /=begin[\s\S]*?=end/gm,

  // Shell
  SH_SINGLE_LINE: /#.*$/gm,

  // CSS
  CSS_COMMENT: /\/\*[\s\S]*?\*\//gm,

  // HTML
  HTML_COMMENT: /<!--[\s\S]*?-->/gm,
};

/**
 * AI 风格注释指示词模式
 */
const AI_COMMENT_PATTERNS = config.COMMENT_CHECKER.AI_INDICATORS.map(
  indicator => new RegExp(`\\b${indicator}\\b`, 'i')
);

/**
 * 文件扩展名模式
 */
const FILE_EXTENSION_PATTERNS = {
  // JavaScript
  JS: /\.(jsx?|mjs|cjs)$/i,
  TS: /\.(tsx?|mts|cts)$/i,

  // Python
  PY: /\.pyw?$/i,

  // Ruby
  RB: /\.(rb|rake)$/i,

  // Shell
  SH: /\.(sh|bash|zsh)$/i,

  // CSS
  CSS: /\.(css|scss|less|sass)$/i,

  // HTML
  HTML: /\.(html?|vue|svelte)$/i,

  // JSON
  JSON: /\.json$/i,

  // Markdown
  MD: /\.md$/i,
};

/**
 * 进度报告模式
 */
const PROGRESS_PATTERNS = {
  // 任务状态标记
  CHECKBOX: /^\s*[-*+]\s+\[([ x])\]\s+/gm,

  // 百分比
  PERCENTAGE: /(\d+)%/,

  // 数字
  NUMBER: /\d+/,
};

/**
 * Agent 触发模式
 */
const AGENT_TRIGGER_PATTERNS = {
  // Explore 触发词
  EXPLORE: [
    /\b(where|find|which|locate)\b.*\b(code|file|implementation|function|class)\b/i,
    /\bhow\b.+?\b(works?|implemented?|handled?)\b/i,
    /\b(show|tell|get)\b.+?\b(location|path|position)\b/i,
  ],

  // Librarian 触发词
  LIBRARIAN: [
    /\b(best practices?|how to use|documentation|examples?)\b/i,
    /\b(library|package|framework|npm|pip)\b/i,
    /\btutorial\b/i,
  ],

  // Oracle 触发词
  ORACLE: [
    /\b(architecture|design|trade.?off)\b/i,
    /\b(refactor|rewrite|restructure)\b/i,
    /\b(security|performance|scalability)\b.*\b(analyze|review)\b/i,
  ],

  // Frontend UI/UX 触发词
  FRONTEND: [
    /\b(style|css|layout|animation|responsive)\b/i,
    /\b(ui|ux|design|visual|appearance)\b/i,
  ],

  // Document Writer 触发词
  DOCUMENT: [
    /\b(write|create|update)\b.*(doc|readme|guide|tutorial)\b/i,
    /\bdocumentation\b/i,
  ],

  // Multimodal Looker 触发词
  MULTIMODAL: [
    /\.(png|jpe?g|gif|pdf|svg)$/i,
    /\b(screenshot|image|picture|photo|diagram|chart)\b/i,
  ],
};

/**
 * 成本追踪模式
 */
const COST_PATTERNS = {
  // Token 使用检测
  TOKEN_COUNT: /(\d+)\s*(token|tokens)/i,

  // 成本检测
  COST_AMOUNT: /\$[\d.]+/,

  // 模型名称
  MODEL_NAME: /\b(haiku|sonnet|opus)\b/i,
};

/**
 * 错误模式
 */
const ERROR_PATTERNS = {
  // JavaScript 错误
  JS_ERROR: /(?:Error|TypeError|ReferenceError|SyntaxError):/i,

  // Python 错误
  PY_ERROR: /(?:Exception|Error|Traceback)/i,

  // Git 错误
  GIT_ERROR: /error:|fatal:|failed/i,

  // NPM 错误
  NPM_ERROR: /npm ERR!/i,

  // 构建错误
  BUILD_ERROR: /compilation error|build failed/i,
};

/**
 * Git 相关模式
 */
const GIT_PATTERNS = {
  // Git 状态
  STATUS: /^\s*[MADRCU][MADRCU]?\s+/m,

  // Branch 名称
  BRANCH: /^[\s*]*\((?:HEAD )?detached (?:at|from)?|[\s*]*\(on branch|^\* /m,

  // Commit hash
  COMMIT_HASH: /^[a-f0-9]{7,40}$/m,

  // 远程分支
  REMOTE_BRANCH: /remotes\/[\w-]+\/[\w-]+/,
};

/**
 * LSP/Language Server 模式
 */
const LSP_PATTERNS = {
  // 诊断错误
  DIAGNOSTIC_ERROR: /error/i,

  // 诊断警告
  DIAGNOSTIC_WARNING: /warning/i,

  // 诊断信息
  DIAGNOSTIC_INFO: /info/i,

  // 诊断提示
  DIAGNOSTIC_HINT: /hint/i,

  // 位置信息
  LOCATION: /:\d+:\d+/,
};

/**
 * 测试模式
 */
const TEST_PATTERNS = {
  // 测试文件路径
  TEST_FILE: /(__tests?__|\.spec\.|\.test\.)/i,

  // 测试框架关键词
  TEST_KEYWORDS: /\b(describe|it|test|expect|assert|should)\b/i,

  // 断言
  ASSERTION: /\b(to(?:Be|Equal|Have)|assert\.|expect\()\b/i,

  // 跳过标记
  SKIP: /\.(skip|only)\b/i,
};

/**
 * 匹配任意模式
 */
function matchAny(text, patterns) {
  if (!Array.isArray(patterns)) {
    patterns = [patterns];
  }

  for (const pattern of patterns) {
    if (pattern instanceof RegExp) {
      if (pattern.test(text)) {
        return true;
      }
    } else if (typeof pattern === 'string') {
      if (text.includes(pattern)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 获取所有匹配
 */
function getAllMatches(text, pattern) {
  const matches = [];
  let match;

  while ((match = pattern.exec(text)) !== null) {
    matches.push({
      full: match[0],
      groups: match.slice(1),
      index: match.index,
    });
  }

  return matches;
}

/**
 * 清理字符串中的特殊字符
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  ULTRAWORK_PATTERN,
  ULTRAWORK_PARAMS,
  TRANSCRIPT_PATTERNS,
  COMMENT_PATTERNS,
  AI_COMMENT_PATTERNS,
  FILE_EXTENSION_PATTERNS,
  PROGRESS_PATTERNS,
  AGENT_TRIGGER_PATTERNS,
  COST_PATTERNS,
  ERROR_PATTERNS,
  GIT_PATTERNS,
  LSP_PATTERNS,
  TEST_PATTERNS,
  matchAny,
  getAllMatches,
  escapeRegex,
};
