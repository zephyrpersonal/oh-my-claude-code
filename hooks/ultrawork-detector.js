#!/usr/bin/env node
/**
 * Ultrawork Keyword Detector Hook
 * 
 * Detects 'ulw', 'ultrawork', or 'uw' keywords in user prompts
 * and injects ultrawork mode instructions with optional parameters.
 * 
 * Supported parameters:
 *   --max-iterations N     Maximum continuation attempts (default: 50)
 *   --thoroughness LEVEL   Search depth: quick|medium|thorough (default: thorough)
 *   --no-diagnostics       Disable auto-diagnostics reminders
 *   --completion-signal S  Custom completion signal phrase
 * 
 * Examples:
 *   "implement auth, ulw --max-iterations 20"
 *   "ulw --thoroughness medium refactor the cache layer"
 *   "add tests ulw --completion-signal 'all tests pass'"
 * 
 * Hook Type: UserPromptSubmit
 * Output: JSON with additionalContext
 */

const ULTRAWORK_KEYWORDS = ['ulw', 'ultrawork', 'uw'];
const ULTRAWORK_PATTERN = new RegExp(
  `\\b(${ULTRAWORK_KEYWORDS.join('|')})\\b`,
  'i'
);

// Parameter patterns
const PARAM_PATTERNS = {
  maxIterations: /--max-iterations\s+(\d+)/i,
  thoroughness: /--thoroughness\s+(quick|medium|thorough)/i,
  noDiagnostics: /--no-diagnostics/i,
  completionSignal: /--completion-signal\s+["']([^"']+)["']/i,
};

function parseParams(prompt) {
  const params = {
    maxIterations: 50,
    thoroughness: 'thorough',
    diagnostics: true,
    completionSignal: null,
  };
  
  const maxMatch = prompt.match(PARAM_PATTERNS.maxIterations);
  if (maxMatch) {
    params.maxIterations = parseInt(maxMatch[1], 10);
  }
  
  const thoroMatch = prompt.match(PARAM_PATTERNS.thoroughness);
  if (thoroMatch) {
    params.thoroughness = thoroMatch[1].toLowerCase();
  }
  
  if (PARAM_PATTERNS.noDiagnostics.test(prompt)) {
    params.diagnostics = false;
  }
  
  const signalMatch = prompt.match(PARAM_PATTERNS.completionSignal);
  if (signalMatch) {
    params.completionSignal = signalMatch[1];
  }
  
  return params;
}

function buildContext(params) {
  const thoroughnessMap = {
    quick: 'Use quick searches for speed',
    medium: 'Use medium thoroughness for balanced searches', 
    thorough: "Use 'very thorough' for all searches"
  };
  
  let context = `
[ULTRAWORK MODE ACTIVE]

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

let input = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const prompt = data.prompt || '';
    
    if (ULTRAWORK_PATTERN.test(prompt)) {
      const params = parseParams(prompt);
      const context = buildContext(params);
      
      const output = {
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: context,
          // Pass params for other hooks to read
          ultraworkParams: params
        }
      };
      
      console.log(JSON.stringify(output));
      process.exit(0);
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
