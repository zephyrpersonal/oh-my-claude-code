/**
 * 参数验证模块
 *
 * 提供统一的参数验证和错误处理
 */

const config = require('../config/index');

/**
 * 验证错误类
 */
class ValidationError extends Error {
  constructor(message, field, value) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      field: this.field,
      value: this.value,
    };
  }
}

/**
 * Ultrawork 参数验证结果
 */
class ValidationResult {
  constructor(valid = true, errors = []) {
    this.valid = valid;
    this.errors = errors;
  }

  /**
   * 创建成功结果
   */
  static success() {
    return new ValidationResult(true, []);
  }

  /**
   * 创建失败结果
   */
  static failure(errors) {
    return new ValidationResult(false, errors);
  }

  /**
   * 获取错误消息字符串
   */
  getErrorMessage() {
    return this.errors.map(e => e.message).join('; ');
  }
}

/**
 * 验证 max-iterations 参数
 */
function validateMaxIterations(value) {
  const errors = [];

  if (value < 1) {
    errors.push(new ValidationError(
      'max-iterations must be at least 1',
      'maxIterations',
      value
    ));
  }

  if (value > 1000) {
    errors.push(new ValidationError(
      'max-iterations must not exceed 1000',
      'maxIterations',
      value
    ));
  }

  return errors;
}

/**
 * 验证 thoroughness 参数
 */
function validateThoroughness(value) {
  const errors = [];

  if (!config.ULTRAWORK.VALID_THOROUGHNESS.includes(value)) {
    errors.push(new ValidationError(
      `thoroughness must be one of: ${config.ULTRAWORK.VALID_THOROUGHNESS.join(', ')}`,
      'thoroughness',
      value
    ));
  }

  return errors;
}

/**
 * 验证 Ultrawork 参数
 */
function validateUltraworkParams(params) {
  const errors = [];

  // 验证 maxIterations
  if (params.maxIterations !== undefined) {
    errors.push(...validateMaxIterations(params.maxIterations));
  }

  // 验证 thoroughness
  if (params.thoroughness !== undefined) {
    errors.push(...validateThoroughness(params.thoroughness));
  }

  // 验证 diagnostics
  if (params.diagnostics !== undefined && typeof params.diagnostics !== 'boolean') {
    errors.push(new ValidationError(
      'diagnostics must be a boolean',
      'diagnostics',
      params.diagnostics
    ));
  }

  // 验证 completionSignal（null 表示未设置，是有效的）
  if (params.completionSignal !== undefined && params.completionSignal !== null && typeof params.completionSignal !== 'string') {
    errors.push(new ValidationError(
      'completionSignal must be a string or null',
      'completionSignal',
      params.completionSignal
    ));
  }

  return errors.length > 0
    ? ValidationResult.failure(errors)
    : ValidationResult.success();
}

/**
 * 解析并验证 Ultrawork 参数
 */
function parseAndValidateParams(prompt) {
  const params = {
    maxIterations: config.ULTRAWORK.DEFAULT_MAX_ITERATIONS,
    thoroughness: config.ULTRAWORK.DEFAULT_THOROUGHNESS,
    diagnostics: config.DIAGNOSTICS.ENABLED_BY_DEFAULT,
    completionSignal: null,
  };

  // 解析 max-iterations
  const maxMatch = prompt.match(config.ULTRAWORK.PARAM_PATTERNS.MAX_ITERATIONS);
  if (maxMatch) {
    params.maxIterations = parseInt(maxMatch[1], 10);
  }

  // 解析 thoroughness
  const thoroMatch = prompt.match(config.ULTRAWORK.PARAM_PATTERNS.THOROUGHNESS);
  if (thoroMatch) {
    params.thoroughness = thoroMatch[1].toLowerCase();
  }

  // 解析 no-diagnostics
  if (config.ULTRAWORK.PARAM_PATTERNS.NO_DIAGNOSTICS.test(prompt)) {
    params.diagnostics = false;
  }

  // 解析 completion-signal
  const signalMatch = prompt.match(config.ULTRAWORK.PARAM_PATTERNS.COMPLETION_SIGNAL);
  if (signalMatch) {
    params.completionSignal = signalMatch[1];
  }

  // 验证参数
  const validationResult = validateUltraworkParams(params);

  return {
    params,
    validationResult,
  };
}

/**
 * 生成验证错误提示
 */
function generateValidationErrorHint(validationResult) {
  if (validationResult.valid) {
    return '';
  }

  const hints = validationResult.errors.map(error => {
    let hint = `  - ${error.message}`;
    if (error.field) {
      hint += ` (field: ${error.field})`;
    }
    if (error.value !== undefined) {
      hint += ` (received: ${JSON.stringify(error.value)})`;
    }
    return hint;
  });

  return `Invalid parameters:\n${hints.join('\n')}`;
}

/**
 * 验证文件路径
 */
function validateFilePath(filePath) {
  const errors = [];

  if (!filePath) {
    errors.push(new ValidationError(
      'file path is required',
      'filePath',
      filePath
    ));
    return ValidationResult.failure(errors);
  }

  if (typeof filePath !== 'string') {
    errors.push(new ValidationError(
      'file path must be a string',
      'filePath',
      filePath
    ));
  }

  return errors.length > 0
    ? ValidationResult.failure(errors)
    : ValidationResult.success();
}

/**
 * 验证代码文件扩展名
 */
function validateCodeFileExtension(filePath) {
  if (!filePath) {
    return ValidationResult.failure([
      new ValidationError('file path is required', 'filePath', filePath)
    ]);
  }

  const ext = filePath.split('.').pop().toLowerCase();
  const isValid = config.DIAGNOSTICS.CODE_EXTENSIONS.includes(ext);

  if (!isValid) {
    return ValidationResult.failure([
      new ValidationError(
        `file extension .${ext} is not supported for diagnostics`,
        'extension',
        ext
      )
    ]);
  }

  return ValidationResult.success();
}

/**
 * 验证配置对象
 */
function validateConfigObject(configObj, schema) {
  const errors = [];

  for (const [key, rules] of Object.entries(schema)) {
    const value = configObj[key];

    // 检查必填字段
    if (rules.required && (value === undefined || value === null)) {
      errors.push(new ValidationError(
        `${key} is required`,
        key,
        value
      ));
      continue;
    }

    // 跳过可选字段
    if (value === undefined || value === null) {
      continue;
    }

    // 类型检查
    if (rules.type && typeof value !== rules.type) {
      errors.push(new ValidationError(
        `${key} must be of type ${rules.type}`,
        key,
        typeof value
      ));
    }

    // 枚举值检查
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(new ValidationError(
        `${key} must be one of: ${rules.enum.join(', ')}`,
        key,
        value
      ));
    }

    // 范围检查
    if (rules.min !== undefined && value < rules.min) {
      errors.push(new ValidationError(
        `${key} must be at least ${rules.min}`,
        key,
        value
      ));
    }

    if (rules.max !== undefined && value > rules.max) {
      errors.push(new ValidationError(
        `${key} must not exceed ${rules.max}`,
        key,
        value
      ));
    }
  }

  return errors.length > 0
    ? ValidationResult.failure(errors)
    : ValidationResult.success();
}

module.exports = {
  ValidationError,
  ValidationResult,
  validateMaxIterations,
  validateThoroughness,
  validateUltraworkParams,
  parseAndValidateParams,
  generateValidationErrorHint,
  validateFilePath,
  validateCodeFileExtension,
  validateConfigObject,
};
