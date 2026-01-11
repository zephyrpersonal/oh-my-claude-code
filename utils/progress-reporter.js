/**
 * 进度报告可视化模块
 *
 * 生成美观的进度报告，包括进度条、统计信息等
 */

const config = require('../config/index');

/**
 * 生成进度条
 */
function generateProgressBar(completed, total, width = config.PROGRESS_REPORT.BAR_WIDTH) {
  if (total === 0) {
    return {
      bar: config.PROGRESS_REPORT.EMPTY_CHAR.repeat(width),
      percent: 0,
    };
  }

  const percent = Math.min(100, Math.round((completed / total) * 100));
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;

  return {
    bar:
      config.PROGRESS_REPORT.FILLED_CHAR.repeat(filled) +
      config.PROGRESS_REPORT.EMPTY_CHAR.repeat(empty),
    percent,
  };
}

/**
 * 生成分隔线
 */
function generateSeparator(width = config.PROGRESS_REPORT.BAR_WIDTH) {
  return config.PROGRESS_REPORT.SEPARATOR.repeat(width);
}

/**
 * 估算剩余时间
 */
function estimateTimeRemaining(pendingTasks, averageTaskTime = config.PROGRESS_REPORT.AVERAGE_TASK_TIME_SECONDS) {
  if (pendingTasks === 0) {
    return '0m 0s';
  }

  const totalSeconds = pendingTasks * averageTaskTime;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  return `${minutes}m ${seconds}s`;
}

/**
 * 生成完整的进度报告
 */
function generateProgressReport(todos, options = {}) {
  const {
    showTimeEstimate = config.PROGRESS_REPORT.SHOW_TIME_ESTIMATE,
    showTasks = true,
    showInProgress = true,
    barWidth = config.PROGRESS_REPORT.BAR_WIDTH,
  } = options;

  // 统计 todo 状态
  const completed = todos.filter(t => t.status === 'completed').length;
  const inProgress = todos.filter(t => t.status === 'in_progress').length;
  const pending = todos.filter(t => t.status === 'pending').length;
  const total = todos.length;

  const pendingTotal = pending + inProgress;

  // 生成进度条
  const { bar, percent } = generateProgressBar(completed, total, barWidth);
  const separator = generateSeparator(barWidth);

  // 构建报告
  let report = '\n[PROGRESS]\n';
  report += separator + '\n';
  report += `${bar} ${percent}%\n`;
  report += separator + '\n';
  report += `Completed: ${completed}/${total}\n`;
  report += `Pending: ${pendingTotal}\n`;

  if (showInProgress && inProgress > 0) {
    report += `In Progress: ${inProgress}\n`;
  }

  if (showTimeEstimate && pendingTotal > 0) {
    const timeRemaining = estimateTimeRemaining(pendingTotal);
    report += `Estimated Time: ${timeRemaining}\n`;
  }

  report += separator;

  // 添加任务列表
  if (showTasks && pendingTotal > 0) {
    report += '\n\n[PENDING TASKS]\n';

    const pendingTodos = todos.filter(t => t.status === 'pending' || t.status === 'in_progress');

    for (let i = 0; i < pendingTodos.length; i++) {
      const todo = pendingTodos[i];
      const statusIcon = todo.status === 'in_progress' ? '▶' : '○';
      report += `${statusIcon} ${todo.content}\n`;
    }
  }

  report += '\n';

  return report;
}

/**
 * 生成简洁的进度报告（用于继续提示）
 */
function generateCompactProgressReport(todos) {
  const completed = todos.filter(t => t.status === 'completed').length;
  const inProgress = todos.filter(t => t.status === 'in_progress').length;
  const pending = todos.filter(t => t.status === 'pending').length;
  const total = todos.length;

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const pendingTotal = pending + inProgress;

  let report = `[PROGRESS: ${completed}/${total} (${percent}%)]`;

  if (pendingTotal > 0) {
    report += ` - ${pendingTotal} task${pendingTotal !== 1 ? 's' : ''} remaining`;
  }

  return report;
}

/**
 * 从 transcript 数据解析 todos
 */
function parseTodosFromData(data) {
  const todos = [];

  if (data.todos && Array.isArray(data.todos)) {
    return data.todos;
  }

  // 尝试从 content 中提取
  if (data.content) {
    const content = typeof data.content === 'string' ? data.content : JSON.stringify(data.content);

    // 查找 todos 数组
    const todosMatch = content.match(/\[\s*\{[\s\S]*?\}\s*\]/);
    if (todosMatch) {
      try {
        const parsed = JSON.parse(todosMatch[0]);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        // 忽略解析错误
      }
    }

    // 使用正则提取 todo 状态
    const statusMatches = content.match(/"status":\s*"(pending|in_progress|completed)"/g);
    const contentMatches = content.match(/"content":\s*"([^"]+)"/g);

    if (statusMatches && contentMatches) {
      for (let i = 0; i < Math.min(statusMatches.length, contentMatches.length); i++) {
        const status = statusMatches[i].match(/"(pending|in_progress|completed)"/)[1];
        const todoContent = contentMatches[i].match(/"content":\s*"([^"]+)"/)[1];
        todos.push({
          content: todoContent,
          status: status,
          activeForm: todoContent, // 默认使用 content
        });
      }
    }
  }

  return todos;
}

/**
 * 生成继续提示消息（包含进度报告）
 */
function generateContinuationPrompt(incompleteTodos, allTodos, continuationCount, maxContinuations) {
  const progressReport = generateProgressReport(allTodos, {
    showTasks: true,
    showTimeEstimate: true,
  });

  const warning =
    continuationCount >= maxContinuations - 5
      ? `\n[WARNING] Approaching maximum continuation limit (${continuationCount}/${maxContinuations})\n`
      : '';

  return `${progressReport}${warning}
You have incomplete tasks in your todo list. Continue working on the next pending task.

Instructions:
1. Check your todo list for the next pending or in_progress task
2. Mark the current task as in_progress if not already
3. Complete the task
4. Mark it as completed
5. Move to the next task
6. Do NOT stop until ALL tasks are marked complete

If you are truly blocked on all remaining tasks, explain the blockers clearly.
Otherwise, proceed with the next task immediately.
`;
}

module.exports = {
  generateProgressBar,
  generateSeparator,
  estimateTimeRemaining,
  generateProgressReport,
  generateCompactProgressReport,
  parseTodosFromData,
  generateContinuationPrompt,
};
