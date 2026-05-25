import { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { User, Phone, Mail, Edit3, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '../../api/auth';
import { USERNAME_REGEX, PHONE_REGEX, SMS_CODE_REGEX, validatePhone } from '../../utils/validators';

interface UserProfileProps {
  visible: boolean;
  onClose: () => void;
}

function UserProfile({ visible, onClose }: UserProfileProps) {
  const { user, upgrade, updateUsername } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsCountdown, setSmsCountdown] = useState(0);

  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        userId: user?.user_id,
        username: user?.username,
        phone: '',
        code: '',
        email: '',
      });
    }
  }, [visible, user, form]);

  useEffect(() => {
    if (smsCountdown > 0) {
      const timer = setTimeout(() => {
        setSmsCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [smsCountdown]);

  const handleSendSms = async () => {
    const values = form.getFieldsValue();
    if (!values.phone) {
      message.error('请输入手机号');
      return;
    }

    const phoneResult = validatePhone(values.phone);
    if (!phoneResult.valid) {
      message.error(phoneResult.error);
      return;
    }

    setSmsLoading(true);
    try {
      const result = await authAPI.sendSms(values.phone, 'upgrade');
      if (result.success) {
        message.success('验证码发送成功');
        setSmsCountdown(60);
      } else {
        message.error(result.message || '发送失败');
      }
    } catch (error) {
      message.error('发送失败，请重试');
    } finally {
      setSmsLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields(['username', 'email']);
      
      if (!values.username) {
        message.error('请输入用户名');
        return;
      }

      const phoneValue = form.getFieldValue('phone');
      const codeValue = form.getFieldValue('code');
      const hasValidPhone = phoneValue && validatePhone(phoneValue).valid;

      if (hasValidPhone && !codeValue) {
        message.error('请输入验证码');
        return;
      }

      if (hasValidPhone && !SMS_CODE_REGEX.test(codeValue)) {
        message.error('请输入6位数字验证码');
        return;
      }

      setLoading(true);

      if (hasValidPhone && codeValue) {
        const success = await upgrade(phoneValue, codeValue, values.username);
        if (success) {
          message.success('升级成功');
        } else {
          message.error('操作失败');
        }
      } else {
        const success = await updateUsername(values.username);
        if (success) {
          message.success('修改成功');
        } else {
          message.error('修改失败');
        }
      }

      onClose();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('操作失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const isGuest = user?.status !== 1;

  return (
    <Modal
      title="用户信息"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={450}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item label="用户ID">
          <div style={{ display: 'flex', alignItems: 'center', color: '#666' }}>
            <User size={16} style={{ marginRight: 8 }} />
            <span>{user?.user_id}</span>
          </div>
        </Form.Item>

        <Form.Item
          label="用户名"
          name="username"
          rules={[
            { required: true, message: '请输入用户名' },
            { pattern: USERNAME_REGEX, message: '用户名需1-10位，支持字母、数字、下划线和中文' },
          ]}
        >
          <Input
            prefix={<Edit3 size={16} />}
            placeholder="请输入用户名"
            disabled={loading}
          />
        </Form.Item>

        <Form.Item label="邮箱" name="email">
          <Input
            prefix={<Mail size={16} />}
            placeholder="选填，请输入邮箱地址"
            disabled={loading}
          />
        </Form.Item>

        {isGuest ? (
          <>
            <Form.Item
              label="手机号"
              name="phone"
              rules={[
                () => ({
                  validator(_, value) {
                    if (!value) return Promise.resolve();
                    if (PHONE_REGEX.test(value)) return Promise.resolve();
                    return Promise.reject(new Error('请输入正确的手机号格式'));
                  },
                }),
              ]}
            >
              <Input
                prefix={<Phone size={16} />}
                placeholder="选填，填写后可升级为正式用户"
                disabled={loading}
              />
            </Form.Item>

            <Form.Item
              label="验证码"
              name="code"
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const phone = getFieldValue('phone');
                    if (!phone) return Promise.resolve();
                    if (!value) return Promise.reject(new Error('请输入验证码'));
                    if (SMS_CODE_REGEX.test(value)) return Promise.resolve();
                    return Promise.reject(new Error('请输入6位数字验证码'));
                  },
                }),
              ]}
            >
              <div style={{ display: 'flex', gap: 12 }}>
                <Input
                  placeholder="请输入验证码"
                  disabled={loading}
                />
                <Button
                  type="primary"
                  onClick={handleSendSms}
                  loading={smsLoading}
                  disabled={smsCountdown > 0 || loading}
                  style={{ width: 120 }}
                >
                  {smsCountdown > 0 ? `${smsCountdown}s` : '获取'}
                </Button>
              </div>
            </Form.Item>
          </>
        ) : (
          <Form.Item label="手机号">
            <div style={{ display: 'flex', alignItems: 'center', color: '#52c41a' }}>
              <Phone size={16} style={{ marginRight: 8 }} />
              <CheckCircle size={16} style={{ marginRight: 8 }} />
              <span>已绑定</span>
            </div>
          </Form.Item>
        )}

        <Form.Item label="用户状态">
          <span style={{ color: user?.status === 1 ? '#52c41a' : '#999' }}>
            {user?.status === 1 ? '已升级' : '游客'}
            {isGuest && (
              <span style={{ marginLeft: 8, fontSize: 12, color: '#1890ff' }}>
                绑定手机号可升级为正式用户
              </span>
            )}
          </span>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={loading}
            style={{ width: '100%' }}
          >
            确认修改
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default UserProfile;
