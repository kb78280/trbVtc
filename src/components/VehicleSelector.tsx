'use client'

import React from 'react';
import { Vehicle } from '@/types/vehicles';

interface VehicleSelectorProps {
  vehicles: Vehicle[];
  selectedVehicleId: number | null;
  onVehicleSelect: (vehicleId: number) => void;
  serviceType: 'transfert' | 'mise-a-disposition';
  loading?: boolean;
}

export default function VehicleSelector({ 
  vehicles, 
  selectedVehicleId, 
  onVehicleSelect, 
  serviceType,
  loading = false 
}: VehicleSelectorProps) {
  if (loading) {
    return (
      <div className="animate-pulse">
        <h4 className="text-md font-semibold text-gray-700 mb-3">
          Choisissez votre véhicule
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">Aucun véhicule disponible pour ce type de service</p>
      </div>
    );
  }

  // Organiser les véhicules par type
  const confortVehicles = vehicles.filter(v => v.type === 'confort');
  const vanVehicles = vehicles.filter(v => v.type === 'van');

  return (
    <div className="mt-4">
      <h4 className="text-md font-semibold text-gray-700 mb-4">
        🚗 Choisissez votre véhicule
      </h4>
      
      {/* Véhicules Confort */}
      {confortVehicles.length > 0 && (
        <div className="mb-6">
          <h5 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
            🚗 Berlines (Confort)
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {confortVehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => onVehicleSelect(vehicle.id)}
                className={`group relative p-4 rounded-lg border-2 text-left transition-all duration-300 hover:scale-105 ${
                  selectedVehicleId === vehicle.id
                    ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-900 shadow-md'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg text-lg ${
                    selectedVehicleId === vehicle.id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-600 group-hover:bg-emerald-100 group-hover:text-emerald-600'
                  }`}>
                    🚗
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm mb-1">{vehicle.display_name}</div>
                    <div className="text-xs opacity-75 mb-1">{vehicle.capacity_info}</div>
                    <div className="text-xs font-medium opacity-60">
                      {serviceType === 'mise-a-disposition' 
                        ? `${vehicle.price_info.base_hourly}€/h` 
                        : `${vehicle.price_info.rate_per_km}€/km`
                      }
                    </div>
                  </div>
                </div>
                {selectedVehicleId === vehicle.id && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Véhicules Van */}
      {vanVehicles.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
            🚐 Vans (Groupe)
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {vanVehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => onVehicleSelect(vehicle.id)}
                className={`group relative p-4 rounded-lg border-2 text-left transition-all duration-300 hover:scale-105 ${
                  selectedVehicleId === vehicle.id
                    ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 text-orange-900 shadow-md'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg text-lg ${
                    selectedVehicleId === vehicle.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 group-hover:bg-orange-100 group-hover:text-orange-600'
                  }`}>
                    🚐
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm mb-1">{vehicle.display_name}</div>
                    <div className="text-xs opacity-75 mb-1">{vehicle.capacity_info}</div>
                    <div className="text-xs font-medium opacity-60">
                      {serviceType === 'mise-a-disposition' 
                        ? `${vehicle.price_info.base_hourly}€/h` 
                        : `${vehicle.price_info.rate_per_km}€/km`
                      }
                    </div>
                  </div>
                </div>
                {selectedVehicleId === vehicle.id && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
