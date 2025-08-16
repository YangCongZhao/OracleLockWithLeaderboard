import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    eslint: {
        // 构建时不因为 ESLint 报错而失败（仍会在本地 dev 时提示）
        ignoreDuringBuilds: true,
    },
    typescript: {
        // （可选）CI 严格类型报错时也不要卡住构建
        ignoreBuildErrors: true,
    },
};

export default nextConfig;
