import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import cameraAPI from '@/services/cameraAPI';

interface CameraContextType {
  connectedCamera: string | null;
  setConnectedCamera: (camera: string | null) => void;
  cameraConnected: boolean;
  setCameraConnected: (connected: boolean) => void;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

export const useCameraContext = () => {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error('useCameraContext must be used within CameraProvider');
  }
  return context;
};

interface CameraProviderProps {
  children: ReactNode;
}

export const CameraProvider: React.FC<CameraProviderProps> = ({ children }) => {
  const [connectedCamera, setConnectedCamera] = useState<string | null>(null);
  const [cameraConnected, setCameraConnected] = useState<boolean>(false);

  // Poll camera status when connected
  useEffect(() => {
    if (!cameraConnected) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await cameraAPI.getCameraStatus();
        if (response.success && response.data) {
          setCameraConnected(response.data.connected);
        }
      } catch (error) {
        console.error('Error polling camera status:', error);
        setCameraConnected(false);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [cameraConnected]);

  const value: CameraContextType = {
    connectedCamera,
    setConnectedCamera,
    cameraConnected,
    setCameraConnected,
  };

  return (
    <CameraContext.Provider value={value}>
      {children}
    </CameraContext.Provider>
  );
};
