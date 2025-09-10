'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contactSchema, type ContactFormData } from '@/lib/validation'
import { CSRFProtection, RateLimiter, SecurityMonitor, HoneypotProtection } from '@/lib/security'

export default function SecureContactForm() {
  const [mounted, setMounted] = useState(false)
  const [csrfToken, setCsrfToken] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [rateLimitInfo, setRateLimitInfo] = useState<{ blocked: boolean; timeLeft: number }>({
    blocked: false,
    timeLeft: 0
  })

  const honeypot = HoneypotProtection.createHoneypot()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema)
  })

  useEffect(() => {
    setMounted(true)
    const token = CSRFProtection.setToken()
    setCsrfToken(token)
    
    // Vérifier le rate limiting
    const checkRateLimit = () => {
      const canSubmit = RateLimiter.canSubmit('contact')
      if (!canSubmit) {
        const timeLeft = RateLimiter.getTimeUntilNextSubmission('contact')
        setRateLimitInfo({ blocked: true, timeLeft })
      }
    }
    
    checkRateLimit()
    const interval = setInterval(checkRateLimit, 60000)
    
    return () => clearInterval(interval)
  }, [])

  const onSubmit = async (data: ContactFormData) => {
    try {
      setIsSubmitting(true)
      setSubmitError('')
      setSubmitSuccess(false)

      // Vérification CSRF
      if (!CSRFProtection.validateToken(csrfToken)) {
        throw new Error('Token CSRF invalide. Veuillez recharger la page.')
      }

      // Vérification rate limiting
      if (!RateLimiter.canSubmit('contact')) {
        throw new Error('Trop de tentatives. Veuillez patienter avant de soumettre à nouveau.')
      }

      // Vérification honeypot
      const honeypotField = document.querySelector(`input[name="${honeypot.name}"]`) as HTMLInputElement
      if (HoneypotProtection.isBot(honeypotField?.value || '')) {
        SecurityMonitor.logSuspiciousActivity('honeypot', 'Bot détecté via honeypot')
        throw new Error('Soumission invalide.')
      }

      // Détection de contenu suspect
      const allValues = Object.values(data).join(' ')
      if (SecurityMonitor.detectSuspiciousContent(allValues)) {
        SecurityMonitor.logSuspiciousActivity('malicious_content', allValues)
        throw new Error('Contenu suspect détecté.')
      }

      // Validation des données côté client
      const validatedData = contactSchema.parse(data)

      // Simulation d'envoi (remplacer par votre API)
      console.log('Message de contact validé et sécurisé:', validatedData)
      
      // Enregistrer la soumission pour le rate limiting
      RateLimiter.recordSubmission('contact')
      
      // Simuler un délai d'API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSubmitSuccess(true)
      reset()
      
      // Générer un nouveau token CSRF
      const newToken = CSRFProtection.setToken()
      setCsrfToken(newToken)
      
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      setSubmitError(error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!mounted) {
    return (
      <div className="animate-pulse">
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Envoyez-nous un message sécurisé
      </h2>
      
      {/* Affichage des erreurs de rate limiting */}
      {rateLimitInfo.blocked && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">
            Trop de tentatives de soumission. Veuillez patienter {Math.ceil(rateLimitInfo.timeLeft / 60000)} minute(s).
          </p>
        </div>
      )}

      {/* Message de succès */}
      {submitSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-700">
            ✅ Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Champ honeypot caché */}
        <input
          name={honeypot.name}
          style={honeypot.style}
          tabIndex={-1}
          autoComplete="off"
        />
        
        {/* Token CSRF caché */}
        <input type="hidden" value={csrfToken} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-1">
              Prénom *
            </label>
            <input
              {...register('prenom')}
              type="text"
              id="prenom"
              className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 ${
                errors.prenom ? 'border-red-500' : ''
              }`}
              disabled={rateLimitInfo.blocked || isSubmitting}
            />
            {errors.prenom && (
              <p className="mt-1 text-sm text-red-600">{errors.prenom.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
              Nom *
            </label>
            <input
              {...register('nom')}
              type="text"
              id="nom"
              className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 ${
                errors.nom ? 'border-red-500' : ''
              }`}
              disabled={rateLimitInfo.blocked || isSubmitting}
            />
            {errors.nom && (
              <p className="mt-1 text-sm text-red-600">{errors.nom.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 ${
              errors.email ? 'border-red-500' : ''
            }`}
            disabled={rateLimitInfo.blocked || isSubmitting}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1">
            Téléphone
          </label>
          <input
            {...register('telephone')}
            type="tel"
            id="telephone"
            className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 ${
              errors.telephone ? 'border-red-500' : ''
            }`}
            disabled={rateLimitInfo.blocked || isSubmitting}
          />
          {errors.telephone && (
            <p className="mt-1 text-sm text-red-600">{errors.telephone.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="sujet" className="block text-sm font-medium text-gray-700 mb-1">
            Sujet *
          </label>
          <select
            {...register('sujet')}
            id="sujet"
            className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 ${
              errors.sujet ? 'border-red-500' : ''
            }`}
            disabled={rateLimitInfo.blocked || isSubmitting}
          >
            <option value="">Sélectionnez un sujet</option>
            <option value="reservation">Réservation</option>
            <option value="information">Demande d'information</option>
            <option value="reclamation">Réclamation</option>
            <option value="partenariat">Partenariat</option>
            <option value="autre">Autre</option>
          </select>
          {errors.sujet && (
            <p className="mt-1 text-sm text-red-600">{errors.sujet.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message *
          </label>
          <textarea
            {...register('message')}
            id="message"
            rows={5}
            placeholder="Votre message..."
            className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 ${
              errors.message ? 'border-red-500' : ''
            }`}
            disabled={rateLimitInfo.blocked || isSubmitting}
          />
          {errors.message && (
            <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
          )}
        </div>

        {/* Affichage des erreurs */}
        {submitError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{submitError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={rateLimitInfo.blocked || isSubmitting}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Envoi en cours...
            </span>
          ) : (
            'Envoyer le message'
          )}
        </button>

        {/* Info sécurité */}
        <div className="text-center text-sm text-gray-500">
          <p>🔒 Formulaire sécurisé - Vos données sont protégées</p>
        </div>
      </form>
    </div>
  )
}
