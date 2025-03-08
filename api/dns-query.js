const fetch = require('node-fetch');

const UPSTREAM_DOH_SERVER = 'https://cloudflare-dns.com/dns-query';

const logError = (req, error, stage) => {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    stage: stage,
    error: error.message || error,
    method: req.method,
    headers: req.headers,
    query: req.query,
    url: req.url
  }, null, 2));
};

module.exports = async (req, res) => {
  try {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      method: req.method,
      accept: req.headers.accept,
      url: req.url
    }));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    if (req.method !== 'GET' && req.method !== 'POST') {
      logError(req, 'Invalid method', 'method_check');
      return res.status(405).json({ 
        error: 'Method not allowed',
        detail: `Method ${req.method} is not supported`
      });
    }

    const accept = req.headers.accept || 'application/dns-message';
    const isJsonFormat = accept.includes('application/dns-json');

    // 处理 application/dns-json 格式的请求
    if (isJsonFormat) {
      const { name, type } = req.query;
      if (!name) {
        logError(req, 'Missing name parameter', 'json_format_validation');
        return res.status(400).json({ 
          error: 'Bad Request',
          detail: 'Missing name parameter for DNS query'
        });
      }

      try {
        const upstream_url = `${UPSTREAM_DOH_SERVER}?name=${encodeURIComponent(name)}&type=${type || 'A'}`;
        console.log(`Upstream request to: ${upstream_url}`);

        const upstream_response = await fetch(upstream_url, {
          headers: {
            'Accept': 'application/dns-json'
          }
        });

        if (!upstream_response.ok) {
          logError(req, `Upstream server returned ${upstream_response.status}`, 'upstream_request');
          throw new Error(`Upstream server returned ${upstream_response.status}`);
        }

        const response_data = await upstream_response.json();
        res.setHeader('Content-Type', 'application/dns-json');
        res.setHeader('Cache-Control', 'public, max-age=60');
        return res.json(response_data);
      } catch (error) {
        logError(req, error, 'json_format_processing');
        return res.status(500).json({ 
          error: 'Internal Server Error',
          detail: 'Error processing DNS query'
        });
      }
    }

    // 处理 application/dns-message 格式的请求
    try {
      let dnsQuery;
      if (req.method === 'GET') {
        if (!req.query.dns) {
          logError(req, 'Missing dns parameter', 'dns_message_validation');
          return res.status(400).json({ 
            error: 'Bad Request',
            detail: 'Missing dns parameter for binary DNS query'
          });
        }
        dnsQuery = req.query.dns;
      } else {
        // 处理 POST 请求的原始数据
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        dnsQuery = Buffer.concat(chunks);
        
        if (!dnsQuery.length) {
          logError(req, 'Empty request body', 'dns_message_validation');
          return res.status(400).json({ 
            error: 'Bad Request',
            detail: 'Empty request body'
          });
        }
      }

      const upstream_response = await fetch(UPSTREAM_DOH_SERVER, {
        method: req.method,
        headers: {
          'Accept': 'application/dns-message',
          'Content-Type': 'application/dns-message'
        },
        ...(req.method === 'GET' ? {
          url: `${UPSTREAM_DOH_SERVER}?dns=${dnsQuery}`
        } : {
          body: dnsQuery
        })
      });

      if (!upstream_response.ok) {
        logError(req, `Upstream server returned ${upstream_response.status}`, 'upstream_request');
        throw new Error(`Upstream server returned ${upstream_response.status}`);
      }

      const response_data = await upstream_response.buffer();
      res.setHeader('Content-Type', 'application/dns-message');
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.status(upstream_response.status);
      res.send(response_data);
    } catch (error) {
      logError(req, error, 'dns_message_processing');
      res.status(500).json({ 
        error: 'Internal Server Error',
        detail: 'Error processing binary DNS query'
      });
    }
  } catch (error) {
    logError(req, error, 'global_error');
    res.status(500).json({ 
      error: 'Internal Server Error',
      detail: 'Unexpected error occurred'
    });
  }
};
