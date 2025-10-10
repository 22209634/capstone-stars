// src/services/telescopeAPI.ts
const API_BASE_URL = 'http://localhost:8000/api';

interface TelescopeStatus {
  connected: boolean;
  tracking: boolean;
  slewing: boolean;
  rightAscension: number;
  declination: number;
  altitude: number;
  azimuth: number;
  timestamp: string;
}

interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

class TelescopeAPI {
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

  async connectTelescope(driverId?: string): Promise<APIResponse> {
    return this.makeRequest('/telescope/connect', {
      method: 'POST',
      body: driverId ? JSON.stringify({ driverId }) : undefined,
    });
  }

  async getAvailableTelescopes(): Promise<APIResponse> {
    return this.makeRequest('/telescope/chooser/list');
  }

  async showChooser(): Promise<APIResponse> {
    return this.makeRequest('/telescope/chooser', { method: 'POST' });
  }

  async disconnectTelescope(): Promise<APIResponse> {
    return this.makeRequest('/telescope/disconnect', { method: 'POST' });
  }

  async getTelescopeStatus(): Promise<APIResponse<TelescopeStatus>> {
    return this.makeRequest<TelescopeStatus>('/telescope/status');
  }

  async slewToCoordinates(rightAscension: number, declination: number): Promise<APIResponse> {
    return this.makeRequest('/telescope/slew', {
      method: 'POST',
      body: JSON.stringify({ rightAscension, declination }),
    });
  }

  async setTracking(enabled: boolean): Promise<APIResponse> {
    return this.makeRequest('/telescope/tracking', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
  }

  async abortSlew(): Promise<APIResponse> {
    return this.makeRequest('/telescope/abort', { method: 'POST' });
  }

  async slewToObject(objectId: string): Promise<APIResponse> {
    return this.makeRequest(`/telescope/slew/object/${objectId}`, { method: 'POST' });
  }

  async getAvailableCameras(): Promise<APIResponse> {
    return this.makeRequest('/camera/chooser/list');
  }

  async showCameraChooser(): Promise<APIResponse> {
    return this.makeRequest('/camera/chooser', { method: 'POST' });
  }

  async connectCamera(driverId: string): Promise<APIResponse> {
    return this.makeRequest('/camera/connect', {
      method: 'POST',
      body: JSON.stringify({ driverId }),
    });
  }

  async disconnectCamera(): Promise<APIResponse> {
    return this.makeRequest('/camera/disconnect', { method: 'POST' });
  }
}

const telescopeAPI = new TelescopeAPI();
export default telescopeAPI;
export type { TelescopeStatus, APIResponse };