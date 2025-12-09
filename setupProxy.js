// setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  // Proxy API requests
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.REACT_APP_API_URL || 'http://localhost:5099',
      changeOrigin: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log('[HPM] API PROXY:', req.method, req.url);
      },
      onError: (err, req, res) => {
        console.error('[HPM] API ERROR:', err);
        res.status(500).send('API Proxy error');
      }
    })
  );

  // Proxy SignalR hubs
  app.use(
    '/hubs',
    createProxyMiddleware({
      target: process.env.REACT_APP_API_URL || 'http://localhost:5099',
      changeOrigin: true,
      ws: true,
      logLevel: 'debug',
      pathRewrite: { '^/hubs': '/hubs' },
      onProxyReq: (proxyReq, req, res) => {
        console.log('[HPM] HUB PROXY:', req.method, req.url);
      },
      onError: (err, req, res) => {
        console.error('[HPM] HUB ERROR:', err);
        res.status(500).send('Hub Proxy error');
      }
    })
  );
};