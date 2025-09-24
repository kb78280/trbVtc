'use client'

import { useState, useEffect } from 'react'

interface Vehicle {
  id: number
  nom: string
  plaque_immatriculation: string
}

interface Pricing {
  id: number
  vehicle_id: number
  prix_km: number
  tarif_base: number
  tva: number
  created_at: string
  updated_at: string
  vehicle?: Vehicle
}

export default function PricingManagement() {
  const [pricings, setPricings] = useState<Pricing[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPricing, setEditingPricing] = useState<Pricing | null>(null)
  const [formData, setFormData] = useState({
    vehicle_id: '',
    prix_km: '',
    tarif_base: '',
    tva: ''
  })
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([fetchPricings(), fetchVehicles()])
  }, [])

  const fetchPricings = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/pricing', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPricings(data)
      } else {
        setError('Erreur lors du chargement des prix')
      }
    } catch {
      setError('Erreur de connexion')
    }
  }

  const fetchVehicles = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/vehicles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setVehicles(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des véhicules')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const token = localStorage.getItem('adminToken')
      const url = editingPricing 
        ? `/api/admin/pricing/${editingPricing.id}`
        : '/api/admin/pricing'
      
      const method = editingPricing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicle_id: parseInt(formData.vehicle_id),
          prix_km: parseFloat(formData.prix_km),
          tarif_base: parseFloat(formData.tarif_base),
          tva: parseFloat(formData.tva)
        })
      })

      if (response.ok) {
        await fetchPricings()
        handleCloseModal()
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Erreur lors de la sauvegarde')
      }
    } catch {
      setError('Erreur de connexion')
    }
  }

  const handleEdit = (pricing: Pricing) => {
    setEditingPricing(pricing)
    setFormData({
      vehicle_id: pricing.vehicle_id.toString(),
      prix_km: pricing.prix_km.toString(),
      tarif_base: pricing.tarif_base.toString(),
      tva: pricing.tva.toString()
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce tarif ?')) {
      return
    }

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/pricing/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await fetchPricings()
      } else {
        setError('Erreur lors de la suppression')
      }
    } catch {
      setError('Erreur de connexion')
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingPricing(null)
    setFormData({
      vehicle_id: '',
      prix_km: '',
      tarif_base: '',
      tva: ''
    })
    setError('')
  }

  const handleAddNew = () => {
    setEditingPricing(null)
    setFormData({
      vehicle_id: '',
      prix_km: '',
      tarif_base: '',
      tva: '20'
    })
    setShowModal(true)
  }

  const getVehicleName = (vehicleId: number) => {
    const vehicle = vehicles.find(v => v.id === vehicleId)
    return vehicle ? `${vehicle.nom} (${vehicle.plaque_immatriculation})` : 'Véhicule inconnu'
  }

  const getAvailableVehicles = () => {
    if (editingPricing) {
      // En mode édition, on peut garder le véhicule actuel
      return vehicles
    }
    // En mode création, on ne montre que les véhicules sans tarif
    const vehiclesWithPricing = pricings.map(p => p.vehicle_id)
    return vehicles.filter(v => !vehiclesWithPricing.includes(v.id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Gestion des Prix
          </h3>
          <button
            onClick={handleAddNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            disabled={getAvailableVehicles().length === 0}
          >
            Ajouter un tarif
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {getAvailableVehicles().length === 0 && !editingPricing && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-4">
            Tous les véhicules ont déjà un tarif configuré. Ajoutez d'abord de nouveaux véhicules.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Véhicule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix/km (€)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarif de base (€)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TVA (%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pricings.map((pricing) => (
                <tr key={pricing.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {getVehicleName(pricing.vehicle_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pricing.prix_km.toFixed(2)} €
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pricing.tarif_base.toFixed(2)} €
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pricing.tva} %
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(pricing)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(pricing.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pricings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun tarif configuré
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingPricing ? 'Modifier le tarif' : 'Ajouter un tarif'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Véhicule
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.vehicle_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicle_id: e.target.value }))}
                  >
                    <option value="">Sélectionner un véhicule</option>
                    {getAvailableVehicles().map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.nom} ({vehicle.plaque_immatriculation})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix par kilomètre (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.prix_km}
                    onChange={(e) => setFormData(prev => ({ ...prev, prix_km: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tarif de base (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.tarif_base}
                    onChange={(e) => setFormData(prev => ({ ...prev, tarif_base: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    TVA (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.tva}
                    onChange={(e) => setFormData(prev => ({ ...prev, tva: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                  >
                    {editingPricing ? 'Modifier' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
