const fetch = require('node-fetch');

const UPSTREAM_DOH_SERVER = 'https://cloudflare-dns.com/dns-query';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const accept = req.headers.accept || 'application/dns-message';
    const isJsonFormat = accept.includes('application/dns-json');

    // 处理 application/dns-json 格式的请求
    if (isJsonFormat) {
      const { name, type } = req.query;
      if (!name) {
        res.status(400).json({ error: 'Missing name parameter' });
        return;
      }

      const upstream_url = `${UPSTREAM_DOH_SERVER}?name=${encodeURIComponent(name)}&type=${type || 'A'}`;
      const upstream_response = await fetch(upstream_url, {
        headers: {
          'Accept': 'application/dns-json'
        }
      });

      const response_data = await upstream_response.json();
      res.setHeader('Content-Type', 'application/dns-json');
      res.setHeader('Cache-Control', 'public, max-age=60');
      return res.json(response_data);
    }

    // 处理 application/dns-message 格式的请求
    let dnsQuery;
    if (req.method === 'GET') {
      if (!req.query.dns) {
        res.status(400).json({ error: 'Missing dns parameter' });
        return;
      }
      dnsQuery = req.query.dns;
    } else {
      dnsQuery = req.body;
    }

    const upstream_response = await fetch(UPSTREAM_DOH_SERVER, {
      method: req.method,
      headers: {
        'Accept': 'application/dns-message',
        'Content-Type': 'application/dns-message'
      },
      ...(req.method === 'GET' ? {
        headers: { 'Accept': 'application/dns-message' }
      } : {
        body: dnsQuery,
        headers: {
          'Content-Type': 'application/dns-message',
          'Accept': 'application/dns-message'
        }
      })
    });

    const response_data = await upstream_response.buffer();
    res.setHeader('Content-Type', 'application/dns-message');
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.status(upstream_response.status);
    res.send(response_data);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
