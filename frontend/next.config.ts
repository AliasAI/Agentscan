import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // WalletConnect 依赖 pino，pino 的子依赖 thread-stream 包含测试文件
  // 引用了 tap/tape 等 devDependencies，SSR 打包时会报 module not found
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],
};

export default nextConfig;
