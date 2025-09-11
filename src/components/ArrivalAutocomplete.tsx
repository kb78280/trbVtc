'use client'
import { useEffect, useRef, useState } from 'react'
import { googleMapsService } from '@/lib/googleMaps'

interface ArrivalAutocompleteProps {
  value: string // Utilisé uniquement pour l'initialisation
  onChange: (value: string, placeDetails?: google.maps.places.PlaceResult) => void
  onError?: (error: string) => void
  className?: string
  required?: boolean
  disabled?: boolean
}

export interface ArrivalAutocompleteRef {
  reset: () => void
  setValue: (value: string) => void
}

export default function ArrivalAutocomplete({
  value,
  onChange,
  onError,
  className = '',
  required = false,
  disabled = false
}: ArrivalAutocompleteProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState('')
  const [internalValue, setInternalValue] = useState(value) // Initialisation uniquement
  const [isInitialized, setIsInitialized] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false) // Protection pendant sélection
  
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  // AUCUNE synchronisation externe - complètement isolé
  // Le composant gère son propre état sans écouter les props

  useEffect(() => {
    const initializeAutocomplete = async () => {
      try {
        await googleMapsService.loadGoogleMaps()

        if (inputRef.current) {
          const autocomplete = googleMapsService.createAutocomplete(inputRef.current)
          autocompleteRef.current = autocomplete

          autocomplete.addListener('place_changed', () => {
            setIsSelecting(true) // Marquer qu'on est en sélection
            const place = autocomplete.getPlace()
            
            console.log('[ARRIVEE] Place changed:', {
              hasGeometry: !!place.geometry,
              hasLocation: !!place.geometry?.location,
              address: place.formatted_address,
              placeId: place.place_id
            })
            
            if (!place.geometry || !place.geometry.location) {
              console.warn('[ARRIVEE] Invalid place selected')
              setError('Adresse d\'arrivée non trouvée. Veuillez sélectionner une suggestion.')
              onError?.('Adresse non trouvée')
              setIsSelecting(false)
              return
            }

            setError('')
            const formattedAddress = place.formatted_address || ''
            
            if (formattedAddress) {
              console.log('[ARRIVEE] Valid address selected:', formattedAddress)
              setInternalValue(formattedAddress)
              // Forcer la mise à jour de l'input HTML aussi
              if (inputRef.current) {
                inputRef.current.value = formattedAddress
              }
              onChange(formattedAddress, place)
              
              // Fin de sélection
              setTimeout(() => {
                setIsSelecting(false)
              }, 100)
            } else {
              setIsSelecting(false)
            }
          })

          setIsLoaded(true)
          setIsInitialized(true)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement Google Maps'
        console.error('[ARRIVEE] Error loading Google Maps:', errorMessage)
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
    console.log('🔵 [ARRIVEE] USER TYPING - New value:', newValue, 'Previous internal:', internalValue)
    console.log('🔵 [ARRIVEE] ⚠️ ATTENTION: Je vais déclencher onChange qui pourrait affecter le composant DEPART')
    
    setInternalValue(newValue)
    console.log('🔵 [ARRIVEE] Called setInternalValue with:', newValue)
    
    onChange(newValue)
    console.log('🔵 [ARRIVEE] ✅ Called onChange with:', newValue, '- Ceci pourrait causer un re-render du parent')
    
    if (error) {
      setError('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && autocompleteRef.current) {
      e.preventDefault()
    }
  }

  // Synchroniser avec ce que Google Maps a mis dans l'input
  useEffect(() => {
    if (inputRef.current && !isSelecting) {
      const currentInputValue = inputRef.current.value
      console.log('🔵 [ARRIVEE] RENDER - Current input value:', currentInputValue, 'Internal value:', internalValue)
      
      if (currentInputValue !== internalValue && currentInputValue.length > internalValue.length) {
        // Seulement si Google Maps a AJOUTÉ du contenu (autocomplétion)
        console.log('🔵 [ARRIVEE] GOOGLE AUTOCOMPLETE DETECTED - Input expanded from', internalValue, 'to', currentInputValue)
        setInternalValue(currentInputValue)
        
        // Géocoder l'adresse pour obtenir les placeDetails
        if (window.google?.maps?.Geocoder) {
          const geocoder = new window.google.maps.Geocoder()
          geocoder.geocode({ address: currentInputValue }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              console.log('🔵 [ARRIVEE] GEOCODING SUCCESS for:', currentInputValue)
              const place = results[0]
              onChange(currentInputValue, place)
            } else {
              console.log('🔵 [ARRIVEE] GEOCODING FAILED for:', currentInputValue)
              onChange(currentInputValue) // Sans placeDetails
            }
          })
        } else {
          onChange(currentInputValue) // Sans placeDetails si pas de geocoder
        }
      } else if (currentInputValue !== internalValue && currentInputValue.length < internalValue.length) {
        // Si l'input a été raccourci, on force notre valeur
        console.log('🔵 [ARRIVEE] INPUT SHORTENED - Forcing back to:', internalValue)
        inputRef.current.value = internalValue
      }
    }
  })

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        id="arrivee"
        name="arrivee"
        defaultValue={internalValue} // defaultValue au lieu de value
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Tapez votre adresse d'arrivée..."
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
