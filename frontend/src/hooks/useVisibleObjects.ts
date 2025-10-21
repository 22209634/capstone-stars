import { useState, useEffect } from 'react';
import { getVisibleObjects } from '../services/objectListApi';
import { type AstronomicalObject } from '../types/objectList.types';

interface UseVisibleObjectsReturn {
  objects: AstronomicalObject[];
  loading: boolean;
  error: string | null;
}

export const useVisibleObjects = (): UseVisibleObjectsReturn => {
  const [objects, setObjects] = useState<AstronomicalObject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchObjects = async () => {
      try {
        const response = await getVisibleObjects();
        setObjects(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch objects');
      } finally {
        setLoading(false);
      }
    };

    fetchObjects();

    // Refresh visible objects every 5 minutes to update as objects rise/set
    const interval = setInterval(fetchObjects, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { objects, loading, error };
};