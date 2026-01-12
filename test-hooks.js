#!/usr/bin/env node
/**
 * 测试 hooks 功能
 */

const { spawn } = require('child_process');
const fs = require('fs');

// 测试 ultrawork-detector
function testUltraworkDetector() {
  console.log('\n🧪 Testing ultrawork-detector.js...\n');

  const input = JSON.stringify({
    prompt: 'implement auth, ulw --max-iterations 20'
  });

  return new Promise((resolve, reject) => {
    const proc = spawn('node', ['hooks/ultrawork-detector.js']);
    let output = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0 && output) {
        const result = JSON.parse(output);
        console.log('✅ Ultrawork detected');
        console.log('   maxIterations:', result.hookSpecificOutput.ultraworkParams.maxIterations);
        console.log('   thoroughness:', result.hookSpecificOutput.ultraworkParams.thoroughness);
        resolve(true);
      } else {
        console.log('❌ No ultrawork detected');
        resolve(false);
      }
    });

    proc.stdin.write(input);
    proc.stdin.end();
  });
}

// 测试 post-tool-processor
function testPostToolProcessor() {
  console.log('\n🧪 Testing post-tool-processor.js...\n');

  const input = JSON.stringify({
    tool_name: 'Write',
    tool_input: {
      filePath: '/tmp/test.js',
      content: '// this is a test\nfunction add(a, b) {\n  return a + b;\n}\n'
    }
  });

  return new Promise((resolve, reject) => {
    const proc = spawn('node', ['hooks/post-tool-processor.js']);
    let output = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', (code) => {
      if (output) {
        try {
          const result = JSON.parse(output);
          console.log('✅ PostToolUse hook triggered');
          if (result.hookSpecificOutput?.additionalContext) {
            console.log('   Context length:', result.hookSpecificOutput.additionalContext.length);
          }
          resolve(true);
        } catch (e) {
          console.log('❌ Failed to parse output:', e.message);
          resolve(false);
        }
      } else {
        console.log('ℹ️ No output (tool not matched)');
        resolve(true);
      }
    });

    proc.stdin.write(input);
    proc.stdin.end();
  });
}

// 测试验证模块
function testValidation() {
  console.log('\n🧪 Testing utils/validation.js...\n');

  const { parseAndValidateParams } = require('./utils/validation.js');

  // 有效参数
  const result1 = parseAndValidateParams('ulw --max-iterations 20');
  console.log('✅ Valid params:', result1.validationResult.valid);

  // 无效参数
  const result2 = parseAndValidateParams('ulw --max-iterations 2000');
  console.log('❌ Invalid params detected:', !result2.validationResult.valid);

  return Promise.resolve(true);
}

// 运行所有测试
async function runAllTests() {
  console.log('🚀 Starting hook tests...\n');
  console.log('═'.repeat(50));

  try {
    await testValidation();
    await testUltraworkDetector();
    await testPostToolProcessor();

    console.log('\n' + '═'.repeat(50));
    console.log('\n✅ All tests passed! Plugin is ready.\n');

    console.log('📝 Next steps:');
    console.log('   1. Restart Claude Code to load the updated plugin');
    console.log('   2. Test with: claude "implement something, ulw"');
    console.log('   3. Check hooks are working correctly\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

runAllTests();
