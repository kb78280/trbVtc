'use client'
import { useEffect, useRef, useState } from 'react'
import { googleMapsService } from '@/lib/googleMaps'

interface ArrivalAutocompleteProps {
  value: string // Utilisé uniquement pour l'initialisation
  onChange: (value: string, placeDetails?: google.maps.places.PlaceResult, isAutocompleted?: boolean) => void
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
  const [isAutocompleted, setIsAutocompleted] = useState(false) // Suivi de l'état d'autocomplétion
  const [isClient, setIsClient] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  // Protection contre l'hydratation mismatch
  useEffect(() => {
    setIsClient(true)
  }, [])

  // AUCUNE synchronisation externe - complètement isolé
  // Le composant gère son propre état sans écouter les props

  useEffect(() => {
    if (!isClient) return
    const initializeAutocomplete = async () => {
      try {
        await googleMapsService.loadGoogleMaps()

        if (inputRef.current) {
          const autocomplete = googleMapsService.createAutocomplete(inputRef.current)
          autocompleteRef.current = autocomplete

          autocomplete.addListener('place_changed', () => {
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
              return
            }

            setError('')
            const formattedAddress = place.formatted_address || ''
            
            if (formattedAddress) {
              console.log('🔵 [ARRIVEE] ✅ AUTOCOMPLETE SUCCESS:', formattedAddress)
              setInternalValue(formattedAddress)
              setIsAutocompleted(true) // Marquer comme autocompléé
              // Forcer la mise à jour de l'input HTML aussi
              if (inputRef.current) {
                inputRef.current.value = formattedAddress
              }
              onChange(formattedAddress, place, true) // Indiquer que c'est autocompléé
              
              setTimeout(() => {
              }, 100)
            } else {
            }
          })

          setIsLoaded(true)
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
  }, [isClient, onChange, onError])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    console.log('🔵 [ARRIVEE] 👤 USER TYPING:', newValue)
    
    setInternalValue(newValue)
    setIsAutocompleted(false) // Réinitialiser l'état d'autocomplétion
    onChange(newValue, undefined, false) // Pas autocompléé
    
    if (error) {
      setError('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && autocompleteRef.current) {
      e.preventDefault()
    }
  }

  // Solution simple : garder la valeur stable après autocomplétion
  useEffect(() => {
    if (inputRef.current && isAutocompleted) {
      // Si on a été autocompléé, forcer la valeur stable
      if (inputRef.current.value !== internalValue) {
        console.log('🔵 [ARRIVEE] PROTECTING AUTOCOMPLETED VALUE - Restoring:', internalValue)
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
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${className}`}
        required={required}
        disabled={disabled || !isLoaded}
        autoComplete="off"
        suppressHydrationWarning
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
