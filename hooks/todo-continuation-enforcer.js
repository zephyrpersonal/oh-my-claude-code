#!/usr/bin/env node
/**
 * Todo Continuation Enforcer Hook (Sisyphus Mode)
 *
 * 当有待完成的任务时，阻止 Claude 停止工作。
 * 当 Claude 尝试在有未完成任务时停止，此 hook 会阻止停止
 * 并提供继续工作的原因。
 *
 * Hook Type: Stop
 * Output: JSON with decision to block or allow stopping
 *
 * 基于 oh-my-opencode 的 todo-continuation-enforcer
 */

const fs = require('fs');
const config = require('../config/index');
const patterns = require('../utils/patterns');
const { generateContinuationPrompt, parseTodosFromData } = require('../utils/progress-reporter');

/**
 * 从 transcript 中提取 max-iterations 参数
 */
function extractMaxIterations(transcriptContent) {
  const match = transcriptContent.match(patterns.ULTRAWORK_PARAMS.MAX_ITERATIONS);
  return match ? parseInt(match[1], 10) : config.ULTRAWORK.DEFAULT_MAX_ITERATIONS;
}

/**
 * 从 transcript 中提取 completion-signal 参数
 */
function extractCompletionSignal(transcriptContent) {
  const match = transcriptContent.match(patterns.ULTRAWORK_PARAMS.COMPLETION_SIGNAL);
  return match ? match[1] : null;
}

/**
 * 解析 transcript 中的 todos
 */
function parseTranscriptTodos(lines) {
  const allTodos = [];
  let incompleteTodos = [];
  let ultraworkActive = false;
  let continuationCount = 0;
  let completionSignalFound = false;

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      const content = JSON.stringify(entry);

      // 检测 ultrawork 关键词
      if (!ultraworkActive) {
        for (const keyword of config.ULTRAWORK.KEYWORDS) {
          if (content.includes(keyword)) {
            ultraworkActive = true;
            break;
          }
        }
      }

      // 统计 continuation 次数
      if (patterns.TRANSCRIPT_PATTERNS.CONTINUATION_PROMPT.test(content)) {
        continuationCount++;
      }

      // 解析 todo 状态
      if (entry.type === 'tool_use' || entry.type === 'tool_result') {
        const todos = parseTodosFromData(entry);
        if (todos.length > 0) {
          allTodos.push(...todos);

          // 检查未完成的 todos
          const pending = todos.filter(t => t.status === 'pending' || t.status === 'in_progress');
          if (pending.length > 0) {
            incompleteTodos = pending;
          }
        }
      }
    } catch (e) {
      // 跳过无效的 JSON 行
      continue;
    }
  }

  return {
    allTodos,
    incompleteTodos,
    ultraworkActive,
    continuationCount,
    completionSignalFound,
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

    // 检查 stop_hook_active 是否为 true（防止无限循环）
    if (data.stop_hook_active) {
      // 允许停止以防止无限继续
      process.exit(0);
    }

    // 读取 transcript 以检查未完成的 todos 和 ultrawork 模式
    const transcriptPath = data.transcript_path;
    if (!transcriptPath || !fs.existsSync(transcriptPath)) {
      // 没有 transcript 可用，允许停止
      process.exit(0);
    }

    // 读取并解析 transcript
    const transcriptContent = fs.readFileSync(transcriptPath, 'utf8');
    const lines = transcriptContent.trim().split('\n');

    // 提取参数
    const maxContinuations = extractMaxIterations(transcriptContent);
    const completionSignal = extractCompletionSignal(transcriptContent);

    // 解析 transcript
    const result = parseTranscriptTodos(lines);

    // 检查 completion-signal
    if (completionSignal && result.ultraworkActive) {
      const signalFound = transcriptContent.includes(completionSignal);
      if (signalFound) {
        result.completionSignalFound = true;
      }
    }

    // 检查是否应该强制继续
    const shouldContinue =
      result.ultraworkActive &&
      result.incompleteTodos.length > 0 &&
      !result.completionSignalFound;

    if (!shouldContinue) {
      // 允许停止
      process.exit(0);
    }

    // 检查是否达到最大继续次数
    if (result.continuationCount >= maxContinuations) {
      console.error(`Max continuation limit (${maxContinuations}) reached. Allowing stop.`);
      process.exit(0);
    }

    // 阻止停止并提供继续原因
    const reason = generateContinuationPrompt(
      result.incompleteTodos,
      result.allTodos,
      result.continuationCount,
      maxContinuations
    );

    const output = {
      decision: 'block',
      reason,
    };

    console.log(JSON.stringify(output));
    process.exit(0);
  } catch (error) {
    // 出错时允许停止以防止阻塞
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
