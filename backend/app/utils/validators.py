import re
from typing import Optional, Tuple

USERNAME_REGEX = re.compile(r'^[a-zA-Z0-9_\u4e00-\u9fa5]{1,10}$')
PHONE_REGEX = re.compile(r'^1[3-9]\d{9}$')
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

def validate_username(username: str) -> Tuple[bool, Optional[str]]:
    """
    验证用户名
    规则：1-10位，支持字母、数字、下划线和中文
    
    :param username: 用户名
    :return: (是否有效, 错误信息)
    """
    if not username or not isinstance(username, str):
        return False, "用户名不能为空"
    
    if len(username) < 1:
        return False, "用户名至少需要1个字符"
    
    if len(username) > 10:
        return False, "用户名最多允许10个字符"
    
    if not USERNAME_REGEX.match(username):
        return False, "用户名只能包含字母、数字、下划线和中文"
    
    return True, None

def validate_phone(phone: str) -> Tuple[bool, Optional[str]]:
    """
    验证手机号
    
    :param phone: 手机号
    :return: (是否有效, 错误信息)
    """
    if not phone or not isinstance(phone, str):
        return False, "手机号不能为空"
    
    if not PHONE_REGEX.match(phone):
        return False, "请输入正确的手机号格式"
    
    return True, None

def validate_email(email: str) -> Tuple[bool, Optional[str]]:
    """
    验证邮箱
    
    :param email: 邮箱
    :return: (是否有效, 错误信息)
    """
    if not email or not isinstance(email, str):
        return False, "邮箱不能为空"
    
    if not EMAIL_REGEX.match(email):
        return False, "请输入正确的邮箱格式"
    
    return True, None

def validate_sms_code(code: str) -> Tuple[bool, Optional[str]]:
    """
    验证短信验证码
    
    :param code: 验证码
    :return: (是否有效, 错误信息)
    """
    if not code or not isinstance(code, str):
        return False, "验证码不能为空"
    
    if len(code) != 6:
        return False, "验证码必须是6位数字"
    
    if not code.isdigit():
        return False, "验证码必须是数字"
    
    return True, None
