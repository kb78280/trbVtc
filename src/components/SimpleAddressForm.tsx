'use client'

import { useRef, useEffect, useState } from 'react'
import { googleMapsService } from '@/lib/googleMaps'

interface SimpleAddressFormProps {
  departAddress: string
  arriveeAddress: string
  departPlace: google.maps.places.PlaceResult | null
  arriveePlace: google.maps.places.PlaceResult | null
  vehicleType: string
  serviceType: string
  onDepartChange: (address: string, place: google.maps.places.PlaceResult | null) => void
  onArriveeChange: (address: string, place: google.maps.places.PlaceResult | null) => void
  onVehicleChange: (type: string) => void
  onServiceTypeChange: (type: string) => void
}

export default function SimpleAddressForm({
  departAddress,
  arriveeAddress,
  departPlace,
  arriveePlace,
  vehicleType,
  serviceType,
  onDepartChange,
  onArriveeChange,
  onVehicleChange,
  onServiceTypeChange
}: SimpleAddressFormProps) {
  const departInputRef = useRef<HTMLInputElement>(null)
  const arriveeInputRef = useRef<HTMLInputElement>(null)
  const departAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const arriveeAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Éviter l'hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Charger Google Maps
  useEffect(() => {
    const loadMaps = async () => {
      try {
        await googleMapsService.loadGoogleMaps()
        setIsLoaded(true)
      } catch (error) {
        console.error('Erreur lors du chargement de Google Maps:', error)
      }
    }
    loadMaps()
  }, [])

  // Initialiser l'autocomplétion pour le départ
  useEffect(() => {
    if (isLoaded && departInputRef.current && !departAutocompleteRef.current) {
      departAutocompleteRef.current = googleMapsService.createAutocomplete(
        departInputRef.current
      )

      departAutocompleteRef.current.addListener('place_changed', () => {
        const place = departAutocompleteRef.current?.getPlace()
        if (place && place.formatted_address) {
          onDepartChange(place.formatted_address, place)
        }
      })
    }
  }, [isLoaded, onDepartChange])

  // Initialiser l'autocomplétion pour l'arrivée
  useEffect(() => {
    if (isLoaded && arriveeInputRef.current && !arriveeAutocompleteRef.current) {
      arriveeAutocompleteRef.current = googleMapsService.createAutocomplete(
        arriveeInputRef.current
      )

      arriveeAutocompleteRef.current.addListener('place_changed', () => {
        const place = arriveeAutocompleteRef.current?.getPlace()
        if (place && place.formatted_address) {
          onArriveeChange(place.formatted_address, place)
        }
      })
    }
  }, [isLoaded, onArriveeChange])

  const vehicles = [
    {
      id: 'berline',
      name: 'Berline Confort',
      description: '1-3 passagers',
      icon: '🚗'
    },
    {
      id: 'van',
      name: 'Van Premium',
      description: '1-8 passagers',
      icon: '🚐'
    }
  ]

  const serviceTypes = [
    {
      id: 'transfert',
      name: 'Transfert',
      description: 'Point A vers point B'
    },
    {
      id: 'mise-a-disposition',
      name: 'Mise à disposition',
      description: 'Chauffeur à disposition'
    }
  ]

  // Éviter l'hydratation mismatch en attendant le montage côté client
  if (!isMounted) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Adresses</h2>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Adresses */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Adresses</h2>
        
        {/* Départ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adresse de départ *
          </label>
          <input
            ref={departInputRef}
            type="text"
            value={departAddress}
            onChange={(e) => onDepartChange(e.target.value, null)}
            placeholder="Saisissez l'adresse de départ"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            suppressHydrationWarning
          />
          {departPlace && (
            <div className="mt-2 flex items-center text-sm text-green-600">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Adresse validée
            </div>
          )}
        </div>

        {/* Arrivée */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adresse d'arrivée *
          </label>
          <input
            ref={arriveeInputRef}
            type="text"
            value={arriveeAddress}
            onChange={(e) => onArriveeChange(e.target.value, null)}
            placeholder={departPlace ? "Saisissez l'adresse d'arrivée" : "Veuillez d'abord saisir l'adresse de départ"}
            disabled={!departPlace}
            className={`w-full px-4 py-3 border rounded-lg text-base ${
              departPlace 
                ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
            suppressHydrationWarning
          />
          {arriveePlace && (
            <div className="mt-2 flex items-center text-sm text-green-600">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Adresse validée
            </div>
          )}
        </div>
      </div>

      {/* Choix du véhicule */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            Véhicule
            {!vehicleType && (
              <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                Requis
              </span>
            )}
            {vehicleType && (
              <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                ✓ Sélectionné
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-600 mt-1">Veuillez sélectionner un véhicule</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {vehicles.map((vehicle) => (
            <label
              key={vehicle.id}
              className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                vehicleType === vehicle.id
                  ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-sm hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="vehicle"
                value={vehicle.id}
                checked={vehicleType === vehicle.id}
                onChange={(e) => onVehicleChange(e.target.value)}
                className="sr-only"
              />
              <div className="flex flex-col items-center text-center space-y-2 flex-1">
                <span className="text-2xl">{vehicle.icon}</span>
                <div>
                  <div className="font-medium text-gray-900 text-sm">{vehicle.name}</div>
                  <div className="text-xs text-gray-500">{vehicle.description}</div>
                </div>
              </div>
              {vehicleType === vehicle.id && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Type de service */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            Type de trajet
            {!serviceType && (
              <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                Requis
              </span>
            )}
            {serviceType && (
              <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                ✓ Sélectionné
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-600 mt-1">Veuillez sélectionner un type de trajet</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {serviceTypes.map((service) => (
            <label
              key={service.id}
              className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                serviceType === service.id
                  ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-sm hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="serviceType"
                value={service.id}
                checked={serviceType === service.id}
                onChange={(e) => onServiceTypeChange(e.target.value)}
                className="sr-only"
              />
              <div className="flex-1 text-center">
                <div className="font-medium text-gray-900 text-sm">{service.name}</div>
                <div className="text-xs text-gray-500">{service.description}</div>
              </div>
              {serviceType === service.id && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Résumé de progression */}
      <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Progression</h3>
          <div className="text-xs text-gray-500">
            {[departPlace, arriveePlace, vehicleType, serviceType].filter(Boolean).length}/4 étapes
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${departPlace ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className={departPlace ? 'text-green-700' : 'text-gray-500'}>Départ</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${arriveePlace ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className={arriveePlace ? 'text-green-700' : 'text-gray-500'}>Arrivée</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${vehicleType ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className={vehicleType ? 'text-green-700' : 'text-gray-500'}>Véhicule</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${serviceType ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className={serviceType ? 'text-green-700' : 'text-gray-500'}>Type de trajet</span>
          </div>
        </div>
        {[departPlace, arriveePlace, vehicleType, serviceType].filter(Boolean).length === 4 && (
          <div className="mt-3 p-2 bg-green-100 rounded-lg text-center">
            <span className="text-green-700 text-sm font-medium">🎉 Formulaire complet !</span>
          </div>
        )}
      </div>
    </div>
  )
}
