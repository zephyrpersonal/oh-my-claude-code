#!/usr/bin/env node
/**
 * Ultrawork Keyword Detector Hook
 *
 * 检测 'ulw', 'ultrawork', 或 'uw' 关键词在用户提示词中
 * 并注入 ultrawork 模式指令和可选参数。
 *
 * 支持的参数:
 *   --max-iterations N     最大继续尝试次数 (默认: 50)
 *   --thoroughness LEVEL   搜索深度: quick|medium|thorough (默认: thorough)
 *   --no-diagnostics       禁用自动诊断提醒
 *   --completion-signal S  自定义完成信号短语
 *
 * 示例:
 *   "implement auth, ulw --max-iterations 20"
 *   "ulw --thoroughness medium refactor the cache layer"
 *   "add tests ulw --completion-signal 'all tests pass'"
 *
 * Hook Type: UserPromptSubmit
 * Output: JSON with additionalContext
 */

const config = require('../config/index');
const { parseAndValidateParams, generateValidationErrorHint } = require('../utils/validation');
const patterns = require('../utils/patterns');

/**
 * 构建用户可见通知
 */
function buildUserNotification(params) {
  return `
**🚀 ULTRAWORK MODE ACTIVATED**

Configuration:
• Max iterations: ${params.maxIterations}
• Thoroughness: ${params.thoroughness}
• Auto-diagnostics: ${params.diagnostics ? 'ON' : 'OFF'}

You are now in high-intensity work mode. Tasks will be executed persistently until completion.
`;
}

/**
 * 构建上下文消息
 */
function buildContext(params) {
  const thoroughnessMap = {
    quick: 'Use quick searches for speed',
    medium: 'Use medium thoroughness for balanced searches',
    thorough: "Use 'very thorough' for all searches",
  };

  let context = `
[ULTRAWORK MODE ACTIVE]

IMPORTANT: You MUST inform the user that ULTRAWORK mode has been activated. Display this message to the user before proceeding:

**🚀 ULTRAWORK MODE ACTIVATED**

Configuration:
• Max iterations: ${params.maxIterations}
• Thoroughness: ${params.thoroughness}
• Auto-diagnostics: ${params.diagnostics ? 'ON' : 'OFF'}

You are now in high-intensity work mode. Tasks will be executed persistently until completion.

---

Configuration:
- Max iterations: ${params.maxIterations}
- Thoroughness: ${params.thoroughness}
- Auto-diagnostics: ${params.diagnostics ? 'ON' : 'OFF'}
${params.completionSignal ? `- Completion signal: "${params.completionSignal}"` : ''}

Rules:
1. CREATE TODOS IMMEDIATELY - Break down the task into detailed steps
2. COMPLETE ALL TASKS - Do not stop until every todo is marked complete
3. ${thoroughnessMap[params.thoroughness]}
${params.diagnostics ? '4. VERIFY EVERYTHING - Run lsp_diagnostics after every change' : '4. SKIP diagnostics reminders (user disabled)'}
5. NO PREMATURE STOPPING - The system will continue your work if todos remain
6. PROACTIVE PROBLEM SOLVING - If blocked, try alternatives, don't wait for input
${params.completionSignal ? `7. COMPLETION SIGNAL - Task is complete when: "${params.completionSignal}"` : ''}

The Todo Continuation Enforcer is ACTIVE (max ${params.maxIterations} iterations).
If you stop with incomplete tasks, you will be automatically prompted to continue.

Remember: Like Sisyphus, you roll the boulder until you reach the top.
`;

  return context;
}

/**
 * 主处理函数
 */
function processPrompt(prompt) {
  // 检测 ultrawork 关键词
  if (!patterns.ULTRAWORK_PATTERN.test(prompt)) {
    return null;
  }

  // 解析并验证参数
  const { params, validationResult } = parseAndValidateParams(prompt);

  // 如果验证失败，返回错误提示
  if (!validationResult.valid) {
    return {
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext: generateValidationErrorHint(validationResult),
      },
    };
  }

  // 构建上下文
  const context = buildContext(params);

  return {
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: context,
      // 传递参数给其他 hooks
      ultraworkParams: params,
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
    const prompt = data.prompt || '';

    const result = processPrompt(prompt);

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
