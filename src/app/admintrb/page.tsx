'use client'

import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'

interface Reservation {
  id: number
  service_type: string
  vehicle_type: string
  departure_address: string
  arrival_address: string
  duration_hours: number | null
  reservation_date: string
  reservation_time: string
  passenger_count: number
  baggage_count: number
  payment_method: string
  comments: string | null
  estimated_price: string
  distance_km: number | null
  created_at: string
  first_name: string
  last_name: string
  phone: string
  email: string
  nombre_reservations: number
  child_seat_quantity: number
  flower_bouquet: boolean
  airport_assistance: boolean
  waypoints: Array<{
    waypoint_order: number
    address: string
  }>
}

interface Vehicle {
  id: number
  nom: string
  plaque: string
  nombre_places: number
  nombre_bagages: number
  type: 'confort' | 'van'
  prix_base_mad: string
  taux_km: string
  created_at: string
  updated_at: string
}

interface ApiResponse {
  success: boolean
  data: Reservation[]
  pagination: {
    current_page: number
    per_page: number
    total: number
    total_pages: number
  }
  message: string
}

interface VehicleApiResponse {
  success: boolean
  data: Vehicle[]
  pagination: {
    current_page: number
    per_page: number
    total: number
    total_pages: number
  }
  message: string
}

export default function AdminPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [authLoading, setAuthLoading] = useState<boolean>(true)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalReservations, setTotalReservations] = useState<number>(0)
  
  // États pour les véhicules
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehiclesLoading, setVehiclesLoading] = useState<boolean>(false)
  const [showVehicleForm, setShowVehicleForm] = useState<boolean>(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [activeTab, setActiveTab] = useState<'reservations' | 'vehicles'>('reservations')
  
  // États pour le formulaire véhicule
  const [vehicleForm, setVehicleForm] = useState({
    nom: '',
    plaque: '',
    nombre_places: 4,
    nombre_bagages: 0,
    type: 'confort' as 'confort' | 'van',
    prix_base_mad: 45.00,
    taux_km: 1.20
  })

  // États pour le changement de mot de passe
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordLoading, setPasswordLoading] = useState<boolean>(false)

  const fetchReservations = async (page: number = 1) => {
    try {
      setLoading(true)
      const response = await fetch(`https://vtc-transport-conciergerie.fr/api-php/get-reservations.php?page=${page}&limit=20`)
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }
      
      const data: ApiResponse = await response.json()
      
      if (data.success) {
        setReservations(data.data)
        setCurrentPage(data.pagination.current_page)
        setTotalPages(data.pagination.total_pages)
        setTotalReservations(data.pagination.total)
        setError(null)
      } else {
        throw new Error(data.message || 'Erreur lors de la récupération des réservations')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      console.error('Erreur lors de la récupération des réservations:', err)
    } finally {
      setLoading(false)
    }
  }

  // Vérification de l'authentification
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('admin_token')
      
      if (!token) {
        router.push('/login')
        return
      }
      
      try {
        // Décoder le JWT pour vérifier l'expiration
        const payload = JSON.parse(atob(token.split('.')[1]))
        
        if (payload.exp < Date.now() / 1000) {
          // Token expiré
          localStorage.removeItem('admin_token')
          router.push('/login')
          return
        }
        
        setIsAuthenticated(true)
      } catch (e) {
        // Token invalide
        localStorage.removeItem('admin_token')
        router.push('/login')
        return
      } finally {
        setAuthLoading(false)
      }
    }
    
    checkAuth()
  }, [router])

  useEffect(() => {
    if (isAuthenticated) {
      fetchReservations()
      fetchVehicles()
    }
  }, [isAuthenticated])

  // Fonction pour récupérer les véhicules
  const fetchVehicles = async () => {
    try {
      setVehiclesLoading(true)
      const response = await fetch('https://vtc-transport-conciergerie.fr/api-php/vehicles.php')
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }
      
      const data: VehicleApiResponse = await response.json()
      
      if (data.success) {
        setVehicles(data.data)
      } else {
        throw new Error(data.message || 'Erreur lors de la récupération des véhicules')
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des véhicules:', err)
    } finally {
      setVehiclesLoading(false)
    }
  }

  // Fonction pour créer/modifier un véhicule
  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingVehicle 
        ? `https://vtc-transport-conciergerie.fr/api-php/vehicles.php/${editingVehicle.id}`
        : 'https://vtc-transport-conciergerie.fr/api-php/vehicles.php'
      
      const method = editingVehicle ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleForm)
      })
      
      const result = await response.json()
      
      if (result.success) {
        fetchVehicles() // Recharger la liste
        resetVehicleForm()
        alert(editingVehicle ? 'Véhicule modifié avec succès!' : 'Véhicule créé avec succès!')
      } else {
        throw new Error(result.message || 'Erreur lors de la sauvegarde')
      }
    } catch (err) {
      alert('Erreur: ' + (err instanceof Error ? err.message : 'Erreur inconnue'))
    }
  }

  // Fonction pour supprimer un véhicule
  const handleDeleteVehicle = async (vehicleId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
      return
    }
    
    try {
      const response = await fetch(`https://vtc-transport-conciergerie.fr/api-php/vehicles.php/${vehicleId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        fetchVehicles() // Recharger la liste
        alert('Véhicule supprimé avec succès!')
      } else {
        throw new Error(result.message || 'Erreur lors de la suppression')
      }
    } catch (err) {
      alert('Erreur: ' + (err instanceof Error ? err.message : 'Erreur inconnue'))
    }
  }

  // Fonction pour éditer un véhicule
  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setVehicleForm({
      nom: vehicle.nom,
      plaque: vehicle.plaque,
      nombre_places: vehicle.nombre_places,
      nombre_bagages: vehicle.nombre_bagages,
      type: vehicle.type,
      prix_base_mad: parseFloat(vehicle.prix_base_mad) || 0,
      taux_km: parseFloat(vehicle.taux_km) || 0
    })
    setShowVehicleForm(true)
  }

  // Fonction pour réinitialiser le formulaire
  const resetVehicleForm = () => {
    setVehicleForm({
      nom: '',
      plaque: '',
      nombre_places: 4,
      nombre_bagages: 0,
      type: 'confort',
      prix_base_mad: 45.00,
      taux_km: 1.20
    })
    setEditingVehicle(null)
    setShowVehicleForm(false)
  }

  const formatDateTime = (date: string, time: string) => {
    try {
      const dateTime = new Date(`${date}T${time}`)
      return format(dateTime, 'dd/MM/yyyy à HH:mm', { locale: fr })
    } catch {
      return `${date} à ${time}`
    }
  }

  const formatCreatedAt = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, 'dd/MM/yyyy HH:mm', { locale: fr })
    } catch {
      return dateString
    }
  }

  const getServiceTypeLabel = (type: string) => {
    return type === 'transfert' ? 'Transfert' : 'Mise à disposition'
  }

  const getVehicleTypeLabel = (type: string) => {
    return type === 'berline' ? 'Berline' : 'Van'
  }

  const getPaymentMethodLabel = (method: string) => {
    return method === 'immediate' ? 'Paiement immédiat' : 'Paiement sur place'
  }

  // Fonction de déconnexion
  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    toast.success('Déconnexion réussie')
    router.push('/login')
  }

  // Fonction de changement de mot de passe
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Les nouveaux mots de passe ne correspondent pas')
      return
    }
    
    if (passwordForm.newPassword.length < 8) {
      toast.error('Le nouveau mot de passe doit contenir au moins 8 caractères')
      return
    }
    
    setPasswordLoading(true)
    
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch('https://vtc-transport-conciergerie.fr/api-php/auth.php/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Mot de passe mis à jour avec succès')
        setShowPasswordModal(false)
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        throw new Error(result.message || result.error || 'Erreur lors du changement de mot de passe')
      }
    } catch (error) {
      console.error('Erreur changement mot de passe:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors du changement de mot de passe')
    } finally {
      setPasswordLoading(false)
    }
  }

  const resetPasswordForm = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // La redirection vers /login est gérée dans useEffect
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des réservations...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ Erreur</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchReservations()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header Mobile First */}
        <div className="mb-6 sm:mb-8">
          {/* Title and Actions */}
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-start sm:space-y-0">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Administration VTC</h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
                Gestion des réservations et véhicules
              </p>
            </div>
            
            {/* Action Buttons - Mobile First */}
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center justify-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 01-2 2M9 9a2 2 0 000 4m0 0a2 2 0 100 4m0-4h6m-6 0h6" />
                </svg>
                <span className="hidden sm:inline">Changer mot de passe</span>
                <span className="sm:hidden">Mot de passe</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Déconnexion
              </button>
            </div>
          </div>
          
          {/* Onglets Mobile First */}
          <div className="mt-4 sm:mt-6 border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('reservations')}
                className={`flex-1 sm:flex-none py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm text-center ${
                  activeTab === 'reservations'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="block sm:inline">📋</span>
                <span className="block sm:inline sm:ml-1">Réservations</span>
                <span className="block sm:inline text-xs">({totalReservations})</span>
              </button>
              <button
                onClick={() => setActiveTab('vehicles')}
                className={`flex-1 sm:flex-none py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm text-center ${
                  activeTab === 'vehicles'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="block sm:inline">🚗</span>
                <span className="block sm:inline sm:ml-1">Véhicules</span>
                <span className="block sm:inline text-xs">({vehicles.length})</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Contenu selon l'onglet actif */}
        {activeTab === 'reservations' && (
          <>
            {/* Stats Mobile First */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
              <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{totalReservations}</div>
                <div className="text-xs sm:text-sm text-gray-600">Réservations totales</div>
              </div>
              <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {reservations.filter(r => r.payment_method === 'immediate').length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Payées immédiatement</div>
              </div>
              <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-xl sm:text-2xl font-bold text-orange-600">
                  {reservations.filter(r => r.payment_method === 'sur-place').length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">À payer sur place</div>
              </div>
              <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200 col-span-2 lg:col-span-1">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">
                  {reservations.reduce((sum, r) => sum + (parseFloat(r.estimated_price) || 0), 0).toFixed(2)}€
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Chiffre d'affaires estimé</div>
              </div>
            </div>

        {/* Réservations - Mobile First */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
          {/* Version Mobile - Cards */}
          <div className="block lg:hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Réservations récentes</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-gray-900">#{reservation.id}</div>
                    <div className="text-sm font-bold text-purple-600">
                      {(parseFloat(reservation.estimated_price) || 0).toFixed(2)}€
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 w-16">Client:</span>
                      <div className="flex items-center">
                        <span className="text-gray-900 font-medium">
                          {reservation.first_name} {reservation.last_name}
                        </span>
                        {reservation.nombre_reservations > 1 && (
                          <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {reservation.nombre_reservations}e résa
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 w-16">Service:</span>
                      <div className="flex items-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          reservation.service_type === 'transfert' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {getServiceTypeLabel(reservation.service_type)}
                        </span>
                        <span className="ml-2 text-gray-600">
                          {getVehicleTypeLabel(reservation.vehicle_type)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <span className="text-gray-500">Trajet:</span>
                      <div className="text-gray-900 text-xs mt-1">
                        <div>🟢 {reservation.departure_address}</div>
                        <div>🔴 {reservation.arrival_address}</div>
                      </div>
                    </div>
                    
                    {/* Informations spécifiques selon le type de service */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">👥 Passagers:</span>
                        <span className="ml-1 text-gray-900 font-medium">{reservation.passenger_count}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">🧳 Bagages:</span>
                        <span className="ml-1 text-gray-900 font-medium">{reservation.baggage_count}</span>
                      </div>
                      {reservation.service_type === 'mise-a-disposition' && reservation.duration_hours && (
                        <div className="col-span-2">
                          <span className="text-gray-500">⏱️ Durée:</span>
                          <span className="ml-1 text-gray-900 font-medium">{reservation.duration_hours}h</span>
                        </div>
                      )}
                      {reservation.service_type === 'transfert' && reservation.distance_km && (
                        <div className="col-span-2">
                          <span className="text-gray-500">📏 Distance:</span>
                          <span className="ml-1 text-gray-900 font-medium">{reservation.distance_km} km</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Services supplémentaires */}
                    {(reservation.child_seat_quantity > 0 || reservation.flower_bouquet || reservation.airport_assistance) && (
                      <div className="text-xs text-gray-600 mt-2 space-y-1">
                        <div className="font-medium text-gray-700">Services supplémentaires:</div>
                        {reservation.child_seat_quantity > 0 && (
                          <div>🍼 {reservation.child_seat_quantity} siège{reservation.child_seat_quantity > 1 ? 's' : ''} enfant</div>
                        )}
                        {reservation.flower_bouquet && (
                          <div>💐 Bouquet de fleurs</div>
                        )}
                        {reservation.airport_assistance && (
                          <div>✈️ Assistance aéroport</div>
                        )}
                      </div>
                    )}
                    
                    {/* Commentaires */}
                    {reservation.comments && (
                      <div className="text-xs bg-gray-50 p-2 rounded border-l-2 border-gray-300 mt-2">
                        <div className="font-medium text-gray-700 mb-1">💬 Commentaires:</div>
                        <div className="text-gray-600 italic">{reservation.comments}</div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-sm">
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <span className="text-gray-900 ml-1">
                          {format(new Date(reservation.reservation_date), 'dd/MM/yyyy', { locale: fr })} à {reservation.reservation_time}
                        </span>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        reservation.payment_method === 'immediate' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getPaymentMethodLabel(reservation.payment_method)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Version Desktop - Table */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trajet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date/Heure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paiement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créée le
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{reservation.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 flex items-center">
                        {reservation.first_name} {reservation.last_name}
                        {reservation.nombre_reservations > 1 && (
                          <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {reservation.nombre_reservations}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{reservation.email}</div>
                      <div className="text-sm text-gray-500">{reservation.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getServiceTypeLabel(reservation.service_type)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getVehicleTypeLabel(reservation.vehicle_type)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        👥 {reservation.passenger_count} passager{reservation.passenger_count > 1 ? 's' : ''} • 
                        🧳 {reservation.baggage_count} bagage{reservation.baggage_count > 1 ? 's' : ''}
                        {reservation.duration_hours && (
                          <> • ⏱️ {reservation.duration_hours}h</>
                        )}
                      </div>
                      {/* Services supplémentaires pour desktop */}
                      {(reservation.child_seat_quantity > 0 || reservation.flower_bouquet || reservation.airport_assistance) && (
                        <div className="text-xs text-blue-600 mt-1 space-x-2">
                          {reservation.child_seat_quantity > 0 && (
                            <span>🍼{reservation.child_seat_quantity}</span>
                          )}
                          {reservation.flower_bouquet && (
                            <span>💐</span>
                          )}
                          {reservation.airport_assistance && (
                            <span>✈️</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={reservation.departure_address}>
                        🏠 {reservation.departure_address}
                      </div>
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={reservation.arrival_address}>
                        🎯 {reservation.arrival_address}
                      </div>
                      {reservation.distance_km && (
                        <div className="text-sm text-gray-500">
                          📏 {reservation.distance_km} km
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(reservation.reservation_date, reservation.reservation_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        reservation.payment_method === 'immediate'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {getPaymentMethodLabel(reservation.payment_method)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {(parseFloat(reservation.estimated_price) || 0).toFixed(2)}€
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCreatedAt(reservation.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
          
          {/* Pagination Mobile First */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200">
              {/* Mobile Pagination */}
              <div className="flex justify-between items-center lg:hidden">
                <button
                  onClick={() => fetchReservations(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Précédent
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} sur {totalPages}
                </span>
                <button
                  onClick={() => fetchReservations(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant →
                </button>
              </div>
              
              {/* Desktop Pagination */}
              <div className="hidden lg:flex lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Affichage de <span className="font-medium">{(currentPage - 1) * 20 + 1}</span> à{' '}
                    <span className="font-medium">{Math.min(currentPage * 20, totalReservations)}</span> sur{' '}
                    <span className="font-medium">{totalReservations}</span> résultats
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => fetchReservations(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ←
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i
                      if (pageNum > totalPages) return null
                      return (
                        <button
                          key={pageNum}
                          onClick={() => fetchReservations(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === currentPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => fetchReservations(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      →
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

            {reservations.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg">Aucune réservation trouvée</div>
              </div>
            )}
          </>
        )}

        {/* Section Véhicules Mobile First */}
        {activeTab === 'vehicles' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Header avec bouton d'ajout - Mobile First */}
            <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 text-center sm:text-left">
                Gestion des Véhicules ({vehicles.length})
              </h3>
              <button
                onClick={() => setShowVehicleForm(true)}
                className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                <span className="sm:hidden">➕ Ajouter</span>
                <span className="hidden sm:inline">➕ Ajouter un véhicule</span>
              </button>
            </div>

            {/* Formulaire véhicule - Mobile First */}
            {showVehicleForm && (
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-base sm:text-lg font-medium text-gray-900">
                    {editingVehicle ? 'Modifier le véhicule' : 'Ajouter un nouveau véhicule'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setShowVehicleForm(false)
                      resetVehicleForm()
                    }}
                    className="text-gray-400 hover:text-gray-600 sm:hidden"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={handleVehicleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom/Modèle *
                      </label>
                      <input
                        type="text"
                        value={vehicleForm.nom}
                        onChange={(e) => setVehicleForm({...vehicleForm, nom: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: Mercedes Classe E"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Plaque d'immatriculation *
                      </label>
                      <input
                        type="text"
                        value={vehicleForm.plaque}
                        onChange={(e) => setVehicleForm({...vehicleForm, plaque: e.target.value.toUpperCase()})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: AB-123-CD"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre de places *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={vehicleForm.nombre_places}
                        onChange={(e) => setVehicleForm({...vehicleForm, nombre_places: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre de bagages
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={vehicleForm.nombre_bagages}
                        onChange={(e) => setVehicleForm({...vehicleForm, nombre_bagages: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type de véhicule *
                      </label>
                      <select
                        value={vehicleForm.type}
                        onChange={(e) => setVehicleForm({...vehicleForm, type: e.target.value as 'confort' | 'van'})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="confort">Confort</option>
                        <option value="van">Van</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prix base MAD (€/heure) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={vehicleForm.prix_base_mad}
                        onChange={(e) => setVehicleForm({...vehicleForm, prix_base_mad: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="45.00"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Prix par heure pour mise à disposition</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Taux au km (€/km) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={vehicleForm.taux_km}
                        onChange={(e) => setVehicleForm({...vehicleForm, taux_km: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="1.20"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Prix par kilomètre parcouru</p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-800">
                          <strong>Info TVA :</strong> La TVA sera gérée automatiquement selon le type de service (transfert ou mise à disposition).
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-3 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-3">
                    <button
                      type="button"
                      onClick={resetVehicleForm}
                      className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm sm:text-base"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm sm:text-base"
                    >
                      {editingVehicle ? 'Modifier' : 'Ajouter'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Liste des véhicules - Mobile First */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
              {/* Version Mobile - Cards */}
              <div className="block lg:hidden">
                <div className="p-4 border-b border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900">Véhicules ({vehicles.length})</h4>
                </div>
                <div className="divide-y divide-gray-200">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h5 className="font-medium text-gray-900">{vehicle.nom}</h5>
                          <p className="text-sm text-gray-500">{vehicle.plaque}</p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          vehicle.type === 'confort' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {vehicle.type === 'confort' ? 'Confort' : 'Van'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">Places:</span>
                          <span className="ml-1 font-medium">{vehicle.nombre_places}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Bagages:</span>
                          <span className="ml-1 font-medium">{vehicle.nombre_bagages}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Prix MAD:</span>
                          <span className="ml-1 font-medium">{(parseFloat(vehicle.prix_base_mad) || 0).toFixed(2)}€/h</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Taux km:</span>
                          <span className="ml-1 font-medium">{(parseFloat(vehicle.taux_km) || 0).toFixed(2)}€/km</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditVehicle(vehicle)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteVehicle(vehicle.id)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Version Desktop - Table */}
              <div className="hidden lg:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Véhicule
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plaque
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Capacité
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tarification
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Créé le
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {vehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{vehicle.nom}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-mono">{vehicle.plaque}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            👥 {vehicle.nombre_places} places
                          </div>
                          <div className="text-sm text-gray-500">
                            🧳 {vehicle.nombre_bagages} bagages
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            vehicle.type === 'confort'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {vehicle.type === 'confort' ? '🚗 Confort' : '🚐 Van'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            💰 {(parseFloat(vehicle.prix_base_mad) || 0).toFixed(2)}€/h
                          </div>
                          <div className="text-sm text-gray-500">
                            📏 {(parseFloat(vehicle.taux_km) || 0).toFixed(2)}€/km
                          </div>
                          <div className="text-sm text-gray-400 italic">
                            📊 TVA selon service
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCreatedAt(vehicle.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditVehicle(vehicle)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              ✏️ Modifier
                            </button>
                            <button
                              onClick={() => handleDeleteVehicle(vehicle.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              🗑️ Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {vehicles.length === 0 && !vehiclesLoading && (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg">Aucun véhicule trouvé</div>
                <button
                  onClick={() => setShowVehicleForm(true)}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ajouter le premier véhicule
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de changement de mot de passe - Mobile First */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm sm:max-w-md mx-auto bg-white shadow-lg rounded-lg border border-gray-200">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                  Changer le mot de passe
                </h3>
                <button
                  onClick={() => {
                    setShowPasswordModal(false)
                    resetPasswordForm()
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe actuel *
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={passwordLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nouveau mot de passe *
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    minLength={8}
                    required
                    disabled={passwordLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Au moins 8 caractères</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmer le nouveau mot de passe *
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={passwordLoading}
                  />
                </div>

                <div className="flex flex-col space-y-3 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false)
                      resetPasswordForm()
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors text-sm sm:text-base"
                    disabled={passwordLoading}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className={`w-full sm:w-auto px-4 py-2 rounded-md transition-colors text-sm sm:text-base ${
                      passwordLoading
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {passwordLoading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="hidden sm:inline">Mise à jour...</span>
                        <span className="sm:hidden">Mise à jour</span>
                      </div>
                    ) : (
                      <>
                        <span className="hidden sm:inline">Changer le mot de passe</span>
                        <span className="sm:hidden">Changer</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      <Toaster 
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerStyle={{
          top: 20,
        }}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '90vw',
            wordBreak: 'break-word'
          }
        }}
      />
    </div>
  )
}
