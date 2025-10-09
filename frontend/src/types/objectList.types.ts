export interface AstronomicalObject {
  name: string;
  ra: number;
  dec: number;
  magnitude: number;
  altitude?: number;
  azimuth?: number;
  object_type?: string;
}

export interface VisibleObjectsResponse {
  count: number;
  data: AstronomicalObject[];
  message?: string;
}