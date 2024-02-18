import { defineConfig } from '@pandacss/dev';

export default defineConfig({
  preflight: true,
  include: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  outdir: 'styled-system',
});
