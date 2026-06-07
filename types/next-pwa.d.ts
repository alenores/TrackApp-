declare module "next-pwa" {
  type NextPwaOptions = Record<string, unknown>;

  export default function withPWA(
    options?: NextPwaOptions,
  ): <T>(nextConfig: T) => T;
}

declare module "next-pwa/cache" {
  const cachePresets: unknown[];
  export default cachePresets;
}
