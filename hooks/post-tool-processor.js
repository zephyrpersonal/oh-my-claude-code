#!/usr/bin/env node
/**
 * 统一的 PostToolUse Hook 处理器
 *
 * 合并 comment-checker 和 auto-diagnostics 的功能，
 * 通过并行执行提升性能。
 */

const fs = require('fs');
const path = require('path');
const config = require('../config/index');
const { getFileLanguage, getCommentPatterns } = require('../config/index');
const patterns = require('../utils/patterns');

/**
 * 检查注释
 */
function checkComments(filePath, content) {
  const language = getFileLanguage(filePath);
  if (!language) {
    return null;
  }

  const commentPatterns = getCommentPatterns(language);
  if (!commentPatterns || commentPatterns.length === 0) {
    return null;
  }

  const warnings = [];

  // 计算注释比例
  let commentChars = 0;
  for (const pattern of commentPatterns) {
    const matches = content.match(pattern) || [];
    for (const match of matches) {
      commentChars += match.length;
    }
  }

  const totalChars = content.length;
  const commentRatio = totalChars > 0 ? commentChars / totalChars : 0;

  if (commentRatio > config.COMMENT_CHECKER.THRESHOLD) {
    warnings.push(`High comment ratio: ${(commentRatio * 100).toFixed(1)}% of content is comments`);
  }

  // 检查 AI 风格注释
  const lowerContent = content.toLowerCase();
  const aiIndicators = config.COMMENT_CHECKER.AI_INDICATORS.filter(indicator =>
    lowerContent.includes(indicator)
  );

  if (aiIndicators.length >= 3) {
    warnings.push(`Detected ${aiIndicators.length} AI-style comment phrases`);
  }

  if (warnings.length === 0) {
    return null;
  }

  return {
    type: 'comment-checker',
    warnings,
  };
}

/**
 * 检查诊断
 */
function checkDiagnostics(filePath) {
  const language = getFileLanguage(filePath);
  if (!language) {
    return null;
  }

  return {
    type: 'auto-diagnostics',
    message: `File modified: ${filePath}\n\nRun \`lsp_diagnostics\` on this file to check for errors before proceeding.`,
  };
}

/**
 * 格式化警告消息
 */
function formatWarning(warning) {
  if (warning.type === 'comment-checker') {
    return `[COMMENT CHECKER WARNING]\n${warning.warnings.join('\n')}\n\nGuidelines:\n- Avoid obvious comments that just repeat what the code does\n- Comments should explain WHY, not WHAT\n- Let the code be self-documenting when possible\n- Remove redundant comments before finishing`;
  } else if (warning.type === 'auto-diagnostics') {
    return `[AUTO-DIAGNOSTICS REMINDER]\n${warning.message}`;
  }
  return '';
}

/**
 * 主处理函数
 */
async function processPostToolUse(data) {
  const toolName = data.tool_name || '';

  // 只处理 write/edit 工具
  if (!['write', 'edit', 'Write', 'Edit'].includes(toolName)) {
    return null;
  }

  const filePath = data.tool_input?.filePath || data.tool_input?.file_path || '';
  const content = data.tool_input?.content || data.tool_input?.newString || '';

  if (!filePath || !content) {
    return null;
  }

  // 并行执行检查
  const results = await Promise.all([
    Promise.resolve(checkComments(filePath, content)),
    Promise.resolve(checkDiagnostics(filePath)),
  ]);

  // 过滤空结果
  const warnings = results.filter(r => r !== null);

  if (warnings.length === 0) {
    return null;
  }

  // 合并消息
  const additionalContext = warnings.map(w => formatWarning(w)).join('\n\n---\n\n');

  return {
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext,
    },
  };
}

/**
 * 从 stdin 读取输入
 */
function readStdin() {
  return new Promise((resolve, reject) => {
    let input = '';

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      input += chunk;
    });

    process.stdin.on('end', () => {
      resolve(input);
    });

    process.stdin.on('error', reject);
  });
}

/**
 * 主入口
 */
async function main() {
  try {
    const input = await readStdin();

    if (!input) {
      process.exit(0);
    }

    const data = JSON.parse(input);
    const result = await processPostToolUse(data);

    if (result) {
      console.log(JSON.stringify(result));
    }

    process.exit(0);
  } catch (error) {
    console.error(`Hook error: ${error.message}`);
    process.exit(1);
  }
}

// 处理空 stdin
process.stdin.on('close', () => {
  // 由 readStdin Promise 处理
});

// 运行
main();
