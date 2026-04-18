/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  // Advanced Compression (Efficiency Improvement)
  compress: true,

  // Security headers for all routes (Requirement 9.5)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { 
            key: 'Content-Security-Policy', 
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://images.unsplash.com https://*.google-analytics.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' ws: wss: https://*.google-analytics.com; frame-src 'none'; object-src 'none';"
          },
        ],
      },
    ];
  },

  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 3600,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },

  // Experimental optimizations
  experimental: {
    optimizePackageImports: [
      'lucide-react', 
      'framer-motion', 
      'clsx', 
      'tailwind-merge'
    ],
  },
};

export default nextConfig;
