#!/usr/bin/env node
/**
 * Auto Diagnostics Hook
 * 
 * Reminds to run lsp_diagnostics after file modifications.
 * Runs on PostToolUse for write/edit tools.
 * 
 * Hook Type: PostToolUse
 */

const CODE_EXTENSIONS = [
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
];

function isCodeFile(filePath) {
  if (!filePath) return false;
  const ext = filePath.split('.').pop().toLowerCase();
  return CODE_EXTENSIONS.includes(ext);
}

let input = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    
    const toolName = data.tool_name || '';
    if (!['write', 'edit', 'Write', 'Edit'].includes(toolName)) {
      process.exit(0);
    }
    
    const filePath = data.tool_input?.filePath || data.tool_input?.file_path || '';
    
    if (!isCodeFile(filePath)) {
      process.exit(0);
    }
    
    // Check if tool succeeded
    const toolResult = data.tool_result || {};
    if (toolResult.error || toolResult.is_error) {
      process.exit(0);
    }
    
    const output = {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: `
[AUTO-DIAGNOSTICS REMINDER]
File modified: ${filePath}

Run \`lsp_diagnostics\` on this file to check for errors before proceeding.
`
      }
    };
    
    console.log(JSON.stringify(output));
    process.exit(0);
    
  } catch (error) {
    console.error(`Hook error: ${error.message}`);
    process.exit(1);
  }
});

process.stdin.on('close', () => {
  if (!input) {
    process.exit(0);
  }
});
