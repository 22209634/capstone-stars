// Search API service for SIMBAD object search
import type { AstronomicalObject } from '@/types/objectList.types';

const API_BASE_URL = 'http://localhost:8000/api';

interface SearchResponse {
  success: boolean;
  count: number;
  data: AstronomicalObject[];
  error?: string;
}

class SearchAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async searchObjects(query: string, maxResults: number = 5): Promise<SearchResponse> {
    if (!query || query.trim().length === 0) {
      return { success: true, count: 0, data: [] };
    }

    try {
      const url = `${this.baseURL}/search?query=${encodeURIComponent(query)}&max_results=${maxResults}`;
      const response = await fetch(url);
      const data: SearchResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`Search API request failed:`, error);
      return { success: false, count: 0, data: [], error: String(error) };
    }
  }
}

const searchAPI = new SearchAPI();
export default searchAPI;
export type { SearchResponse };
