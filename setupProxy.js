// setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/hubs',
    createProxyMiddleware({
      target: process.env.REACT_APP_API_URL || 'http://localhost:5099',
      changeOrigin: true,
      ws: true,
      logLevel: 'debug',
      pathRewrite: { '^/hubs': '/hubs' },
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