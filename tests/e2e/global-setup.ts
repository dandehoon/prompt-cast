import { Server } from 'http';
import { startServer, stopServer } from './server.js';

let server: Server | null = null;

async function globalSetup() {
  try {
    console.log('🧪 Starting global test server...');
    server = await startServer({ port: 3000 });
  } catch (error: any) {
    if (error.message.includes('already in use')) {
      console.log(
        'ℹ️  Port 3000 is already in use, tests will use existing server',
      );
    } else {
      throw error;
    }
  }
}

async function globalTeardown() {
  if (server) {
    console.log('🧪 Stopping global test server...');
    await stopServer(server);
  }
}

export default globalSetup;
export { globalTeardown };
