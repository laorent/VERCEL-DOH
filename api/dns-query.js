const fetch = require('node-fetch');

const UPSTREAM_DOH = 'https://cloudflare-dns.com/dns-query';

const log = (level, message, data = {}) => console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level,
  message,
  ...data
}));

module.exports = async (req, res) => {
  const startTime = Date.now();

  try {
    // 基本 CORS 和响应头设置
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'GET' && req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // 获取请求信息
    const accept = req.headers.accept || 'application/dns-message';
    const isJson = accept.includes('application/dns-json');

    // 处理 POST 请求
    if (req.method === 'POST') {
      const body = [];
      for await (const chunk of req) body.push(chunk);
      
      const response = await fetch(UPSTREAM_DOH, {
        method: 'POST',
        headers: {
          'Accept': accept,
          'Content-Type': req.headers['content-type'] || 'application/dns-message'
        },
        body: Buffer.concat(body)
      });

      const data = await response.buffer();
      res.setHeader('Content-Type', accept);
      res.send(data);
    }
    // 处理 GET 请求
    else {
      const params = isJson 
        ? `name=${encodeURIComponent(req.query.name)}&type=${req.query.type || 'A'}`
        : `dns=${req.query.dns}`;

      if (!req.query.name && !req.query.dns) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const response = await fetch(`${UPSTREAM_DOH}?${params}`, {
        headers: { 'Accept': accept }
      });

      const data = await (isJson ? response.json() : response.buffer());
      res.setHeader('Content-Type', accept);
      isJson ? res.json(data) : res.send(data);
    }

    // 简单的性能日志
    log('INFO', 'Request completed', {
      method: req.method,
      duration: `${Date.now() - startTime}ms`
    });

  } catch (error) {
    log('ERROR', error.message, { method: req.method });
    res.status(500).json({ error: 'Internal server error' });
  }
};
