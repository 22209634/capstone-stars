// src/services/allSkyCameraAPI.ts
const API_BASE_URL = 'http://localhost:8000/api';

interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  streamUrl?: string;
}

interface UsbCamera {
  deviceId: number;
  deviceName: string;
  deviceType: string;
}

interface AscomCamera {
  deviceName: string;
  deviceType: string;
  deviceNumber: number;
  uniqueID: string;
  ipAddress: string;
  port: number;
}

interface AllSkyCameraConnectionRequest {
  cameraType: 'ascom' | 'usb' | 'ip';
  // ASCOM fields
  deviceId?: string;
  ipAddress?: string;
  port?: number;
  deviceNumber?: number;
  // USB fields
  usbDeviceId?: number;
  // IP/RTSP fields
  streamUrl?: string;
}

class AllSkyCameraAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async makeRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data: APIResponse<T> = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Discovery endpoints
  async discoverUsbCameras(): Promise<APIResponse<UsbCamera[]>> {
    return this.makeRequest<UsbCamera[]>('/allsky-camera/discover-usb');
  }

  async discoverAscomCameras(): Promise<APIResponse<AscomCamera[]>> {
    return this.makeRequest<AscomCamera[]>('/allsky-camera/discover-ascom');
  }

  // Connection endpoints
  async connectCamera(request: AllSkyCameraConnectionRequest): Promise<APIResponse> {
    return this.makeRequest('/allsky-camera/connect', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async disconnectCamera(cameraType: 'ascom' | 'usb' | 'ip'): Promise<APIResponse> {
    return this.makeRequest(`/allsky-camera/disconnect?camera_type=${cameraType}`, {
      method: 'POST',
    });
  }

  // Status and frame endpoints
  async getCameraStatus(cameraType: 'ascom' | 'usb' | 'ip'): Promise<APIResponse> {
    return this.makeRequest(`/allsky-camera/status?camera_type=${cameraType}`);
  }

  getFrameUrl(cameraType: 'ascom' | 'usb' | 'ip'): string {
    return `${this.baseURL}/allsky-camera/frame?camera_type=${cameraType}`;
  }

  getStreamUrl(cameraType: 'ascom' | 'usb'): string {
    return `${this.baseURL}/allsky-camera/stream?camera_type=${cameraType}`;
  }
}

const allSkyCameraAPI = new AllSkyCameraAPI();
export default allSkyCameraAPI;
export type { UsbCamera, AscomCamera, AllSkyCameraConnectionRequest, APIResponse };
