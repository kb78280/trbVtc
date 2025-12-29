'use client'
import { useState, useEffect, useRef } from 'react'
import { LocationResult } from '@/types/location'

interface Props {
  value: string
  onChange: (value: string, location?: LocationResult) => void
  placeholder?: string
  className?: string
  required?: boolean
  disabled?: boolean
}

export default function DepartureAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Adresse de départ", 
  className = "",
  required = false,
  disabled = false
}: Props) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const API_URL = 'https://vtc-transport-conciergerie.fr/api-php/address-proxy.php';

  // Sync internal state with prop if it changes externally
  useEffect(() => {
    setQuery(value)
  }, [value])

  // Fermer la liste si on clique dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Fonction de recherche vers  (OSM)
  const searchAddress = async (q: string) => {
    if (q.length < 3) return
    setIsLoading(true)
    try {
      const res = await fetch(`${API_URL}?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        setResults(Array.isArray(data) ? data : [])
        setIsOpen(true)
      } else {
        console.error("Erreur API:", res.status)
      }
    } catch (e) {
      console.error("Erreur réseau:", e)
    } finally {
      setIsLoading(false)
    }
  }

  // Timer pour éviter de chercher à chaque lettre (debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query && query !== value && query.length >= 3) {
        searchAddress(query)
      }
    }, 500) 
    return () => clearTimeout(timer)
  }, [query, value])

  const handleSelect = (item: any) => {
    const newLocation: LocationResult = {
      label: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      place_id: item.osm_id?.toString()
    }
    
    setQuery(item.display_name)
    setIsOpen(false)
    // On remonte l'info au parent
    onChange(item.display_name, newLocation)
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          const newValue = e.target.value
          setQuery(newValue)
          // Si l'utilisateur efface, on prévient le parent
          onChange(newValue, undefined)
        }}
        placeholder={placeholder}
        className={`w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
        required={required}
        disabled={disabled}
        autoComplete="off"
        // FIX: Suppress hydration warning for browser extension attributes
        suppressHydrationWarning={true}
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      )}

      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
          {results.map((item) => (
            <li
              key={item.osm_id}
              onClick={() => handleSelect(item)}
              className="p-3 hover:bg-blue-50 cursor-pointer text-sm font-medium text-gray-900 border-b border-gray-100 last:border-b-0 bg-white"
            >
              {item.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}