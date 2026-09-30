import { copyFileSync } from "node:fs"
import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"

function pagesFallback(): Plugin {
  return {
    name: "pages-404",
    apply: "build",
    closeBundle() {
      const index = resolve("dist/index.html")
      copyFileSync(index, resolve("dist/404.html"))
    },
  }
}

export default defineConfig({
  base: "/sky-vector/",
  plugins: [tailwindcss(), react(), pagesFallback()],
  resolve: {
    alias: { "@": resolve("src") },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
})
