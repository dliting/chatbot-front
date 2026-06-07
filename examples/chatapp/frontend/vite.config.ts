import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

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

function createProxyErrorHandler(label: string) {
  return (proxy, _options) => {
    proxy.on('proxyReq', (proxyReq, _req, res) => {
      proxyReq.setTimeout(5000, () => {
        if (res && !res.headersSent) {
          res.writeHead(503, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ code: 503, message: `${label} backend unavailable` }))
        }
      })
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
    port: 5180,
    strictPort: false,
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/.git/**']
    },
    proxy: {
      '/api/mock': {
        target: `http://localhost:${process.env.MOCK_PORT || '3001'}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mock/, ''),
        selfResponding: false,
        configure: createProxyErrorHandler('Mock'),
      },
      '/api/real': {
        target: `http://localhost:${process.env.REAL_PORT || '3000'}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/real/, ''),
        selfResponding: false,
        configure: createProxyErrorHandler('Real'),
      },
    }
  }
})
