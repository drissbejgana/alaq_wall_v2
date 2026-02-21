const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export interface Point {
  x: number;
  y: number;
}

export interface Prediction {
  class: string;
  class_id: number;
  confidence: number;
  points: Point[];
}

export interface PredictionResponse {
  predictions: Prediction[];
  image_width: number;
  image_height: number;
}

export interface AreaResponse {
  area_px: number;
  area_m2: number;
  scale_factor: number;
}

export const aiService = {
  /**
   * Upload an image to the Django backend and get floor segmentation predictions.
   */
async predictFloor(file: File): Promise<PredictionResponse> {
  const form = new FormData();
  form.append('file', file);

  const token = localStorage.getItem('access_token'); // ✅ attach JWT

  const res = await fetch(`${API_BASE}/api/predictor/predict/`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Prediction failed (${res.status}): ${detail}`);
  }

  return res.json();
},

  /**
   * Calculate real-world floor area from polygon points + a reference measurement.
   */
  async calculateArea(params: {
    points: Point[];
    imageWidth: number;
    imageHeight: number;
    referenceLengthPx: number;
    referenceLengthCm: number;
  }): Promise<AreaResponse> {
    const token = localStorage.getItem('access_token')
    const res = await fetch(`${API_BASE}/api/area/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
 },
      body: JSON.stringify({
        points: params.points,
        image_width: params.imageWidth,
        image_height: params.imageHeight,
        reference_length_px: params.referenceLengthPx,
        reference_length_cm: params.referenceLengthCm,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Area calculation failed (${res.status}): ${detail}`);
    }

    return res.json();
  },
};