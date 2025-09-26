import { useState, useEffect } from 'react';
import { Vehicle, VehiclesResponse, VehiclesByType } from '@/types/vehicles';

interface UseVehiclesReturn {
  vehicles: Vehicle[];
  vehiclesByType: VehiclesByType;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useVehicles(): UseVehiclesReturn {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesByType, setVehiclesByType] = useState<VehiclesByType>({
    confort: [],
    van: []
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('https://vtc-transport-conciergerie.fr/api-php/vehicles.php?for_reservation=true', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data: VehiclesResponse = await response.json();

      if (data.success) {
        setVehicles(data.data.vehicles);
        setVehiclesByType(data.data.by_type);
      } else {
        throw new Error(data.message || 'Erreur lors de la récupération des véhicules');
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des véhicules:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      
      // Données de fallback en cas d'erreur
      const fallbackVehicles: Vehicle[] = [
        {
          id: 1,
          nom: 'Mercedes Classe E',
          plaque: 'AB-123-CD',
          nombre_places: 4,
          nombre_bagages: 3,
          type: 'confort',
          prix_base_mad: 45.00,
          taux_km: 1.20,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          display_name: 'Mercedes Classe E',
          capacity_info: '4 places, 3 bagages',
          price_info: {
            base_hourly: 45.00,
            rate_per_km: 1.20
          }
        },
        {
          id: 2,
          nom: 'BMW Série 5',
          plaque: 'EF-456-GH',
          nombre_places: 4,
          nombre_bagages: 3,
          type: 'confort',
          prix_base_mad: 45.00,
          taux_km: 1.20,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          display_name: 'BMW Série 5',
          capacity_info: '4 places, 3 bagages',
          price_info: {
            base_hourly: 45.00,
            rate_per_km: 1.20
          }
        },
        {
          id: 3,
          nom: 'Mercedes Vito',
          plaque: 'IJ-789-KL',
          nombre_places: 8,
          nombre_bagages: 6,
          type: 'van',
          prix_base_mad: 65.00,
          taux_km: 1.50,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          display_name: 'Mercedes Vito',
          capacity_info: '8 places, 6 bagages',
          price_info: {
            base_hourly: 65.00,
            rate_per_km: 1.50
          }
        },
        {
          id: 4,
          nom: 'Volkswagen Caravelle',
          plaque: 'MN-012-OP',
          nombre_places: 8,
          nombre_bagages: 8,
          type: 'van',
          prix_base_mad: 65.00,
          taux_km: 1.50,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          display_name: 'Volkswagen Caravelle',
          capacity_info: '8 places, 8 bagages',
          price_info: {
            base_hourly: 65.00,
            rate_per_km: 1.50
          }
        }
      ];

      setVehicles(fallbackVehicles);
      setVehiclesByType({
        confort: fallbackVehicles.filter(v => v.type === 'confort'),
        van: fallbackVehicles.filter(v => v.type === 'van')
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  return {
    vehicles,
    vehiclesByType,
    loading,
    error,
    refetch: fetchVehicles
  };
}
