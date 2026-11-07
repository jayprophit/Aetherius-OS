import path from 'path';
import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function pwaPrecache(): Plugin {
  return {
    name: 'aetherius-pwa-precache',
    apply: 'build',
    generateBundle(_options, bundle) {
      const files = Object.keys(bundle)
        .filter((file) => /\.(?:js|css|html|svg|png|webmanifest)$/.test(file))
        .map((file) => `./${file.replace(/\\/g, '/')}`);
      this.emitFile({
        type: 'asset',
        fileName: 'sw-manifest.json',
        source: JSON.stringify({ files }, null, 2),
      });
      // Emit sw.js with the build id baked into the cache name so every
      // production build ships different SW bytes and the browser installs
      // the new worker on the next navigation. A static sw.js pinned the
      // cache forever (the stale-build incident of 2026-11-07).
      const buildId = process.env.AETHERIUS_BUILD_ID || 'dev';
      const source = readFileSync('public/sw.js', 'utf8');
      const versioned = source.replace(
        'const CACHE = "aetherius-shell-v1";',
        `const CACHE = "aetherius-shell-${buildId.replace(/[^a-zA-Z0-9.-]/g, '_')}";`,
      );
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: versioned,
      });
    },
  };
}

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        tailwindcss(),
        {
          name: 'replace-node-builtins',
          enforce: 'pre',
          resolveId(source) {
            if (source.startsWith('node:')) {
              return { id: source, external: true, moduleSideEffects: false };
            }
            return null;
          },
        },
        pwaPrecache(),
      ],
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
        //
        // This used to be written as `poolOptions.forks.maxForks`, which
        // Vitest 4 removed: the option is now read only to print a
        // deprecation warning, so the cap never applied and the suite ran at
        // the default (logical processors minus one, seven here on four
        // cores). On 2026-10-25 two in-memory tests then failed at their
        // thirty second limit while an unrelated build held one core, and
        // both passed alone. `maxWorkers` is the option that is actually
        // read, and the number is the physical core count, which is what the
        // paragraph above always meant.
        pool: 'forks',
        maxWorkers: 4,
        minWorkers: 1,
        // A test that legitimately needs longer than the default says so
        // itself. The default is raised only enough to cover the slowest
        // real operation, which is the registry audit walking the whole
        // programme.
        testTimeout: 30_000,
        hookTimeout: 30_000,
      },
      // No credential is ever injected at build time. AI providers resolve
      // secrets at runtime by reference, and the browser-side legacy views
      // read a session-scoped key only when the user supplies one. A build
      // that embeds a key publishes it, so the define block deliberately
      // contains no API key.
      define: {
        __AETHERIUS_BUILD_ID__: JSON.stringify(
          process.env.AETHERIUS_BUILD_ID || process.env.npm_package_version || 'dev'
        ),
      },

      build: {
        chunkSizeWarningLimit: 600,
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              ui: ['lucide-react'],
            },
          },
        },
      },

      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
    };
});
