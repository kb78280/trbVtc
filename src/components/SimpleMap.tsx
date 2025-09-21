'use client'

import { useEffect, useRef, useState } from 'react'
import { googleMapsService } from '@/lib/googleMaps'

interface SimpleMapProps {
  departPlace: google.maps.places.PlaceResult | null
  arriveePlace: google.maps.places.PlaceResult | null
  onRouteCalculated?: (distance: string, duration: string) => void
}

export default function SimpleMap({ departPlace, arriveePlace, onRouteCalculated }: SimpleMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const departMarkerRef = useRef<google.maps.Marker | null>(null)
  const arriveeMarkerRef = useRef<google.maps.Marker | null>(null)
  const routeRendererRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

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

  // Initialiser la carte centrée sur Paris
  useEffect(() => {
    if (isLoaded && mapContainerRef.current && !mapRef.current) {
      // Utiliser le service pour créer la carte
      mapRef.current = googleMapsService.createMap(mapContainerRef.current, {
        zoom: 11,
        fullscreenControl: false
      })

      // Initialiser le renderer de route
      routeRendererRef.current = googleMapsService.createDirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#3B82F6',
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      })
      routeRendererRef.current.setMap(mapRef.current)
    }
  }, [isLoaded])

  // Gérer le marqueur de départ
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return

    // Supprimer l'ancien marqueur
    if (departMarkerRef.current) {
      departMarkerRef.current.setMap(null)
      departMarkerRef.current = null
    }

    if (departPlace?.geometry?.location) {
      const position = {
        lat: departPlace.geometry.location.lat(),
        lng: departPlace.geometry.location.lng()
      }

      // Créer le nouveau marqueur
      departMarkerRef.current = new google.maps.Marker({
        position,
        map: mapRef.current,
        title: 'Départ',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      })

      // Centrer la carte sur le point de départ
      mapRef.current.setCenter(position)
      mapRef.current.setZoom(14)
    }
  }, [departPlace, isLoaded])

  // Gérer le marqueur d'arrivée et la route
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return

    // Supprimer l'ancien marqueur d'arrivée
    if (arriveeMarkerRef.current) {
      arriveeMarkerRef.current.setMap(null)
      arriveeMarkerRef.current = null
    }

    if (arriveePlace?.geometry?.location) {
      const position = {
        lat: arriveePlace.geometry.location.lat(),
        lng: arriveePlace.geometry.location.lng()
      }

      // Créer le marqueur d'arrivée
      arriveeMarkerRef.current = new google.maps.Marker({
        position,
        map: mapRef.current,
        title: 'Arrivée',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      })

      // Calculer et afficher la route si on a départ ET arrivée
      if (departPlace?.geometry?.location && routeRendererRef.current) {
        const directionsService = googleMapsService.createDirectionsService()
        
        directionsService.route({
          origin: {
            lat: departPlace.geometry.location.lat(),
            lng: departPlace.geometry.location.lng()
          },
          destination: position,
          travelMode: google.maps.TravelMode.DRIVING,
          avoidTolls: false,
          avoidHighways: false
        }, (result, status) => {
          if (status === 'OK' && result && routeRendererRef.current) {
            routeRendererRef.current.setDirections(result)
            
            // Ajuster la vue pour inclure toute la route
            if (result.routes[0]?.bounds) {
              mapRef.current?.fitBounds(result.routes[0].bounds)
            }

            // Appeler le callback avec les informations de route
            if (onRouteCalculated && result.routes[0]?.legs[0]) {
              const leg = result.routes[0].legs[0]
              const distance = leg.distance?.text || ''
              const duration = leg.duration?.text || ''
              onRouteCalculated(distance, duration)
            }
          }
        })
      }
    } else {
      // Pas d'arrivée, effacer la route
      if (routeRendererRef.current) {
        routeRendererRef.current.setDirections({ routes: [] } as unknown as google.maps.DirectionsResult)
      }
      // Effacer les informations de route
      if (onRouteCalculated) {
        onRouteCalculated('', '')
      }
    }
  }, [arriveePlace, departPlace, isLoaded, onRouteCalculated])

  if (!isLoaded) {
    return (
      <div className="h-64 bg-gray-200 flex items-center justify-center">
        <div className="text-gray-500">Chargement de la carte...</div>
      </div>
    )
  }

  return (
    <div 
      ref={mapContainerRef}
      className="h-64 w-full"
    />
  )
}
