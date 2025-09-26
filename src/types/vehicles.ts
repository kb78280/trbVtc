// Types TypeScript pour les véhicules VTC

export interface Vehicle {
  id: number;
  nom: string;
  plaque: string;
  nombre_places: number;
  nombre_bagages: number;
  type: 'confort' | 'van';
  prix_base_mad: number;
  taux_km: number;
  created_at: string;
  updated_at: string;
  display_name: string;
  capacity_info: string;
  price_info: {
    base_hourly: number;
    rate_per_km: number;
  };
}

export interface VehiclesResponse {
  success: boolean;
  data: {
    vehicles: Vehicle[];
    by_type: {
      confort: Vehicle[];
      van: Vehicle[];
    };
    count: number;
  };
  message: string;
}

export interface VehiclesByType {
  confort: Vehicle[];
  van: Vehicle[];
}
