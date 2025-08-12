import express from 'express';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ServerConfig {
  port: number;
  host?: string;
}

export function startServer(
  config: ServerConfig = { port: 3000 },
): Promise<Server> {
  const app = express();
  const { port, host = 'localhost' } = config;

  // Serve static files from the pages directory
  const pagesDir = path.resolve(__dirname, '../pages');
  app.use(express.static(pagesDir));

  // Routes for test pages
  const testPages = ['gemini', 'claude'];
  testPages.forEach((pageName) => {
    app.get(`/${pageName}`, (req, res) => {
      res.sendFile(path.join(pagesDir, `${pageName}.html`));
    });
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      pages: testPages.map((page) => `/${page}`),
    });
  });

  // List all available pages
  app.get('/', (req, res) => {
    const pageLinks = testPages
      .map((page) => `<li><a href="/${page}" target="_blank">${page}</a></li>`)
      .join('');

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prompt Cast Test Pages</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; }
            ul { list-style-type: none; padding: 0; }
            li { margin: 10px 0; }
            a { color: #0066cc; text-decoration: none; padding: 8px 16px; border: 1px solid #ddd; border-radius: 4px; display: inline-block; }
            a:hover { background-color: #f5f5f5; }
          </style>
        </head>
        <body>
          <h1>🧪 Prompt Cast Test Pages</h1>
          <p>Available test pages for manual testing:</p>
          <ul>${pageLinks}</ul>
          <p><small>Server running on <code>http://${host}:${port}</code></small></p>
        </body>
      </html>
    `);
  });

  return new Promise((resolve, reject) => {
    const server = app.listen(port, host, () => {
      console.log(`🚀 Test server started at http://${host}:${port}`);
      console.log('📝 Available test pages:');
      testPages.forEach((pageName) =>
        console.log(`   - http://${host}:${port}/${pageName}`),
      );
      console.log(`💊 Health check: http://${host}:${port}/health`);
      console.log('');
      console.log('Press Ctrl+C to stop the server');
      resolve(server);
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        reject(
          new Error(
            `Port ${port} is already in use. Please try a different port or stop the existing server.`,
          ),
        );
      } else {
        reject(err);
      }
    });
  });
}

export function stopServer(server: Server): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => {
      console.log('🛑 Test server stopped');
      resolve();
    });
  });
}

// CLI usage - if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = parseInt(process.argv[2]) || 3000;
  const host = process.argv[3] || 'localhost';

  console.log('Starting Prompt Cast test server...');

  startServer({ port, host })
    .then((server) => {
      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n⏹️  Shutting down server...');
        stopServer(server).then(() => {
          process.exit(0);
        });
      });

      process.on('SIGTERM', () => {
        console.log('\n⏹️  Shutting down server...');
        stopServer(server).then(() => {
          process.exit(0);
        });
      });
    })
    .catch((error) => {
      console.error('❌ Failed to start server:', error.message);
      process.exit(1);
    });
}
