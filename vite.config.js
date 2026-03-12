import { defineConfig } from 'vite';

export default defineConfig({
    base: '/cthulhu/',
    root: 'src',
    publicDir: '../public',
    server: {
        port: 5173,
        open: true
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true
    }
});
