import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/coffee_timer/",
  plugins: [react()],
});
