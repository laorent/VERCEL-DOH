const fetch = require('node-fetch');

// 上游 DOH 服务器，这里使用 Cloudflare 的 DOH 服务器
const UPSTREAM_DOH_SERVER = 'https://cloudflare-dns.com/dns-query';

module.exports = async (req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // 检查请求方法
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    let dnsQuery;
    let contentType;

    if (req.method === 'GET') {
      // GET 请求必须包含 dns 参数
      if (!req.query.dns) {
        res.status(400).json({ error: 'Missing dns parameter' });
        return;
      }
      dnsQuery = req.query.dns;
      contentType = req.headers.accept;
    } else {
      // POST 请求从 body 中获取数据
      dnsQuery = req.body;
      contentType = req.headers['content-type'];
    }

    // 验证 Content-Type
    if (!contentType || 
        !(contentType.includes('application/dns-message') || 
          contentType.includes('application/dns-json'))) {
      res.status(415).json({ error: 'Unsupported Media Type' });
      return;
    }

    // 转发请求到上游 DOH 服务器
    const upstream_response = await fetch(UPSTREAM_DOH_SERVER, {
      method: req.method,
      headers: {
        'Accept': contentType,
        'Content-Type': contentType
      },
      ...(req.method === 'GET' ? {
        headers: { 'Accept': contentType }
      } : {
        body: dnsQuery,
        headers: {
          'Content-Type': contentType,
          'Accept': contentType
        }
      })
    });

    // 获取响应数据
    const response_data = await (contentType.includes('application/dns-json') 
      ? upstream_response.json() 
      : upstream_response.buffer());

    // 设置响应头
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=60');

    // 发送响应
    res.status(upstream_response.status);
    
    if (contentType.includes('application/dns-json')) {
      res.json(response_data);
    } else {
      res.send(response_data);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
