'use client'

import { useEffect, useRef, useState } from 'react'
import { googleMapsService } from '@/lib/googleMaps'

interface InteractiveMapProps {
  origin?: google.maps.places.PlaceResult
  destination?: google.maps.places.PlaceResult
  waypoints?: string[] // Étapes intermédiaires (adresses texte)
  validWaypoints?: google.maps.places.PlaceResult[] // Étapes validées avec géométrie
  height?: string
  className?: string
  onRouteCalculated?: (distance: string, duration: string) => void
}

export default function InteractiveMap({
  origin,
  destination,
  waypoints = [],
  validWaypoints = [],
  height = '400px',
  className = '',
  onRouteCalculated
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null)
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const initializeMap = async () => {
      try {
        // Utiliser le service centralisé
        await googleMapsService.loadGoogleMaps()

        if (mapRef.current) {
          // Créer la carte via le service
          const map = googleMapsService.createMap(mapRef.current)
          mapInstanceRef.current = map

          // Créer les services de directions via le service centralisé
          directionsServiceRef.current = googleMapsService.createDirectionsService()
          directionsRendererRef.current = googleMapsService.createDirectionsRenderer()

          directionsRendererRef.current.setMap(map)
          setIsLoaded(true)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement de la carte'
        setError(errorMessage)
        console.error('Erreur Google Maps:', err)
      }
    }

    initializeMap()
  }, [])

  // Calculer et afficher l'itinéraire
  useEffect(() => {
    if (!isLoaded || !origin || !destination || !directionsServiceRef.current || !directionsRendererRef.current) {
      return
    }

    const calculateRoute = async () => {
      try {
        // Construire les waypoints à partir des étapes validées avec géométrie
        const waypointsFormatted: google.maps.DirectionsWaypoint[] = validWaypoints
          .filter(waypoint => waypoint.geometry && waypoint.geometry.location) // Seuls les waypoints avec géométrie
          .map(waypoint => ({
            location: waypoint.geometry!.location!,
            stopover: true
          }))

        console.log('🗺️ [MAP] Calcul route avec waypoints validés:', { 
          origin: origin.formatted_address, 
          destination: destination?.formatted_address || 'undefined',
          validWaypoints: validWaypoints.map(w => w.formatted_address),
          waypointsCount: waypointsFormatted.length
        })

        const request: google.maps.DirectionsRequest = {
          origin: origin.geometry!.location!,
          destination: destination.geometry!.location!,
          waypoints: waypointsFormatted,
          optimizeWaypoints: true, // Optimiser l'ordre des waypoints
          travelMode: google.maps.TravelMode.DRIVING,
          avoidHighways: false,
          avoidTolls: false,
          language: 'fr',
          region: 'FR'
        }

        const result = await directionsServiceRef.current!.route(request)
        directionsRendererRef.current!.setDirections(result)

        // Extraire les informations de distance et durée
        const route = result.routes[0]
        if (route && route.legs && route.legs[0]) {
          const leg = route.legs[0]
          const distance = leg.distance?.text || 'N/A'
          const duration = leg.duration?.text || 'N/A'
          
          onRouteCalculated?.(distance, duration)
        }

        setError('')
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur de calcul d\'itinéraire'
        setError(errorMessage)
        console.error('Erreur calcul itinéraire:', err)
      }
    }

    calculateRoute()
  }, [isLoaded, origin, destination, validWaypoints, onRouteCalculated])

  if (error) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`} style={{ height }}>
        <div className="text-center text-gray-600">
          <svg className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.158.69-.158 1.006 0l4.994 2.497c.317.158.69.158 1.007 0z" />
          </svg>
          <p className="text-sm">Erreur de chargement de la carte</p>
          <p className="text-xs text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={mapRef}
        style={{ height }}
        className="w-full rounded-lg shadow-sm"
      />
      
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Chargement de la carte...</p>
          </div>
        </div>
      )}
    </div>
  )
}
