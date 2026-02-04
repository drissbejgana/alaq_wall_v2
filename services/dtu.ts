import api from './api';

export interface DTUReference {
  paint_types: { value: string; label: string }[];
  dtu_levels: { value: string; label: string }[];
  substrate_types: { value: string; label: string }[];
  wall_conditions: { value: string; label: string }[];
  paint_prices: Record<string, number>;
  paint_coverage_rates: Record<string, number>;
  condition_multipliers: Record<string, number>;
  dtu_multipliers: Record<string, number>;
  min_coats_per_level: Record<string, number>;
  filler_quantities: Record<string, number>;
  execution_conditions: {
    min_temperature: number;
    max_humidity: number;
    drying_time_between_coats: number;
    substrate_max_moisture: number;
  };
  standard_openings: {
    door_area: number;
    window_area: number;
    door_return_area: number;
    window_return_area: number;
  };
  defaults: {
    labor_per_m2: number;
    vat_rate: number;
  };
}

export const dtuService = {
  // Get all DTU reference data
  async getReference(): Promise<DTUReference> {
    const response = await api.get('/dtu/reference/');
    return response.data;
  },

  // Get preparations for substrate/level
  async getPreparations(substrate: string, level: string) {
    const response = await api.get('/dtu/preparations/', {
      params: { substrate, level },
    });
    return response.data;
  },
};