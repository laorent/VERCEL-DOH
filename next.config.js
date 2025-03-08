/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

// 禁用遥测数据收集
process.env.NEXT_TELEMETRY_DISABLED = '1';

module.exports = nextConfig
