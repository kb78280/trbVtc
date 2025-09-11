'use client'
import { useEffect, useRef, useState } from 'react'
import { googleMapsService } from '@/lib/googleMaps'

interface DepartureAutocompleteProps {
  value: string
  onChange: (value: string, placeDetails?: google.maps.places.PlaceResult) => void
  onError?: (error: string) => void
  className?: string
  required?: boolean
  disabled?: boolean
}

export default function DepartureAutocomplete({
  value,
  onChange,
  onError,
  className = '',
  required = false,
  disabled = false
}: DepartureAutocompleteProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState('')
  const [internalValue, setInternalValue] = useState(value)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  // Synchroniser UNIQUEMENT à l'initialisation et lors de reset externe
  useEffect(() => {
    if (value === '' && internalValue !== '') {
      console.log('[DEPART] External reset detected, clearing internal value')
      setInternalValue('')
    } else if (value !== '' && internalValue === '' && value !== internalValue) {
      console.log('[DEPART] Initial value set from external:', value)
      setInternalValue(value)
    }
  }, [value])

  useEffect(() => {
    const initializeAutocomplete = async () => {
      try {
        await googleMapsService.loadGoogleMaps()

        if (inputRef.current) {
          const autocomplete = googleMapsService.createAutocomplete(inputRef.current)
          autocompleteRef.current = autocomplete

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace()
            
            console.log('[DEPART] Place changed:', {
              hasGeometry: !!place.geometry,
              hasLocation: !!place.geometry?.location,
              address: place.formatted_address,
              placeId: place.place_id
            })
            
            if (!place.geometry || !place.geometry.location) {
              console.warn('[DEPART] Invalid place selected')
              setError('Adresse de départ non trouvée. Veuillez sélectionner une suggestion.')
              onError?.('Adresse non trouvée')
              return
            }

            setError('')
            const formattedAddress = place.formatted_address || ''
            
            if (formattedAddress) {
              console.log('[DEPART] Valid address selected:', formattedAddress)
              setInternalValue(formattedAddress)
              onChange(formattedAddress, place)
            }
          })

          setIsLoaded(true)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement Google Maps'
        console.error('[DEPART] Error loading Google Maps:', errorMessage)
        setError(errorMessage)
        onError?.(errorMessage)
      }
    }

    initializeAutocomplete()

    return () => {
      if (autocompleteRef.current && googleMapsService.isGoogleMapsLoaded()) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [onChange, onError])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    console.log('[DEPART] Input change:', newValue)
    setInternalValue(newValue)
    onChange(newValue)
    
    if (error) {
      setError('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && autocompleteRef.current) {
      e.preventDefault()
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        id="depart"
        name="depart"
        value={internalValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Tapez votre adresse de départ..."
        className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${className}`}
        required={required}
        disabled={disabled || !isLoaded}
        autoComplete="off"
      />
      
      {!isLoaded && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 border border-red-300 rounded-md">
          <p className="text-sm text-red-600 px-3">{error}</p>
        </div>
      )}
    </div>
  )
}
