'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { LocationResult } from '@/types/location'

// Import dynamique du composant carte complet
const LeafletMap = dynamic(() => import('./LeafletMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-500">
      Chargement de la carte...
    </div>
  )
})

interface Props {
  origin?: LocationResult | null
  destination?: LocationResult | null
  height?: string
  className?: string
  onRouteCalculated?: (distance: string, duration: string) => void
}

export default function InteractiveMap({ origin, destination, height = '400px', className = '', onRouteCalculated }: Props) {
  const [routePositions, setRoutePositions] = useState<[number, number][]>([])
  const [mapCenter, setMapCenter] = useState<[number, number]>([48.8566, 2.3522]) // Paris par défaut
  const [mapZoom, setMapZoom] = useState(11)

  // Calcul d'itinéraire avec OSRM (Resté identique)
  useEffect(() => {
    if (origin && destination) {
      const fetchRoute = async () => {
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
          
          const res = await fetch(url)
          const data = await res.json()

          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0]
            
            const distKm = (route.distance / 1000).toFixed(1) + " km"
            const durMin = Math.round((route.duration * 1.2) / 60) + " min" 
            
            if (onRouteCalculated) onRouteCalculated(distKm, durMin)

            // Conversion [lng, lat] -> [lat, lng]
            const coords = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number])
            setRoutePositions(coords)

            // Centrage approximatif
            const midIndex = Math.floor(coords.length / 2)
            setMapCenter(coords[midIndex])
            setMapZoom(10)
          }
        } catch (e) {
          console.error("Erreur calcul itinéraire OSRM:", e)
        }
      }
      fetchRoute()
    } else if (origin) {
      setMapCenter([origin.lat, origin.lng])
      setMapZoom(14)
      setRoutePositions([])
    }
  }, [origin, destination, onRouteCalculated])

  return (
    <div className={`rounded-lg overflow-hidden border border-gray-300 relative z-0 ${className}`} style={{ height }}>
      <LeafletMap 
        center={mapCenter}
        zoom={mapZoom}
        origin={origin}
        destination={destination}
        routePositions={routePositions}
      />
    </div>
  )
}