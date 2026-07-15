import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// This project deploys to a GitHub *user* Pages site (sktaruna.github.io),
// which is served from the domain root — so base stays '/'.
// If you fork this into a normal project repo (served at
// https://<user>.github.io/<repo-name>/), change base to '/<repo-name>/'.
export default defineConfig({
  base: '/',
  plugins: [react()],
})
