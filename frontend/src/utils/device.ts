import md5 from 'md5';

export function generateCanvasFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return 'no-canvas';
  }

  canvas.width = 256;
  canvas.height = 256;

  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, 256, 256);

  ctx.font = '14px Arial';
  ctx.fillStyle = '#333333';
  ctx.fillText('Device Fingerprint Generation', 10, 100);

  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(128, 150, 50, 0, Math.PI * 2);
  ctx.stroke();

  const gradient = ctx.createLinearGradient(0, 0, 256, 256);
  gradient.addColorStop(0, 'rgba(255, 0, 0, 0.1)');
  gradient.addColorStop(1, 'rgba(0, 0, 255, 0.1)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const dataUrl = canvas.toDataURL();
  return md5(dataUrl);
}

export function collectDeviceInfo(): Record<string, unknown> {
  const nav = navigator as Navigator & { deviceMemory?: number };
  
  return {
    userAgent: navigator.userAgent,
    appVersion: navigator.appVersion,
    platform: navigator.platform,
    language: navigator.language,
    screenWidth: screen.width,
    screenHeight: screen.height,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio,
    hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
    memory: nav.deviceMemory || 'unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    languages: navigator.languages?.join(',') || 'unknown',
    webgl: getWebGLFingerprint()
  };
}

function getWebGLFingerprint(): string | Record<string, string> {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return 'no-webgl';

    const glExt = gl as WebGLRenderingContext & {
      getExtension: (name: string) => unknown;
      getParameter: (name: unknown) => unknown;
    };

    const debugInfo = glExt.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      return {
        renderer: glExt.getParameter((debugInfo as unknown as Record<string, unknown>).UNMASKED_RENDERER_WEBGL) as string,
        vendor: glExt.getParameter((debugInfo as unknown as Record<string, unknown>).UNMASKED_VENDOR_WEBGL) as string
      };
    }
    return 'no-debug-info';
  } catch {
    return 'error';
  }
}

export function generateDeviceFingerprint(): string {
  const canvasFingerprint = generateCanvasFingerprint();
  const deviceInfo = collectDeviceInfo();

  const rawFingerprint = [
    canvasFingerprint,
    deviceInfo.userAgent as string,
    deviceInfo.platform as string,
    `${deviceInfo.screenWidth}x${deviceInfo.screenHeight}`,
    String(deviceInfo.colorDepth),
    String(deviceInfo.pixelRatio),
    String(deviceInfo.hardwareConcurrency),
    deviceInfo.timezone as string
  ].join('|');

  return md5(rawFingerprint);
}

export class DeviceStorage {
  private static DEVICE_ID_KEY = 'signed_device_id';
  private static DEVICE_ID_COOKIE = 'device_id';

  static getDeviceId(): string | null {
    let deviceId = localStorage.getItem(this.DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = this.getCookie(this.DEVICE_ID_COOKIE);
    }
    return deviceId || null;
  }

  static saveDeviceId(signedDeviceId: string): void {
    localStorage.setItem(this.DEVICE_ID_KEY, signedDeviceId);

    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `${this.DEVICE_ID_COOKIE}=${signedDeviceId}; 
      expires=${expires.toUTCString()}; 
      path=/; 
      Secure; 
      SameSite=Lax`;
  }

  static clearDeviceId(): void {
    localStorage.removeItem(this.DEVICE_ID_KEY);
    document.cookie = `${this.DEVICE_ID_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  private static getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  }
}

export interface UserState {
  user_id: string;
  username: string;
  status: number;
  signed_device_id: string;
  expired_at?: string;
}

export function getUserState(): UserState | null {
  const stored = localStorage.getItem('user_state');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

export function saveUserState(state: UserState): void {
  localStorage.setItem('user_state', JSON.stringify(state));
}

export function clearUserState(): void {
  localStorage.removeItem('user_state');
}
