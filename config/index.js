/**
 * oh-my-claude-code 集中配置管理
 *
 * 所有配置常量集中管理，便于维护和用户自定义
 */

/**
 * Ultrawork 模式配置
 */
const ULTRAWORK = {
  // 默认最大迭代次数
  DEFAULT_MAX_ITERATIONS: 50,

  // 默认搜索深度
  DEFAULT_THOROUGHNESS: 'thorough',

  // 有效的搜索深度选项
  VALID_THOROUGHNESS: ['quick', 'medium', 'thorough'],

  // 激活关键词
  KEYWORDS: ['ulw', 'ultrawork', 'uw'],

  // 参数正则表达式
  PARAM_PATTERNS: {
    MAX_ITERATIONS: /--max-iterations\s+(\d+)/i,
    THOROUGHNESS: /--thoroughness\s+(quick|medium|thorough)/i,
    NO_DIAGNOSTICS: /--no-diagnostics/i,
    COMPLETION_SIGNAL: /--completion-signal\s+["']([^"']+)["']/i,
  },

  // 完成信号关键词
  COMPLETION_SIGNALS: [
    'all tasks complete',
    'all tests pass',
    'build successful',
    'deployment complete',
  ],
};

/**
 * 注释检查器配置
 */
const COMMENT_CHECKER = {
  // 注释比例阈值（超过此比例会警告）
  THRESHOLD: 0.40,

  // AI 风格注释指示词
  AI_INDICATORS: [
    'this function',
    'this method',
    'this variable',
    'we need to',
    'we use',
    'here we',
    'this is used to',
    'this handles',
    'this checks',
    'this returns',
    'initialize',
    'set up',
    'configure',
  ],

  // 支持的注释模式（使用 RegExp 构造函数避免 // 被解析为注释）
  COMMENT_PATTERNS: {
    js: [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//gm],
    ts: [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//gm],
    py: [/#.*$/gm, /"""[\s\S]*?"""/gm, /'''[\s\S]*?'''/gm],
    rb: [/#.*$/gm, /=begin[\s\S]*?=end/gm],
    sh: [/#.*$/gm],
    css: [/\/\*[\s\S]*?\*\//gm],
    html: [/<!--[\s\S]*?-->/gm],
  },
};

/**
 * 诊断配置
 */
const DIAGNOSTICS = {
  // 支持的代码文件扩展名
  CODE_EXTENSIONS: [
    'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
    'py', 'pyw',
    'rb', 'rake',
    'go',
    'rs',
    'java', 'kt', 'kts',
    'c', 'cpp', 'cc', 'cxx', 'h', 'hpp',
    'cs',
    'swift',
    'php',
    'vue', 'svelte',
  ],

  // 自动诊断默认启用
  ENABLED_BY_DEFAULT: true,
};

/**
 * 性能配置
 */
const PERFORMANCE = {
  // Transcript 反向扫描行数
  TRANSCRIPT_SCAN_LINES: 100,

  // Hook 超时时间（毫秒）
  HOOK_TIMEOUT_MS: 5000,

  // 状态缓存 TTL（毫秒）
  STATE_CACHE_TTL: 3600000, // 1 hour

  // 状态清理间隔（毫秒）
  STATE_CLEANUP_INTERVAL: 86400000, // 24 hours
};

/**
 * Agent 配置
 */
const AGENTS = {
  // 内置 agent 列表
  BUILTIN: [
    'orchestrator',
    'explore',
    'librarian',
    'oracle',
    'frontend-ui-ux-engineer',
    'document-writer',
    'multimodal-looker',
  ],

  // 成本等级
  COST_LEVELS: {
    FREE: 'haiku',
    CHEAP: 'sonnet',
    EXPENSIVE: 'opus',
  },

  // Agent 选择置信度阈值
  CONFIDENCE_THRESHOLD: 0.7,
};

/**
 * 文件扩展名映射
 */
const FILE_EXTENSIONS = {
  // JavaScript/TypeScript
  js: 'js', jsx: 'js', mjs: 'js', cjs: 'js',
  ts: 'ts', tsx: 'ts', mts: 'ts', cts: 'ts',

  // Python
  py: 'py', pyw: 'py',

  // Ruby
  rb: 'rb', rake: 'rb',

  // Shell
  sh: 'sh', bash: 'sh', zsh: 'sh',

  // CSS
  css: 'css', scss: 'css', less: 'css',

  // HTML
  html: 'html', htm: 'html', vue: 'html', svelte: 'html',
};

/**
 * 进度报告配置
 */
const PROGRESS_REPORT = {
  // 进度条宽度（字符）
  BAR_WIDTH: 40,

  // 进度条填充字符
  FILLED_CHAR: '█',

  // 进度条空白字符
  EMPTY_CHAR: '░',

  // 分隔线字符
  SEPARATOR: '━',

  // 是否显示时间估算
  SHOW_TIME_ESTIMATE: true,

  // 平均任务时间（秒，用于估算）
  AVERAGE_TASK_TIME_SECONDS: 120,
};

/**
 * 用户配置默认值
 */
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

/**
 * 验证配置值
 */
function validateConfig() {
  const errors = [];

  // 验证 Ultrawork 配置
  if (ULTRAWORK.DEFAULT_MAX_ITERATIONS < 1 || ULTRAWORK.DEFAULT_MAX_ITERATIONS > 1000) {
    errors.push('ULTRAWORK.DEFAULT_MAX_ITERATIONS must be between 1 and 1000');
  }

  if (!ULTRAWORK.VALID_THOROUGHNESS.includes(ULTRAWORK.DEFAULT_THOROUGHNESS)) {
    errors.push(`ULTRAWORK.DEFAULT_THOROUGHNESS must be one of: ${ULTRAWORK.VALID_THOROUGHNESS.join(', ')}`);
  }

  // 验证注释检查器配置
  if (COMMENT_CHECKER.THRESHOLD < 0 || COMMENT_CHECKER.THRESHOLD > 1) {
    errors.push('COMMENT_CHECKER.THRESHOLD must be between 0 and 1');
  }

  // 验证性能配置
  if (PERFORMANCE.TRANSCRIPT_SCAN_LINES < 10) {
    errors.push('PERFORMANCE.TRANSCRIPT_SCAN_LINES must be at least 10');
  }

  if (PERFORMANCE.HOOK_TIMEOUT_MS < 100) {
    errors.push('PERFORMANCE.HOOK_TIMEOUT_MS must be at least 100');
  }

  return errors;
}

/**
 * 获取文件的语言类型
 */
function getFileLanguage(filePath) {
  if (!filePath) return null;

  const ext = filePath.split('.').pop().toLowerCase();
  return FILE_EXTENSIONS[ext] || null;
}

/**
 * 获取注释模式
 */
function getCommentPatterns(language) {
  return COMMENT_CHECKER.COMMENT_PATTERNS[language] || [];
}

module.exports = {
  ULTRAWORK,
  COMMENT_CHECKER,
  DIAGNOSTICS,
  PERFORMANCE,
  AGENTS,
  FILE_EXTENSIONS,
  PROGRESS_REPORT,
  DEFAULT_USER_CONFIG,
  validateConfig,
  getFileLanguage,
  getCommentPatterns,
};
