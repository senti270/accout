import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Turbopack 빌드 시 LICENSE 파일 파싱 오류 방지
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  // Turbopack 사용 안 함 (빌드 시)
  experimental: {
    turbo: {
      rules: {
        "*.LICENSE": {
          loaders: [],
          as: "*.txt",
        },
      },
    },
  },
};

export default nextConfig;

