#!/usr/bin/env node
/**
 * Comment Checker Hook
 * 
 * Detects when AI adds excessive comments to code and warns about it.
 * Runs on PostToolUse for write/edit tools.
 * 
 * Hook Type: PostToolUse
 * Inspired by oh-my-opencode's comment-checker
 */

const fs = require('fs');

// Comment patterns for different languages
const COMMENT_PATTERNS = {
  js: [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//gm],
  ts: [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//gm],
  py: [/#.*$/gm, /"""[\s\S]*?"""/gm, /'''[\s\S]*?'''/gm],
  rb: [/#.*$/gm, /=begin[\s\S]*?=end/gm],
  sh: [/#.*$/gm],
  css: [/\/\*[\s\S]*?\*\//gm],
  html: [/<!--[\s\S]*?-->/gm],
};

// Threshold: warn if comments exceed this percentage of total lines
const COMMENT_THRESHOLD = 0.40; // 40%

// Phrases that indicate unnecessary AI-generated comments
const AI_COMMENT_INDICATORS = [
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
];

function getFileExtension(filePath) {
  const ext = filePath.split('.').pop().toLowerCase();
  const extMap = {
    js: 'js', jsx: 'js', mjs: 'js', cjs: 'js',
    ts: 'ts', tsx: 'ts', mts: 'ts', cts: 'ts',
    py: 'py', pyw: 'py',
    rb: 'rb', rake: 'rb',
    sh: 'sh', bash: 'sh', zsh: 'sh',
    css: 'css', scss: 'css', less: 'css',
    html: 'html', htm: 'html', vue: 'html', svelte: 'html',
  };
  return extMap[ext] || null;
}

function countCommentLines(content, patterns) {
  let commentChars = 0;
  for (const pattern of patterns) {
    const matches = content.match(pattern) || [];
    for (const match of matches) {
      commentChars += match.length;
    }
  }
  return commentChars;
}

function hasAICommentIndicators(content) {
  const lowerContent = content.toLowerCase();
  return AI_COMMENT_INDICATORS.filter(indicator => 
    lowerContent.includes(indicator)
  );
}

// Read input from stdin
let input = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    
    // Only check for write/edit tool results
    const toolName = data.tool_name || '';
    if (!['write', 'edit', 'Write', 'Edit'].includes(toolName)) {
      process.exit(0);
    }
    
    const filePath = data.tool_input?.filePath || data.tool_input?.file_path || '';
    const content = data.tool_input?.content || data.tool_input?.newString || '';
    
    if (!filePath || !content) {
      process.exit(0);
    }
    
    const ext = getFileExtension(filePath);
    if (!ext || !COMMENT_PATTERNS[ext]) {
      process.exit(0);
    }
    
    const patterns = COMMENT_PATTERNS[ext];
    const commentChars = countCommentLines(content, patterns);
    const totalChars = content.length;
    const commentRatio = totalChars > 0 ? commentChars / totalChars : 0;
    
    const warnings = [];
    
    // Check comment ratio
    if (commentRatio > COMMENT_THRESHOLD) {
      warnings.push(`High comment ratio: ${(commentRatio * 100).toFixed(1)}% of content is comments`);
    }
    
    // Check for AI-style comments
    const aiIndicators = hasAICommentIndicators(content);
    if (aiIndicators.length >= 3) {
      warnings.push(`Detected ${aiIndicators.length} AI-style comment phrases: "${aiIndicators.slice(0, 3).join('", "')}..."`);
    }
    
    if (warnings.length > 0) {
      const output = {
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: `
[COMMENT CHECKER WARNING]
${warnings.join('\n')}

Guidelines:
- Avoid obvious comments that just repeat what the code does
- Comments should explain WHY, not WHAT
- Let the code be self-documenting when possible
- Remove redundant comments before finishing
`
        }
      };
      
      console.log(JSON.stringify(output));
    }
    
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
