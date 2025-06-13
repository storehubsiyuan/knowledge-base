import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Get the absolute path to the output directory
const outputPath = path.resolve(__dirname, '../../output');

export default defineConfig({
  plugins: [
    react(),
    // Custom plugin to serve files from the output directory
    {
      name: 'serve-output-files',
      configureServer(server) {
        server.middlewares.use('/output', (req, res, next) => {
          const filePath = path.join(outputPath, req.url.split('/').pop());
          
          if (fs.existsSync(filePath)) {
            res.writeHead(200, {
              'Content-Type': 'text/html'
            });
            fs.createReadStream(filePath).pipe(res);
          } else {
            next();
          }
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  },
  build: {
    outDir: '../../public',
    emptyOutDir: true,
  }
}); 