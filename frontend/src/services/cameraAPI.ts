// src/services/cameraAPI.ts
const API_BASE_URL = 'http://localhost:8000/api';

interface CameraStatus {
  connected: boolean;
  cameraState: string;
  exposure: number;
  gain: number;
  temperature: number;
  coolerOn: boolean;
  timestamp: string;
}

interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

interface AscomCamera {
  deviceName: string;
  deviceType: string;
  deviceNumber: number;
  uniqueID: string;
  ipAddress: string;
  port: number;
}

class CameraAPI {
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

  async discoverAscomCameras(): Promise<APIResponse<AscomCamera[]>> {
    return this.makeRequest<AscomCamera[]>('/camera/discover');
  }

  async connectToAscomCamera(deviceId: string, ipAddress: string, port: number, deviceNumber: number): Promise<APIResponse> {
    return this.makeRequest('/camera/connect-ascom', {
      method: 'POST',
      body: JSON.stringify({ deviceId, ipAddress, port, deviceNumber }),
    });
  }

  async disconnectAscomCamera(): Promise<APIResponse> {
    return this.makeRequest('/camera/disconnect-ascom', { method: 'POST' });
  }

  async getCameraStatus(): Promise<APIResponse<CameraStatus>> {
    return this.makeRequest<CameraStatus>('/camera/status');
  }
}

const cameraAPI = new CameraAPI();
export default cameraAPI;
export type { CameraStatus, APIResponse, AscomCamera };