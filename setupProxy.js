// setupProxy.js (project root)
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/hubs',
    createProxyMiddleware({
      target: 'http://localhost:5140',
      changeOrigin: true,
      ws: true,                    // ← WebSocket upgrade
      logLevel: 'debug',
      pathRewrite: { '^/hubs': '/hubs' }, // explicit
      onProxyReq: (proxyReq, req, res) => {
        console.log('[HPM] PROXY:', req.method, req.url);
      },
      onError: (err, req, res) => {
        console.error('[HPM] ERROR:', err);
        res.status(500).send('Proxy error');
      }
    })
  );
};