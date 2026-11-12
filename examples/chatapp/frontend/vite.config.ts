import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { readFileSync } from 'fs'

/** Port single-source: read the deployment env files, never redefine here.
 *  real.env is gitignored deployment config — when absent the /api/real
 *  proxy is simply not registered (warn, don't crash the mock-mode demo). */
function envPort(name: string, required: boolean): string | null {
  let raw: string
  try {
    raw = readFileSync(path.resolve(__dirname, '..', name), 'utf-8')
  } catch {
    if (required) throw new Error(`${name} is missing — copy the .env.example template first`)
    return null
  }
  const line = raw.split(/\r?\n/).find((l) => l.trim().startsWith('PORT='))
  if (!line) {
    if (required) throw new Error(`${name} is missing a PORT entry — proxy targets cannot be built`)
    return null
  }
  return line.split('=')[1].trim()
}

const MOCK_PORT = envPort('mock.env', true)
const REAL_PORT = envPort('real.env', false)
if (!REAL_PORT) {
  console.warn('[chatapp-frontend] real.env not provisioned — /api/real proxy disabled (cp real.env.example real.env to enable)')
}

// Custom plugin to suppress Vite HMR reconnection errors
function suppressHmrReconnectionErrors() {
  return {
    name: 'suppress-hmr-reconnection',
    transformIndexHtml(html) {
      // Inject script to override Vite client's reconnection behavior
      const script = `
<script>
  // Store original console.error
  const originalConsoleError = console.error;

  // Override console.error to suppress Vite HMR reconnection spam
  console.error = function(...args) {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('GET http://localhost:') || message.includes('ERR_CONNECTION_REFUSED')) &&
      args.some(arg => typeof arg === 'string' && arg.includes('waitForSuccessfulPing'))
    ) {
      // Suppress Vite HMR reconnection errors
      return;
    }
    originalConsoleError.apply(console, args);
  };

  // Also override window.onerror to catch these errors
  window.addEventListener('error', function(event) {
    if (
      event.message &&
      (event.message.includes('GET http://localhost:') || event.message.includes('ERR_CONNECTION_REFUSED'))
    ) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);
</script>`;
      return html.replace('</head>', script + '</head>');
    }
  };
}

function createProxyErrorHandler(label: string, idleTimeoutMs?: number) {
  return (proxy, _options) => {
    proxy.on('proxyReq', (proxyReq, _req, res) => {
      // Idle timeout only for the fast mock backend. The real backend holds
      // connections silently for the whole LLM/ASR inference — an idle kill
      // here would abort cold model loads and slow generations.
      if (idleTimeoutMs !== undefined) {
        proxyReq.setTimeout(idleTimeoutMs, () => {
          if (res && !res.headersSent) {
            res.writeHead(503, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ code: 503, message: `${label} backend unavailable` }))
          }
        })
      }
    })
    proxy.on('error', (err, _req, res) => {
      if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
        if (res && !res.headersSent) {
          res.writeHead(503, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ code: 503, message: `${label} backend service unavailable` }))
        }
      } else {
        console.error(`[Proxy Error - ${label}]:`, err.message)
      }
    })
  }
}

export default defineConfig({
  plugins: [
    vue(),
    suppressHmrReconnectionErrors()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../../src'),
      '@/views': path.resolve(__dirname, './src/views'),
      'chatbot': path.resolve(__dirname, '../../../src/index.ts')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler'
      }
    }
  },
  server: {
    // Explicit IPv4 + strict port: a bare `localhost` may bind ::1 only and
    // break IPv4 health checks; strictPort fails fast instead of drifting to
    // 5181 while the health check still probes 5180 (stale-server trap)
    host: '127.0.0.1',
    port: 5180,
    strictPort: true,
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/.git/**']
    },
    // Proxy rules built imperatively: a conditional spread of an ARRAY into
    // this object literal would produce a numeric "0" key instead of the
    // '/api/real' rule (silent 404s — see real-suite debug 2026-11-12)
    proxy: (() => {
      const rules: Record<string, object> = {
        // 127.0.0.1 (explicit IPv4) — `localhost` may resolve to ::1 and miss a
        // backend bound to IPv4 (see examples/chatapp/mock.env)
        '/api/mock': {
          target: `http://127.0.0.1:${MOCK_PORT}`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/mock/, ''),
          selfResponding: false,
          configure: createProxyErrorHandler('Mock', 5000),
        },
      }
      // No idle timeout: real LLM/ASR calls legitimately idle for minutes.
      // Registered only when real.env is provisioned.
      if (REAL_PORT) {
        rules['/api/real'] = {
          target: `http://127.0.0.1:${REAL_PORT}`,
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api\/real/, ''),
          selfResponding: false,
          configure: createProxyErrorHandler('Real'),
        }
      }
      return rules
    })(),
  }
})
