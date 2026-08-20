import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: {
        "formfacade-react": resolve(import.meta.dirname, "src/index.ts"),
        inspect: resolve(import.meta.dirname, "src/inspectGoogleForm.ts"),
      },
      name: "FormFacadeReact",
      formats: ["es", "cjs"],
      fileName: (format, entryName) =>
        format === "es" ? `${entryName}.js` : `${entryName}.cjs`,
    },
    rollupOptions: {
      external: ["react"],
      output: {
        exports: "named",
        globals: { react: "React" },
      },
    },
  },
});
