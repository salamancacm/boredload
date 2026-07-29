import { defineConfig } from 'tsup';

const outExtension = ({ format }: { format: string }) => ({
  js: format === 'esm' ? '.mjs' : '.cjs',
});

export default defineConfig([
  {
    name: 'core',
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    minify: true,
    target: 'es2020',
    external: ['react', 'react-dom'],
    outExtension,
  },
  {
    name: 'react',
    entry: { 'react/index': 'src/react/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: false,
    minify: true,
    target: 'es2020',
    external: ['react', 'react-dom'],
    outExtension,
  },
]);
