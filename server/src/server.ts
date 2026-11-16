import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from workspace root or server directory
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

import { createApp } from './app.js';

const PORT = process.env.PORT || 3001;
const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`[Server] Urban Air Quality Assistant API running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Gracefully shutting down...');
  server.close(() => {
    process.exit(0);
  });
});
