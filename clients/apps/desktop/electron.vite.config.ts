import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin({
        exclude: [
          "@retro/realtime-client",
          "@retro/contracts",
          "@retro/api-client",
          "@retro/design-tokens",
        ],
      }),
    ],
  },
  preload: {
    plugins: [
      externalizeDepsPlugin({
        exclude: [
          "@retro/realtime-client",
          "@retro/contracts",
          "@retro/api-client",
          "@retro/design-tokens",
        ],
      }),
    ],
    build: {
      rollupOptions: {
        output: {
          format: "cjs",
          entryFileNames: "[name].js",
        },
      },
    },
  },
  renderer: {
    plugins: [react()],
  },
});

