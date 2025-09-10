/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration pour l'export statique (compatible OVH)
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  
  // Note: Les en-têtes de sécurité seront configurés via .htaccess sur OVH
  // car ils ne sont pas compatibles avec output: 'export'
}

module.exports = nextConfig
