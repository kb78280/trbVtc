/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration pour Vercel (routes API supportées)
  // output: 'export', // Désactivé pour supporter les routes API admin
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  
  // Ignorer les erreurs ESLint et TypeScript pendant le build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
}

module.exports = nextConfig
