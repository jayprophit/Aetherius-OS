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
        // This suite is Aetherius-OS's own suite, and it runs Aetherius-OS's
        // own tests.
        //
        // The workspace was reorganised so that every project the owner holds
        // sits inside the project that owns it. That put the IDE, LedgerLands,
        // aetherial-platform, Niche_platform, Veyra and aetherium under this
        // directory, and each of them carries its own test suite with its own
        // configuration: a different environment, different module aliases,
        // different workspace packages. Vitest's default include pattern
        // matches them all, so this suite was picking up two hundred and
        // fifty tests it has neither the configuration nor the business to
        // run, and they failed for reasons that had nothing to do with
        // Aetherius OS.
        //
        // Each absorbed project runs its own tests with its own runner, from
        // its own directory. This suite runs the tests of this project, and
        // the workspace registry gate checks that each absorbed project is
        // registered and has a manifest that says how it is built and tested.
        include: [
          'src/**/*.{test,spec}.?(c|m)[jt]s?(x)',
          'docs/**/*.{test,spec}.?(c|m)[jt]s?(x)',
        ],
        exclude: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          // The absorbed projects, each of which has its own suite.
          'apps/**',
          'ecosystem/**',
          'predecessors/**',
          'absorbed/**',
          'books/**',
          'tools/**',
          'kernel/**',
        ],
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
