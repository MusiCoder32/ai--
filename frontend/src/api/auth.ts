import axios from 'axios';

const env = import.meta.env as Record<string, string | undefined>;
const API_BASE = env.VITE_API_URL || 'http://localhost:8000';

export interface GuestLoginRequest {
  device_fingerprint: string;
  user_agent: string;
}

export interface GuestLoginResponse {
  success: boolean;
  user_id: string;
  username: string;
  status: number;
  signed_device_id: string;
  expired_at?: string;
  message?: string;
}

export interface UpgradeRequest {
  phone: string;
  code: string;
  new_username?: string;
}

export interface UpgradeResponse {
  success: boolean;
  user_id?: string;
  username?: string;
  phone?: string;
  status?: number;
  message?: string;
}

export interface RefreshRequest {
  signed_device_id: string;
}

export interface RefreshResponse {
  success: boolean;
  signed_device_id?: string;
  message?: string;
}

export interface UpdateUsernameRequest {
  new_username: string;
}

export interface UpdateUsernameResponse {
  success: boolean;
  username?: string;
  message?: string;
}

class AuthAPI {
  private static instance: AuthAPI;

  private constructor() {}

  public static getInstance(): AuthAPI {
    if (!AuthAPI.instance) {
      AuthAPI.instance = new AuthAPI();
    }
    return AuthAPI.instance;
  }

  async guestLogin(request: GuestLoginRequest): Promise<GuestLoginResponse> {
    const response = await axios.post(
      `${API_BASE}/api/auth/guest-login`,
      request
    );
    return response.data;
  }

  async upgrade(request: UpgradeRequest): Promise<UpgradeResponse> {
    const response = await axios.post(
      `${API_BASE}/api/auth/upgrade`,
      request
    );
    return response.data;
  }

  async refresh(request: RefreshRequest): Promise<RefreshResponse> {
    const response = await axios.post(
      `${API_BASE}/api/auth/refresh`,
      request
    );
    return response.data;
  }

  async updateUsername(request: UpdateUsernameRequest): Promise<UpdateUsernameResponse> {
    const response = await axios.put(
      `${API_BASE}/api/auth/username`,
      request
    );
    return response.data;
  }

  async sendSms(phone: string, scene: string = 'upgrade'): Promise<{ success: boolean; message: string }> {
    const response = await axios.post(
      `${API_BASE}/api/auth/send-sms?phone=${phone}&scene=${scene}`
    );
    return response.data;
  }
}

export const authAPI = AuthAPI.getInstance();
