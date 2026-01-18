import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['pdfkit'],
  // Explicitly set the workspace root to prevent Next.js from inferring the wrong directory
  // when there are package files in parent directories
  turbopack: {
    root: __dirname,
  },
  // Configure webpack to resolve modules from the project directory
  webpack: (config, { isServer }) => {
    // Ensure modules are resolved from the project's node_modules
    config.resolve.modules = [
      resolve(__dirname, 'node_modules'),
      ...(config.resolve.modules || []),
    ]
    return config
  },
}

export default nextConfig
