import { useState } from 'react';
import { Layout, Button, Avatar, Dropdown, Tooltip, Spin } from 'antd';
import { FileImage, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import UserProfile from './UserProfile';


function AppHeader() {
  const { user, login, logout, isLoading: isAuthLoading } = useAuth();
  const [profileVisible, setProfileVisible] = useState(false);

  const handleLogin = async () => {
    await login();
  };

  const handleMenuClick = (key: string) => {
    if (key === 'profile') {
      setProfileVisible(true);
    } else if (key === 'logout') {
      logout();
    }
  };

  return (
    <>
      <header className="w-full h-52px h-between-center pl-20px pr-20px" style={{ background: 'linear-gradient(to right, #1a237e, #283593)' }}>
            <FileImage size={24} style={{ color: '#fff' }} />
            <h1 className="text-white text-18px ml-5px">试卷AI答题系统</h1>

<div className="flex-1"></div>
            {!isAuthLoading && user ? (
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'profile',
                      label: '个人信息',
                      icon: <User size={14} />,
                    },
                    {
                      key: 'settings',
                      label: '设置',
                      icon: <Settings size={14} />,
                    },
                    {
                      type: 'divider' as const,
                    },
                    {
                      key: 'logout',
                      label: '退出登录',
                      icon: <LogOut size={14} />,
                      danger: true,
                    },
                  ],
                  onClick: ({ key }) => handleMenuClick(key),
                }}
              >
                <div >
                  <Avatar size={32} icon={<User size={16} />} />
                  <span className="text-white text-14px ml-5px">
                    {user.username || '用户'}
                  </span>
                </div>
              </Dropdown>
            ) : isAuthLoading ? (
                  <Spin size="small" description="登录中..." />
            ) : (
              <Button
                type="primary"
                onClick={handleLogin}
                loading={isAuthLoading}
              >
                登录
              </Button>
            )}
      </header>

      <UserProfile
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
      />
    </>
  );
}

export default AppHeader;
