import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authAPI, GuestLoginResponse } from '../api/auth';
import { generateDeviceFingerprint, DeviceStorage, saveUserState, getUserState, clearUserState } from '../utils/device';

export interface User {
  user_id: string;
  username: string;
  status: number;
  signed_device_id: string;
  expired_at?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: GuestLoginResponse }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPGRADE_SUCCESS'; payload: { username: string; status: number } }
  | { type: 'UPDATE_USERNAME'; payload: string };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      const user: User = {
        user_id: action.payload.user_id,
        username: action.payload.username,
        status: action.payload.status,
        signed_device_id: action.payload.signed_device_id,
        expired_at: action.payload.expired_at
      };
      return {
        ...state,
        user,
        isLoading: false,
        isAuthenticated: true,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null
      };
    case 'UPGRADE_SUCCESS':
      return state.user
        ? {
            ...state,
            user: {
              ...state.user,
              username: action.payload.username,
              status: action.payload.status
            }
          }
        : state;
    case 'UPDATE_USERNAME':
      return state.user
        ? {
            ...state,
            user: { ...state.user, username: action.payload }
          }
        : state;
    default:
      return state;
  }
}
interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logout: () => void;
  upgrade: (phone: string, code: string, newUsername?: string) => Promise<boolean>;
  updateUsername: (newUsername: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null
  });

  useEffect(() => {
    const initAuth = async () => {
      // 检查是否有本地存储的用户状态
      const savedState = getUserState();
      if (savedState) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { ...savedState, success: true } as GuestLoginResponse
        });
        return;
      }

      // 尝试自动登录
      await handleAutoLogin();
    };

    initAuth();
  }, []);

  const handleAutoLogin = async () => {
    try {
      dispatch({ type: 'LOGIN_START' });

      const deviceFingerprint = generateDeviceFingerprint();
      
      const response = await authAPI.guestLogin({
        device_fingerprint: deviceFingerprint,
        user_agent: navigator.userAgent
      });

      if (response.success) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: response });
        
        // 保存到本地存储
        DeviceStorage.saveDeviceId(response.signed_device_id);
        saveUserState({
          user_id: response.user_id,
          username: response.username,
          status: response.status,
          signed_device_id: response.signed_device_id,
          expired_at: response.expired_at
        });
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: response.message || '登录失败' });
      }
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error instanceof Error ? error.message : '登录异常'
      });
    }
  };

  const login = async () => {
    await handleAutoLogin();
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    DeviceStorage.clearDeviceId();
    clearUserState();
  };

  const upgrade = async (phone: string, code: string, newUsername?: string): Promise<boolean> => {
    try {
      if (!state.user) {
        return false;
      }

      const response = await authAPI.upgrade({
        phone,
        code,
        new_username: newUsername
      });

      if (response.success && response.user_id) {
        dispatch({
          type: 'UPGRADE_SUCCESS',
          payload: {
            username: response.username || newUsername || state.user.username,
            status: response.status || 1
          }
        });
        
        // 更新本地存储
        saveUserState({
          ...state.user,
          username: response.username || newUsername || state.user.username,
          status: response.status || 1
        });
        
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const updateUsername = async (newUsername: string): Promise<boolean> => {
    try {
      const response = await authAPI.updateUsername({ new_username: newUsername });

      if (response.success && response.username) {
        dispatch({ type: 'UPDATE_USERNAME', payload: response.username });
        
        if (state.user) {
          saveUserState({ ...state.user, username: response.username });
        }
        
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        upgrade,
        updateUsername
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
