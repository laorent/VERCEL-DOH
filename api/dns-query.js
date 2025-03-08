const fetch = require('node-fetch');
const { performance } = require('perf_hooks');

// 配置
const CONFIG = {
  UPSTREAM_DOH_SERVER: 'https://cloudflare-dns.com/dns-query',
  CACHE_TTL: 60, // 缓存时间（秒）
  MAX_CACHE_SIZE: 1000, // 最大缓存条目数
};

// 简单的内存缓存实现
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

// 日志记录
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

// 性能监控
const metrics = {
  startTime: null,
  record: (req, duration) => {
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      duration: `${duration.toFixed(2)}ms`,
      cache: req.fromCache ? 'HIT' : 'MISS'
    });
  }
};

module.exports = async (req, res) => {
  metrics.startTime = performance.now();

  try {
    // CORS 头设置
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    // 限制请求方法
    if (req.method !== 'GET' && req.method !== 'POST') {
      throw new Error(`Method ${req.method} not allowed`);
    }

    const accept = req.headers.accept || 'application/dns-message';
    const isJsonFormat = accept.includes('application/dns-json');

    // 生成缓存键
    const cacheKey = isJsonFormat ? 
      `json:${req.query.name}:${req.query.type}` :
      `dns:${req.method}:${req.query.dns || req.body}`;

    // 检查缓存
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse) {
      req.fromCache = true;
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Content-Type', isJsonFormat ? 'application/dns-json' : 'application/dns-message');
      res.send(cachedResponse);
      metrics.record(req, performance.now() - metrics.startTime);
      return;
    }

    // 处理 JSON 格式请求
    if (isJsonFormat) {
      await handleJsonRequest(req, res, cacheKey);
    } else {
      await handleDnsMessage(req, res, cacheKey);
    }

    metrics.record(req, performance.now() - metrics.startTime);
  } catch (error) {
    logger.error('Request failed', error, { 
      method: req.method,
      url: req.url,
      headers: req.headers
    });
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

async function handleJsonRequest(req, res, cacheKey) {
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
  cache.set(cacheKey, response_data, CONFIG.CACHE_TTL);
  
  res.setHeader('Content-Type', 'application/dns-json');
  res.setHeader('Cache-Control', `public, max-age=${CONFIG.CACHE_TTL}`);
  res.setHeader('X-Cache', 'MISS');
  res.json(response_data);
}

async function handleDnsMessage(req, res, cacheKey) {
  let dnsQuery;
  if (req.method === 'GET') {
    if (!req.query.dns) {
      throw new Error('Missing dns parameter');
    }
    dnsQuery = req.query.dns;
  } else {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    dnsQuery = Buffer.concat(chunks);
    if (!dnsQuery.length) {
      throw new Error('Empty request body');
    }
  }

  const upstream_response = await fetch(CONFIG.UPSTREAM_DOH_SERVER, {
    method: req.method,
    headers: {
      'Accept': 'application/dns-message',
      'Content-Type': 'application/dns-message'
    },
    ...(req.method === 'GET' ? {
      url: `${CONFIG.UPSTREAM_DOH_SERVER}?dns=${dnsQuery}`
    } : {
      body: dnsQuery
    })
  });

  if (!upstream_response.ok) {
    throw new Error(`Upstream server returned ${upstream_response.status}`);
  }

  const response_data = await upstream_response.buffer();
  cache.set(cacheKey, response_data, CONFIG.CACHE_TTL);

  res.setHeader('Content-Type', 'application/dns-message');
  res.setHeader('Cache-Control', `public, max-age=${CONFIG.CACHE_TTL}`);
  res.setHeader('X-Cache', 'MISS');
  res.send(response_data);
}
