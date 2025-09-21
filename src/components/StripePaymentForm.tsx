'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined')
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

interface StripeCheckoutFormProps {
  clientSecret: string
  amount: number
  onSuccess: () => void
  onError: (error: string) => void
}

const CheckoutForm = ({ amount, onSuccess, onError }: StripeCheckoutFormProps) => {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/confirmation`,
        },
      })

      if (error) {
        onError(error.message || 'Une erreur est survenue lors du paiement.')
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess()
      } else {
        onError('Le paiement n\'a pas pu être confirmé.')
      }
    } catch (e) {
      onError('Une erreur inattendue est survenue.')
    }

    setIsProcessing(false)
  }

  return (
    <div className="w-full">
      <div className="stripe-element-container">
        <style jsx global>{`
          form > div > div.AnimatePresence {
            display: none !important;
          }
          form > div > div[class*="LinkAuthentication"] {
            display: none !important;
          }
        `}</style>
        <PaymentElement className="mb-6" />
      </div>
      <button
        onClick={handleSubmit}
        type="button"
        disabled={!stripe || isProcessing}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium
                 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Traitement en cours...' : `Payer ${(amount / 100).toFixed(2)} €`}
      </button>
    </div>
  )
}

interface StripePaymentFormProps {
  amount: number
  onSuccess: () => void
  onError: (error: string) => void
}

export default function StripePaymentForm({ amount, onSuccess, onError }: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string>('')

  useEffect(() => {
    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          onError(data.error)
        } else {
          setClientSecret(data.clientSecret)
        }
      })
      .catch(() => {
        onError('Erreur lors de l\'initialisation du paiement.')
      })
  }, [amount, onError])

  if (!clientSecret) {
    return (
      <div className="w-full h-32 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#2563eb',
          },
        }
      }}
    >
      <CheckoutForm
        clientSecret={clientSecret}
        amount={amount}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  )
}