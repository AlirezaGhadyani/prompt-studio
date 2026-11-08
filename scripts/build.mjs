import { build } from 'esbuild';

await build({
  entryPoints: ['src/main.ts'],
  outfile: 'panel/main.js',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['chrome120'],
  sourcemap: false,
  minify: false,
  legalComments: 'none',
  logLevel: 'info',
});
