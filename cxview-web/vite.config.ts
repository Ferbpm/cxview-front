import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'https://localhost:44361',
          changeOrigin: true,
          secure: false,
          // El navegador trabaja en http://localhost:5173 durante desarrollo,
          // aunque el API local usa HTTPS. Sin esta adaptación el atributo
          // Secure de Set-Cookie hace que Chrome rechace la cookie en 5173.
          // En producción no pasa por este proxy y Secure permanece intacto.
          configure: (proxy) => {
            proxy.on('proxyRes', (proxyResponse) => {
              const cookies = proxyResponse.headers['set-cookie']
              if (Array.isArray(cookies)) proxyResponse.headers['set-cookie'] = cookies.map((cookie) => cookie.replace(/;\s*Secure/ig, ''))
              else {
                const cookieText = cookies as unknown
                if (typeof cookieText === 'string') proxyResponse.headers['set-cookie'] = [cookieText.replace(/;\s*Secure/ig, '')]
              }
            })
          },
        },
      },
    },
  }
})
