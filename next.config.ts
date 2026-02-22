import type { NextConfig } from "next";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // aquí puedes ir metieno tus opciones de Next si las necesitas
  turbopack: {},
};

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: isDev, // en local desactivado
});

export default withPWA(nextConfig);