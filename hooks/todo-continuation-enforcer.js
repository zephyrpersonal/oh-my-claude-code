#!/usr/bin/env node
/**
 * Todo Continuation Enforcer Hook (Sisyphus Mode)
 * 
 * Prevents Claude from stopping when there are incomplete todos.
 * When Claude tries to stop with pending tasks, this hook blocks
 * the stop and provides a reason to continue.
 * 
 * Hook Type: Stop
 * Output: JSON with decision to block or allow stopping
 * 
 * Inspired by oh-my-opencode's todo-continuation-enforcer
 */

const fs = require('fs');
const path = require('path');

// Configuration - can be overridden by --max-iterations param in transcript
const DEFAULT_CONFIG = {
  maxContinuations: 50,
  ultraworkKeywords: ['ultrawork', 'ulw', 'uw', 'ULTRAWORK MODE'],
};

function extractMaxIterations(transcriptContent) {
  const match = transcriptContent.match(/--max-iterations\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : DEFAULT_CONFIG.maxContinuations;
}

function extractCompletionSignal(transcriptContent) {
  const match = transcriptContent.match(/--completion-signal\s+["']([^"']+)["']/i);
  return match ? match[1] : null;
}

// Continuation prompt when todos are incomplete
const CONTINUATION_PROMPT = `
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

// Read input from stdin
let input = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    
    // Check if stop_hook_active is true (prevents infinite loops)
    if (data.stop_hook_active) {
      // Allow stop to prevent infinite continuation
      process.exit(0);
    }
    
    // Read the transcript to check for incomplete todos and ultrawork mode
    const transcriptPath = data.transcript_path;
    if (!transcriptPath || !fs.existsSync(transcriptPath)) {
      // No transcript available, allow stop
      process.exit(0);
    }
    
    // Read and parse transcript
    const transcriptContent = fs.readFileSync(transcriptPath, 'utf8');
    const lines = transcriptContent.trim().split('\n');
    
    const maxContinuations = extractMaxIterations(transcriptContent);
    const completionSignal = extractCompletionSignal(transcriptContent);
    
    let ultraworkActive = false;
    let incompleteTodos = [];
    let continuationCount = 0;
    let completionSignalFound = false;
    
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        const content = JSON.stringify(entry);
        
        // Check for ultrawork keywords
        for (const keyword of DEFAULT_CONFIG.ultraworkKeywords) {
          if (content.includes(keyword)) {
            ultraworkActive = true;
            break;
          }
        }
        
        // Count continuation prompts to prevent infinite loops
        if (completionSignal && content.includes(completionSignal)) {
          completionSignalFound = true;
        }
        
        if (content.includes('Continue working on the next pending task')) {
          continuationCount++;
        }
        
        // Look for todo tool usage - parse the actual todo array
        if (entry.type === 'tool_use' || entry.type === 'tool_result') {
          try {
            const innerContent = typeof entry.content === 'string' ? entry.content : JSON.stringify(entry.content);
            const todosMatch = innerContent.match(/\[[\s\S]*?\]/);
            if (todosMatch) {
              const todos = JSON.parse(todosMatch[0]);
              if (Array.isArray(todos)) {
                const pending = todos.filter(t => t.status === 'pending' || t.status === 'in_progress');
                if (pending.length > 0) {
                  incompleteTodos = pending.map(t => t.content || 'Unknown task');
                }
              }
            }
          } catch (parseErr) {
            // Fall back to regex if JSON parse fails
            if (content.includes('"status":"pending"') || content.includes('"status":"in_progress"')) {
              const matches = content.match(/"content"\s*:\s*"([^"]+)"/g);
              if (matches) {
                incompleteTodos = matches.map(m => m.replace(/"content"\s*:\s*"([^"]+)"/, '$1'));
              }
            }
          }
        }
      } catch (e) {
        // Skip invalid JSON lines
        continue;
      }
    }
    
    // Check if we should enforce continuation
    if (ultraworkActive && incompleteTodos.length > 0 && !completionSignalFound) {
      if (continuationCount >= maxContinuations) {
        console.error(`Max continuation limit (${maxContinuations}) reached. Allowing stop.`);
        process.exit(0);
      }
      
      // Block the stop and provide reason to continue
      const output = {
        decision: 'block',
        reason: `${CONTINUATION_PROMPT}\n\nIncomplete tasks detected:\n${incompleteTodos.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
      };
      
      console.log(JSON.stringify(output));
      process.exit(0);
    }
    
    // Allow stop if no incomplete todos or ultrawork not active
    process.exit(0);
    
  } catch (error) {
    // On error, allow stop to prevent blocking
    console.error(`Hook error: ${error.message}`);
    process.exit(1);
  }
});

// Handle empty stdin
process.stdin.on('close', () => {
  if (!input) {
    process.exit(0);
  }
});
