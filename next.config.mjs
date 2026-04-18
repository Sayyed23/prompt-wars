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
        ],
      },
    ];
  },

  // Image optimization with Cloud CDN (Requirement 5.1)
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 3600, // Increased for efficiency
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
