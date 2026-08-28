import { defineConfig } from '@playwright/test';

const e2ePort = process.env.PLAYWRIGHT_PORT || '5173';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Tests share the browser IndexedDB database; serial workers prevent cross-test data races.
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: `http://localhost:${e2ePort}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port ${e2ePort}`,
    url: `http://localhost:${e2ePort}`,
    reuseExistingServer: !process.env.CI,
  },
});
