const fetch = require('node-fetch');
const { performance } = require('perf_hooks');

const CONFIG = {
  UPSTREAM_DOH_SERVER: 'https://cloudflare-dns.com/dns-query',
  CACHE_TTL: 60,
  MAX_CACHE_SIZE: 1000,
};

class DNSCache {
  constructor(maxSize = CONFIG.MAX_CACHE_SIZE) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  set(key, value, ttl) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, {
      data: value,
      expiry: Date.now() + ttl * 1000
    });
  }
}

const cache = new DNSCache();

const logger = {
  info: (message, data = {}) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      ...data
    }));
  },
  error: (message, error, data = {}) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      error: error.message || error,
      stack: error.stack,
      ...data
    }));
  }
};

module.exports = async (req, res) => {
  const startTime = performance.now();

  try {
    // CORS headers - 增加更多允许的头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Content-Length');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    // 记录请求信息
    logger.info('Incoming request', {
      method: req.method,
      url: req.url,
      headers: {
        accept: req.headers.accept,
        'content-type': req.headers['content-type']
      }
    });

    if (req.method !== 'GET' && req.method !== 'POST') {
      throw new Error(`Method ${req.method} not allowed`);
    }

    const contentType = req.headers['content-type'] || '';
    const accept = req.headers.accept || 'application/dns-message';

    // 处理 POST 请求
    if (req.method === 'POST') {
      let body = [];
      for await (const chunk of req) {
        body.push(chunk);
      }
      body = Buffer.concat(body);

      if (!body.length) {
        logger.error('Empty POST body');
        res.status(400).json({ error: 'Empty request body' });
        return;
      }

      const upstream_response = await fetch(CONFIG.UPSTREAM_DOH_SERVER, {
        method: 'POST',
        headers: {
          'Accept': accept,
          'Content-Type': contentType || 'application/dns-message'
        },
        body: body
      });

      if (!upstream_response.ok) {
        throw new Error(`Upstream server returned ${upstream_response.status}`);
      }

      const response_data = await upstream_response.buffer();

      res.setHeader('Content-Type', accept);
      res.setHeader('Cache-Control', `public, max-age=${CONFIG.CACHE_TTL}`);
      res.send(response_data);

      logger.info('Request completed', {
        method: 'POST',
        url: req.url,
        duration: `${(performance.now() - startTime).toFixed(2)}ms`,
        status: upstream_response.status
      });
      return;
    }

    // 处理 GET 请求
    if (req.method === 'GET') {
      if (accept.includes('application/dns-json')) {
        const { name, type } = req.query;
        if (!name) {
          throw new Error('Missing name parameter');
        }

        const upstream_url = `${CONFIG.UPSTREAM_DOH_SERVER}?name=${encodeURIComponent(name)}&type=${type || 'A'}`;
        const upstream_response = await fetch(upstream_url, {
          headers: { 'Accept': 'application/dns-json' }
        });

        if (!upstream_response.ok) {
          throw new Error(`Upstream server returned ${upstream_response.status}`);
        }

        const response_data = await upstream_response.json();
        res.setHeader('Content-Type', 'application/dns-json');
        res.setHeader('Cache-Control', `public, max-age=${CONFIG.CACHE_TTL}`);
        res.json(response_data);
      } else {
        if (!req.query.dns) {
          throw new Error('Missing dns parameter');
        }

        const upstream_url = `${CONFIG.UPSTREAM_DOH_SERVER}?dns=${req.query.dns}`;
        const upstream_response = await fetch(upstream_url, {
          headers: { 'Accept': 'application/dns-message' }
        });

        if (!upstream_response.ok) {
          throw new Error(`Upstream server returned ${upstream_response.status}`);
        }

        const response_data = await upstream_response.buffer();
        res.setHeader('Content-Type', 'application/dns-message');
        res.setHeader('Cache-Control', `public, max-age=${CONFIG.CACHE_TTL}`);
        res.send(response_data);
      }

      logger.info('Request completed', {
        method: 'GET',
        url: req.url,
        duration: `${(performance.now() - startTime).toFixed(2)}ms`
      });
      return;
    }
  } catch (error) {
    logger.error('Request failed', error, {
      method: req.method,
      url: req.url
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
};
