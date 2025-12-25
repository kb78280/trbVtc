'use client'

import { useState, useEffect, useRef } from 'react'
import { LocationResult } from '@/types/location'

interface AddressAutocompleteProps {
  id?: string
  name?: string
  placeholder: string
  value: string
  onChange: (value: string, location?: LocationResult) => void
  onError?: (error: string) => void
  className?: string
  required?: boolean
  disabled?: boolean
}

export default function AddressAutocomplete({
  id,
  name,
  placeholder,
  value,
  onChange,
  onError,
  className = '',
  required = false,
  disabled = false
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

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

  // Sync si la valeur change depuis le parent
  useEffect(() => {
    setQuery(value)
  }, [value])

  // Fonction de recherche (Nominatim)
  const searchAddress = async (q: string) => {
    if (q.length < 3) return
    setIsLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&limit=5&countrycodes=fr`
      )
      const data = await res.json()
      setResults(data)
      setIsOpen(true)
    } catch (e) {
      console.error("Erreur recherche:", e)
      if (onError) onError("Erreur de recherche")
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
        id={id}
        name={name}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          if (e.target.value === '') onChange('', undefined)
        }}
        placeholder={placeholder}
        className={`w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
        required={required}
        disabled={disabled}
        autoComplete="off"
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