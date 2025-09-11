'use client'

import { useEffect, useRef, useState } from 'react'
import { googleMapsService } from '@/lib/googleMaps'

interface AddressAutocompleteProps {
  id: string
  name: string
  placeholder: string
  value: string
  onChange: (value: string, placeDetails?: google.maps.places.PlaceResult) => void
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
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const initializeAutocomplete = async () => {
      try {
        // Utiliser le service centralisé
        await googleMapsService.loadGoogleMaps()

        if (inputRef.current) {
          // Créer l'autocomplétion via le service
          const autocomplete = googleMapsService.createAutocomplete(inputRef.current)
          autocompleteRef.current = autocomplete

          // Écouter les sélections d'adresse
          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace()
            
            // Debug détaillé
            console.log(`[${id}] Place changed:`, {
              hasGeometry: !!place.geometry,
              hasLocation: !!place.geometry?.location,
              address: place.formatted_address,
              placeId: place.place_id
            })
            
            if (!place.geometry || !place.geometry.location) {
              console.warn(`[${id}] Invalid place selected`)
              setError('Adresse non trouvée. Veuillez sélectionner une suggestion.')
              onError?.('Adresse non trouvée')
              return
            }

            setError('')
            const formattedAddress = place.formatted_address || ''
            
            // Seulement déclencher onChange si on a une adresse valide
            if (formattedAddress) {
              console.log(`[${id}] Valid address selected:`, formattedAddress)
              onChange(formattedAddress, place)
            }
          })

          setIsLoaded(true)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement Google Maps'
        setError(errorMessage)
        onError?.(errorMessage)
        console.error('Erreur Google Maps:', err)
      }
    }

    initializeAutocomplete()

    // Nettoyage
    return () => {
      if (autocompleteRef.current && googleMapsService.isGoogleMapsLoaded()) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [onChange, onError])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    // Toujours déclencher onChange pour maintenir la synchronisation
    onChange(newValue)
    
    // Effacer l'erreur quand l'utilisateur tape
    if (error) {
      setError('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Empêcher la soumission du formulaire avec Enter si l'autocomplétion est ouverte
    if (e.key === 'Enter' && autocompleteRef.current) {
      e.preventDefault()
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        id={id}
        name={name}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        disabled={disabled || !isLoaded}
        className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 ${
          error ? 'border-red-500' : ''
        } ${!isLoaded ? 'bg-gray-100' : ''} ${className}`}
        autoComplete="off"
      />
      
      {!isLoaded && !error && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {error && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {!isLoaded && !error && (
        <p className="mt-1 text-sm text-gray-500">Chargement de l'autocomplétion...</p>
      )}
    </div>
  )
}
