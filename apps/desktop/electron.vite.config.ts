import { resolve } from "node:path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

const workspaceLibs = ["@bili/api", "@bili/translate", "@bili/player", "@bili/types"];

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: workspaceLibs })],
  },
  preload: {
    plugins: [externalizeDepsPlugin({ exclude: workspaceLibs })],
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
      },
    },
    plugins: [react()],
  },
});
