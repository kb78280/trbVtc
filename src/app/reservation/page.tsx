import SecureReservationForm from '@/components/SecureReservationForm'

export const metadata = {
  title: 'Réservation - VTC Paris',
  description: 'Réservez votre chauffeur VTC à Paris en quelques clics',
}

export default function ReservationPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="relative bg-blue-900 text-white py-16">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/imgLongueDistance.jpg)',
          }}
        ></div>
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold">Réservation</h1>
            <p className="mt-4 text-xl text-blue-100">
              Réservez votre course en quelques minutes
            </p>
          </div>
        </div>
      </div>
      <SecureReservationForm />
    </main>
  )
}
