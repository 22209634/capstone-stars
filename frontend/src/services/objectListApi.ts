import { type VisibleObjectsResponse } from '../types/objectList.types';

const API_BASE_URL = 'http://127.0.0.1:8000';

export const getVisibleObjects = async (): Promise<VisibleObjectsResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/visible`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: VisibleObjectsResponse = await response.json();
    return data;
    
  } catch (error) {
    console.error('Error fetching visible objects:', error);
    throw error;
  }
};