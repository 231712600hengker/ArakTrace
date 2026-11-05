import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  // Tes lapisan data memakai mode memori; kosongkan kredensial agar tidak pernah menyentuh Supabase asli.
  test: { env: { SUPABASE_URL: "", SUPABASE_SERVICE_ROLE_KEY: "" } },
});
