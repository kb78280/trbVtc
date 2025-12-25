'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LocationResult } from '@/types/location'

// Correction des icônes Leaflet (bug connu avec Next.js/Webpack)
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

// Le composant qui posait problème, maintenant il fonctionne car useMap est importé normalement
function RecenterMap({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  
  return null
}

interface LeafletMapProps {
  center: [number, number]
  zoom: number
  origin?: LocationResult | null
  destination?: LocationResult | null
  routePositions: [number, number][]
}

export default function LeafletMap({ center, zoom, origin, destination, routePositions }: LeafletMapProps) {
  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} dragging={false} attributionControl={false}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"/>
      
      {origin && <Marker position={[origin.lat, origin.lng]} icon={icon} />}
      {destination && <Marker position={[destination.lat, destination.lng]} icon={icon} />}
      
      {routePositions.length > 0 && (
        <Polyline positions={routePositions} color="#2563eb" weight={5} opacity={0.7} />
      )}
      
      <RecenterMap center={center} zoom={zoom} />
    </MapContainer>
  )
}