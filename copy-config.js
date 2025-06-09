import { copyFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Copy staticwebapp.config.json to dist folder
const sourceConfig = resolve(__dirname, 'staticwebapp.config.json');
const targetConfig = resolve(__dirname, 'dist', 'staticwebapp.config.json');

try {
  copyFileSync(sourceConfig, targetConfig);
  console.log('Successfully copied staticwebapp.config.json to dist folder');
} catch (error) {
  console.error('Error copying staticwebapp.config.json:', error);
  process.exit(1);
} 