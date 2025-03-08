export default async function handler(req, res) {
  // 检查请求方法
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // DOH服务器地址，这里默认使用Cloudflare的DOH服务
  const targetUrl = 'https://cloudflare-dns.com/dns-query';
  
  try {
    // 准备转发选项
    const options = {
      method: req.method,
      headers: {
        'Accept': 'application/dns-json, application/dns-message, application/json',
        'Content-Type': req.headers['content-type'] || 'application/dns-json',
      }
    };
    
    // 如果是POST请求，转发请求体
    if (req.method === 'POST' && req.body) {
      options.body = req.body;
    }
    
    // 构建完整URL（包括查询参数）
    let url = targetUrl;
    if (req.url.includes('?')) {
      const queryString = req.url.split('?')[1];
      url = `${targetUrl}?${queryString}`;
    }
    
    // 发送请求到DOH服务器
    const response = await fetch(url, options);
    
    // 获取响应内容
    const data = await response.arrayBuffer();
    
    // 设置响应头
    for (const [key, value] of response.headers) {
      res.setHeader(key, value);
    }
    
    // 设置状态码和返回数据
    res.status(response.status);
    res.send(Buffer.from(data));
    
  } catch (error) {
    console.error('Error proxying request:', error);
    res.status(500).json({ error: 'Failed to proxy request' });
  }
}
