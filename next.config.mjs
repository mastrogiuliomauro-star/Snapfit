/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false, // Disattiva il doppio rendering iniziale in sviluppo per rendere i calcoli più lineari
    experimental: {
        allowedDevOrigins: ['192.168.1.111', 'localhost:3000']
    }
};

export default nextConfig;