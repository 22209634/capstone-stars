import React, { createContext, useContext, useState, type ReactNode } from 'react';

export type CameraType = 'ascom' | 'usb' | 'ip' | null;

interface AllSkyCameraContextType {
  // Connection state
  connectedCameraType: CameraType;
  setConnectedCameraType: (type: CameraType) => void;
  connectedCameraName: string | null;
  setConnectedCameraName: (name: string | null) => void;
  cameraConnected: boolean;
  setCameraConnected: (connected: boolean) => void;

  // IP/RTSP stream URL (for IP cameras)
  streamUrl: string | null;
  setStreamUrl: (url: string | null) => void;

  // USB camera ID
  usbCameraId: number | null;
  setUsbCameraId: (id: number | null) => void;
}

const AllSkyCameraContext = createContext<AllSkyCameraContextType | undefined>(undefined);

export const useAllSkyCameraContext = () => {
  const context = useContext(AllSkyCameraContext);
  if (!context) {
    throw new Error('useAllSkyCameraContext must be used within AllSkyCameraProvider');
  }
  return context;
};

interface AllSkyCameraProviderProps {
  children: ReactNode;
}

export const AllSkyCameraProvider: React.FC<AllSkyCameraProviderProps> = ({ children }) => {
  const [connectedCameraType, setConnectedCameraType] = useState<CameraType>(null);
  const [connectedCameraName, setConnectedCameraName] = useState<string | null>(null);
  const [cameraConnected, setCameraConnected] = useState<boolean>(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [usbCameraId, setUsbCameraId] = useState<number | null>(null);

  const value: AllSkyCameraContextType = {
    connectedCameraType,
    setConnectedCameraType,
    connectedCameraName,
    setConnectedCameraName,
    cameraConnected,
    setCameraConnected,
    streamUrl,
    setStreamUrl,
    usbCameraId,
    setUsbCameraId,
  };

  return (
    <AllSkyCameraContext.Provider value={value}>
      {children}
    </AllSkyCameraContext.Provider>
  );
};
