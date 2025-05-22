/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // optional: disable in dev
});

const nextConfig = {
  reactStrictMode: true,
  // Add other config options here if needed
};

module.exports = withPWA(nextConfig);
