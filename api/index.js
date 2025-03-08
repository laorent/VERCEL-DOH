 const axios = require('axios');
 const NodeCache = require('node-cache');

 // 使用 node-cache 创建一个简单的缓存，标准 TTL（生存时间）为 600 秒（10 分钟）
 const cache = new NodeCache({ stdTTL: 600 });

 // 选择一个 DoH 服务器（这里使用 Google 的）
 const dohServer = 'https://dns.google/resolve';

 module.exports = async (req, res) => {
   try {
     // 获取查询参数（例如 ?name=example.com&type=A）
     const { name, type } = req.query;

     // 检查参数是否齐全
     if (!name || !type) {
       return res.status(400).json({ error: 'Missing name or type parameter' });
     }

     // 构建缓存键
     const cacheKey = `${name}-${type}`;

     // 尝试从缓存中获取结果
     const cachedResponse = cache.get(cacheKey);
     if (cachedResponse) {
       console.log('Cache hit!');
       return res.json(cachedResponse);
     }
     console.log('Cache miss!');

     // 发起 DoH 查询
     const response = await axios.get(dohServer, {
       params: {
         name: name,
         type: type,
       },
       headers:{
           'accept': 'application/dns-json'
       }
     });

     // 将响应数据存入缓存
     cache.set(cacheKey, response.data);

     // 将 DoH 服务器的响应发送给客户端
     res.json(response.data);

   } catch (error) {
     console.error('Error:', error);
     if (error.response) {
       // DoH 服务器返回了错误状态码
       res.status(error.response.status).json({ error: error.response.data });
     } else {
       // 其他类型的错误
       res.status(500).json({ error: 'Internal server error' });
     }
   }
 };
 ``` ```javascript
 const axios = require('axios');
 const NodeCache = require('node-cache');

 // 使用 node-cache 创建一个简单的缓存，标准 TTL（生存时间）为 600 秒（10 分钟）
 const cache = new NodeCache({ stdTTL: 600 });

 // 选择一个 DoH 服务器（这里使用 Google 的）
 const dohServer = 'https://dns.google/resolve';

 module.exports = async (req, res) => {
   try {
     // 获取查询参数（例如 ?name=example.com&type=A）
     const { name, type } = req.query;

     // 检查参数是否齐全
     if (!name || !type) {
       return res.status(400).json({ error: 'Missing name or type parameter' });
     }

     // 构建缓存键
     const cacheKey = `${name}-${type}`;

     // 尝试从缓存中获取结果
     const cachedResponse = cache.get(cacheKey);
     if (cachedResponse) {
       console.log('Cache hit!');
       return res.json(cachedResponse);
     }
     console.log('Cache miss!');

     // 发起 DoH 查询
     const response = await axios.get(dohServer, {
       params: {
         name: name,
         type: type,
       },
       headers:{
           'accept': 'application/dns-json'
       }
     });

     // 将响应数据存入缓存
     cache.set(cacheKey, response.data);

     // 将 DoH 服务器的响应发送给客户端
     res.json(response.data);

   } catch (error) {
     console.error('Error:', error);
     if (error.response) {
       // DoH 服务器返回了错误状态码
       res.status(error.response.status).json({ error: error.response.data });
     } else {
       // 其他类型的错误
       res.status(500).json({ error: 'Internal server error' });
     }
   }
 };
 ``` ```javascript
 const axios = require('axios');
 const NodeCache = require('node-cache');

 // 使用 node-cache 创建一个简单的缓存，标准 TTL（生存时间）为 600 秒（10 分钟）
 const cache = new NodeCache({ stdTTL: 600 });

 // 选择一个 DoH 服务器（这里使用 Google 的）
 const dohServer = 'https://dns.google/resolve';

 module.exports = async (req, res) => {
   try {
     // 获取查询参数（例如 ?name=example.com&type=A）
     const { name, type } = req.query;

     // 检查参数是否齐全
     if (!name || !type) {
       return res.status(400).json({ error: 'Missing name or type parameter' });
     }

     // 构建缓存键
     const cacheKey = `${name}-${type}`;

     // 尝试从缓存中获取结果
     const cachedResponse = cache.get(cacheKey);
     if (cachedResponse) {
       console.log('Cache hit!');
       return res.json(cachedResponse);
     }
     console.log('Cache miss!');

     // 发起 DoH 查询
     const response = await axios.get(dohServer, {
       params: {
         name: name,
         type: type,
       },
       headers:{
           'accept': 'application/dns-json'
       }
     });

     // 将响应数据存入缓存
     cache.set(cacheKey, response.data);

     // 将 DoH 服务器的响应发送给客户端
     res.json(response.data);

   } catch (error) {
     console.error('Error:', error);
     if (error.response) {
       // DoH 服务器返回了错误状态码
       res.status(error.response.status).json({ error: error.response.data });
     } else {
       // 其他类型的错误
       res.status(500).json({ error: 'Internal server error' });
     }
   }
 };
