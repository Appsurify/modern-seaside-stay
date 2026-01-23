import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const base = mode === 'production' && process.env.GITHUB_REPOSITORY
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
    : '/';

  return {
    base,
    server: {
      host: "::",
      port: 9080,
      headers: {
        "Content-Security-Policy": "frame-ancestors 'self' http://localhost:* https://your-parent-app-domain.com",
      },
    },
    preview: {
      host: "::",
      port: 9081,
      headers: {
        "Content-Security-Policy": "frame-ancestors 'self' http://localhost:* https://your-parent-app-domain.com",
      },
    },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
