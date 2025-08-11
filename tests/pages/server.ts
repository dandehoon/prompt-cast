import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3000;

type RouteMap = Record<string, string>;

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  let filePath = '';
  
  // Route handling
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>Test Pages Index</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
        h1 { color: #333; text-align: center; }
        .links { display: grid; gap: 15px; }
        .link { 
            display: block; 
            padding: 15px; 
            background: #f8f9fa; 
            text-decoration: none; 
            color: #333; 
            border-radius: 8px; 
            transition: background 0.2s;
        }
        .link:hover { background: #e9ecef; }
        .link h3 { margin: 0 0 5px 0; color: #1a73e8; }
        .link p { margin: 0; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Prompt Cast Test Pages</h1>
        <p>Select a mock AI interface to test the extension:</p>
        <div class="links">
            <a href="/chatgpt" class="link">
                <h3>ChatGPT Mock</h3>
                <p>Test message broadcasting to ChatGPT-style interface</p>
            </a>
            <a href="/claude" class="link">
                <h3>Claude Mock</h3>
                <p>Test message broadcasting to Claude-style interface</p>
            </a>
            <a href="/gemini" class="link">
                <h3>Gemini Mock</h3>
                <p>Test message broadcasting to Gemini-style interface</p>
            </a>
            <a href="/perplexity" class="link">
                <h3>Perplexity Mock</h3>
                <p>Test message broadcasting to Perplexity-style interface</p>
            </a>
        </div>
    </div>
</body>
</html>
    `);
    return;
  }

  // Serve test pages
  const routes: RouteMap = {
    '/chatgpt': 'chatgpt-mock.html',
    '/claude': 'claude-mock.html', 
    '/gemini': 'gemini-mock.html',
    '/perplexity': 'perplexity-mock.html',
  };

  if (req.url && routes[req.url]) {
    filePath = join(__dirname, routes[req.url]);
  }

  if (filePath) {
    try {
      const content = readFileSync(filePath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Page not found');
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Page not found');
  }
});

server.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log('Available test pages:');
  console.log('- http://localhost:3000/chatgpt');
  console.log('- http://localhost:3000/claude');
  console.log('- http://localhost:3000/gemini');  
  console.log('- http://localhost:3000/perplexity');
});

export default server;
