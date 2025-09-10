import Hero from '@/components/Hero'
import SecureReservationForm from '@/components/SecureReservationForm'
import ServicePresentation from '@/components/ServicePresentation'
import CustomerReviews from '@/components/CustomerReviews'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Hero />
      <SecureReservationForm />
      <ServicePresentation />
      <CustomerReviews />
      <Footer />
    </main>
  )
}