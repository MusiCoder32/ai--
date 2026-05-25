export const USERNAME_REGEX = /^[a-zA-Z0-9_\u4e00-\u9fa5]{1,10}$/;
export const PHONE_REGEX = /^1[3-9]\d{9}$/;
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const SMS_CODE_REGEX = /^\d{6}$/;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateUsername(username: string): ValidationResult {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: '用户名不能为空' };
  }

  if (username.length < 1) {
    return { valid: false, error: '用户名至少需要1个字符' };
  }

  if (username.length > 10) {
    return { valid: false, error: '用户名最多允许10个字符' };
  }

  if (!USERNAME_REGEX.test(username)) {
    return { valid: false, error: '用户名只能包含字母、数字、下划线和中文' };
  }

  return { valid: true };
}

export function validatePhone(phone: string): ValidationResult {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: '手机号不能为空' };
  }

  if (!PHONE_REGEX.test(phone)) {
    return { valid: false, error: '请输入正确的手机号格式' };
  }

  return { valid: true };
}

export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: '邮箱不能为空' };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, error: '请输入正确的邮箱格式' };
  }

  return { valid: true };
}

export function validateSmsCode(code: string): ValidationResult {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: '验证码不能为空' };
  }

  if (code.length !== 6) {
    return { valid: false, error: '验证码必须是6位数字' };
  }

  if (!SMS_CODE_REGEX.test(code)) {
    return { valid: false, error: '验证码必须是数字' };
  }

  return { valid: true };
}
