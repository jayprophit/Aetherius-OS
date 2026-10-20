import path from 'path';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      test: {
        // Cleans up the real temp directories this suite creates. Without it a
        // long-lived machine accumulates hundreds of them.
        globalSetup: ['./test.globalSetup.ts'],
        // This machine has four cores and sixteen gigabytes. Running one
        // worker per test file put a hundred workers on four cores, and three
        // tests then failed intermittently under that contention: the HTTP
        // bridge transport test timed out at its five second limit, the
        // shared schema envelope test failed, and the capability registry
        // audit failed. Each of them passed when its file was run alone.
        //
        // The fix is not to raise the timeouts and hope. It is to stop
        // oversubscribing the machine. Four workers on four cores leaves
        // headroom for the build and the browser, and the suite still
        // finishes in about the same wall-clock time because the workers
        // were contending for the same cores anyway.
        pool: 'forks',
        poolOptions: {
          forks: {
            maxForks: 8,
            minForks: 1,
          },
        },
        // A test that legitimately needs longer than the default says so
        // itself. The default is raised only enough to cover the slowest
        // real operation, which is the registry audit walking the whole
        // programme.
        testTimeout: 30_000,
        hookTimeout: 30_000,
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
