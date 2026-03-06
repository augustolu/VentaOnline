/** @type {import('next').NextConfig} */
const nextConfig = {
    // Permite importar imágenes de dominios externos (ajustar cuando se use S3)
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
    // Desactiva la telemetría de Next.js
    experimental: {},
    serverExternalPackages: ['@prisma/client', 'prisma'],
};

export default nextConfig;
