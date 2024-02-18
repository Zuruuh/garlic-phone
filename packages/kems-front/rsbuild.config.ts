import { defineConfig } from '@rsbuild/core';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginSolid } from '@rsbuild/plugin-solid';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';

export default defineConfig({
  plugins: [
    pluginBabel({
      include: /\.(?:jsx|tsx)$/,
      exclude: /[\\/]node_modules[\\/]/,
    }),
    pluginSolid(),
  ],
  tools: {
    rspack(_, { appendPlugins }): void {
      if (process.env.RSDOCTOR) {
        appendPlugins(new RsdoctorRspackPlugin({}));
      }
    },
    postcss(_, { addPlugins }): void {
      addPlugins(require('@pandacss/dev/postcss'));
    },
  },
});
