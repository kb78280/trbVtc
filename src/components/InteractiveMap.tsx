'use client'

import { useEffect, useRef, useState } from 'react'
import { googleMapsService } from '@/lib/googleMaps'

interface InteractiveMapProps {
  origin?: google.maps.places.PlaceResult
  destination?: google.maps.places.PlaceResult
  waypoints?: string[]
  validWaypoints?: google.maps.places.PlaceResult[]
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
  const [error, setError] = useState<string>('')

  useEffect(() => {
    let isMounted = true
    
    const initMap = async () => {
      if (!mapRef.current || !isMounted) {
        return
      }

      try {
        await googleMapsService.loadGoogleMaps()
        const map = googleMapsService.createMap(mapRef.current)
        
        // Créer les services de directions
        const directionsService = googleMapsService.createDirectionsService()
        const directionsRenderer = googleMapsService.createDirectionsRenderer()
        directionsRenderer.setMap(map)
        
        // Gérer l'affichage selon les adresses disponibles
        if (origin && destination && origin.geometry && destination.geometry) {
          // Cas 3: Départ ET arrivée - calculer l'itinéraire
          const request = {
            origin: origin.geometry.location!,
            destination: destination.geometry.location!,
            travelMode: google.maps.TravelMode.DRIVING,
            language: 'fr',
            region: 'FR'
          }
          
          directionsService.route(request, (result, status) => {
            if (status === 'OK' && result) {
              directionsRenderer.setDirections(result)
              
              // Extraire les informations de distance et durée
              const route = result.routes[0]
              if (route && route.legs && route.legs[0]) {
                const leg = route.legs[0]
                const distance = leg.distance?.text || 'N/A'
                const duration = leg.duration?.text || 'N/A'
                
                if (isMounted && onRouteCalculated) {
                  onRouteCalculated(distance, duration)
                }
              }
            }
          })
          
        } else if (origin && origin.geometry && origin.geometry.location) {
          // Cas 2: Seulement le départ - centrer sur le départ avec marqueur
          map.setCenter(origin.geometry.location)
          map.setZoom(15)
          
          // Ajouter un marqueur pour le départ
          new google.maps.Marker({
            position: origin.geometry.location,
            map: map,
            title: 'Départ'
          })
        }
        
      } catch (err) {
        setError('Erreur lors du chargement de Google Maps')
        
        // Afficher un placeholder en cas d'erreur
        if (mapRef.current) {
          mapRef.current.innerHTML = `
            <div style="
              width: 100%; 
              height: 100%; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 16px;
              font-weight: bold;
              text-align: center;
            ">
              🗺️ Chargement Google Maps...<br/>
              <small style="font-size: 12px; opacity: 0.8;">Centré sur Paris</small>
            </div>
          `
        }
      }
    }

    initMap()
    
    return () => {
      isMounted = false
    }
  }, [origin, destination])

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-red-50 border border-red-200 rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="text-center p-4">
          <div className="text-red-600 font-medium mb-2">❌ Erreur de carte</div>
          <div className="text-red-500 text-sm">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={mapRef} 
      className={`${className}`}
      style={{ 
        height, 
        width: '100%',
        backgroundColor: '#f3f4f6',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    />
  )
}