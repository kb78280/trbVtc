'use client'
import { useState, useEffect, useRef } from 'react'
import { LocationResult } from '@/types/location'

interface EtapeAutocompleteProps {
  value: string
  onChange: (value: string, location?: LocationResult) => void
  onError?: (error: string) => void
  placeholder: string
  disabled?: boolean
}

export default function EtapeAutocomplete({
  value,
  onChange,
  onError,
  placeholder,
  disabled = false
}: EtapeAutocompleteProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Fermer la liste si on clique dehors
  const API_URL = 'https://vtc-transport-conciergerie.fr/api-php/address-proxy.php';
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Sync avec la valeur externe
  useEffect(() => {
    setQuery(value)
  }, [value])

  // Recherche 
  const searchAddress = async (q: string) => {
    if (q.length < 3) return
    setIsLoading(true)
    try {
      // ON APPELLE LE PROXY PHP
      const res = await fetch(`${API_URL}?q=${encodeURIComponent(q)}`)
      
      if (res.ok) {
        const data = await res.json()
        // Le proxy PHP renvoie déjà le bon format, on l'utilise directement
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

  // Debounce
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
    onChange(item.display_name, newLocation)
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          if (e.target.value === '') onChange('', undefined)
        }}
        placeholder={placeholder}
        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3"
        disabled={disabled}
        autoComplete="off"
        suppressHydrationWarning={true}
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}

      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
          {results.map((item) => (
            <li
              key={item.osm_id}
              onClick={() => handleSelect(item)}
              className="p-3 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-b-0 transition-colors text-black"
            >
              {item.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}