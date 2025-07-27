const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const isWatch = process.argv.includes('--watch');

const commonConfig = {
  bundle: true,
  minify: !isWatch,
  sourcemap: isWatch,
  format: 'iife',
  target: 'chrome100',
  jsx: 'automatic',
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
    '.jsx': 'jsx',
    '.js': 'js',
  },
};

const buildConfigs = [
  // Background script
  {
    ...commonConfig,
    entryPoints: ['src/background/background.ts'],
    outfile: 'dist/background/background.js',
    platform: 'browser',
  },
  // Content script
  {
    ...commonConfig,
    entryPoints: ['src/content/content.ts'],
    outfile: 'dist/content/content.js',
    platform: 'browser',
  },
  // Popup script (now React)
  {
    ...commonConfig,
    entryPoints: ['src/popup/popup.tsx'],
    outfile: 'dist/popup/popup.js',
    platform: 'browser',
    external: [], // Bundle React dependencies
  },
];

async function build() {
  try {
    // Ensure dist directories exist
    if (!fs.existsSync('dist')) fs.mkdirSync('dist', { recursive: true });
    if (!fs.existsSync('dist/popup'))
      fs.mkdirSync('dist/popup', { recursive: true });

    // Process CSS with Tailwind (for both watch and build modes)
    console.log('Processing CSS...');
    execSync(
      'pnpm exec tailwindcss -i ./src/popup/popup.css -o ./dist/popup/popup.css',
      { stdio: 'inherit' }
    );

    // Copy HTML file
    console.log('Copying assets...');
    fs.copyFileSync('./src/popup/popup.html', './dist/popup/popup.html');

    if (isWatch) {
      console.log('Starting watch mode...');
      for (const config of buildConfigs) {
        const context = await esbuild.context(config);
        await context.watch();
      }
      console.log('Watching for changes...');
    } else {
      console.log('Building...');
      await Promise.all(buildConfigs.map(config => esbuild.build(config)));
      console.log('Build complete!');
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
