import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'esbuild', // Faster than terser, no extra dependency needed
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-konva': ['konva'],
          'vendor-db': ['dexie', 'jszip'],
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  plugins: [
    {
      name: 'api-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/api/anthropic' && req.method === 'POST') {
            // Handle API request in development
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', async () => {
              try {
                const requestBody = JSON.parse(body);
                const apiKey = req.headers['x-api-key'];

                if (!apiKey) {
                  res.statusCode = 401;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Missing API key' }));
                  return;
                }

                // Forward to Anthropic API (no model modification needed)

                const response = await fetch('https://api.anthropic.com/v1/messages', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                  },
                  body: JSON.stringify(requestBody),
                });

                const data = await response.json();
                res.statusCode = response.status;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              } catch (error) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  error: 'Internal server error',
                  message: error.message
                }));
              }
            });
          } else {
            next();
          }
        });
      }
    }
  ]
});
