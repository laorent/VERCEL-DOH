# 🚀 Vercel DoH 转发部署说明 🚀

## 1️⃣ Fork 仓库（必做）

✅ **访问** [DoH 转发仓库](https://github.com/laorent/Vercel-DoH-)。  
✅ **点击** 右上角 `Fork` 按钮，将仓库 Fork 到自己的 GitHub 账户。  
✅ **进入** Fork 后的仓库，顺手点个 ⭐ `Star` 以示支持！

---

## 2️⃣ 部署到 Vercel（快速完成）

✅ **进入** [Vercel 官网](https://vercel.com/) 并登录。  
✅ **在** Vercel 仪表盘中，点击 `New Project`。  
✅ **选择** 刚刚 Fork 的 DoH 仓库。  
✅ **根据** 提示进行简单配置后，点击 `Deploy`。

🔹 **可选：绑定自定义域**
1. **进入** `Settings` > `Domains`。
2. **添加** 自定义域名（如 `doh.example.com`）。
3. **按照** Vercel 提示，在你的 DNS 解析服务商处添加 CNAME 记录。
4. **等待** 解析生效后，即可使用自定义域名访问。

---

## 3️⃣ 测试 DoH 服务（确保可用）

使用 curl 或浏览器测试 DoH 是否可用，例如：
```sh
curl -X GET "https://doh.example.com/dns-query?name=example.com&type=A" -H "Accept: application/dns-json"
```
✅ 如果返回正确的 JSON 解析结果，则说明部署成功！ 🎉

---

## ⚠ 4️⃣ 免责声明 ⚠

❌ **该项目仅出于个人兴趣，与 Vercel 官方无关，未获得 Vercel 允许。**  
❌ **如因使用该项目导致侵权或账户被封禁，本人概不负责。**

---

## 5️⃣ 常见公共 DoH 服务器（可替换）

🔹 **你可以修改代码中的 DoH 服务器地址，以使用不同的提供商！**

路径：api/dns-query.js

```txt
Google DoH: https://dns.google/dns-query
Cloudflare DoH: https://cloudflare-dns.com/dns-query
Quad9 DoH: https://dns.quad9.net/dns-query
AdGuard DoH: https://dns.adguard.com/dns-query
NextDNS DoH: https://dns.nextdns.io/dns-query
```  

---

## 🎯 6️⃣ 结语

✅ 现在，你已成功在 Vercel 上部署了一个 DoH 转发服务！🚀  
✅ 欢迎 **Star & Fork** 支持原项目！🎉

