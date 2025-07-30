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
  {
    ...commonConfig,
    entryPoints: ['src/background/background.ts'],
    outfile: 'dist/background/background.js',
    platform: 'browser',
  },
  {
    ...commonConfig,
    entryPoints: ['src/content/content.ts'],
    outfile: 'dist/content/content.js',
    platform: 'browser',
  },
  {
    ...commonConfig,
    entryPoints: ['src/popup/popup.tsx'],
    outfile: 'dist/popup/popup.js',
    platform: 'browser',
  },
];

function copyAssets() {
  const assets = [
    { src: './src/popup/popup.html', dest: './dist/popup/popup.html' },
    { src: './src/manifest.json', dest: './dist/manifest.json' },
    { src: './src/icons', dest: './dist/icons', recursive: true },
  ];

  assets.forEach(({ src, dest, recursive }) => {
    if (!fs.existsSync(src)) return;
    
    if (recursive) {
      if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
      fs.cpSync(src, dest, { recursive: true });
    } else {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
    }
  });
}

async function build() {
  try {
    // Process CSS with Tailwind
    console.log('Processing CSS...');
    execSync(
      'pnpm exec tailwindcss -i ./src/popup/popup.css -o ./dist/popup/popup.css',
      { stdio: 'inherit' },
    );

    // Copy all assets
    console.log('Copying assets...');
    copyAssets();

    // Build or watch
    if (isWatch) {
      console.log('Starting watch mode...');
      const contexts = await Promise.all(
        buildConfigs.map(config => esbuild.context(config))
      );
      await Promise.all(contexts.map(ctx => ctx.watch()));
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
