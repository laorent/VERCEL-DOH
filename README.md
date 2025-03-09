# Vercel DoH 转发部署说明

## 1. Fork 仓库

1. 访问 [DoH 转发仓库](https://github.com/example/doh-forwarder)（请替换为实际仓库地址）。
2. 点击右上角的 `Fork` 按钮，将仓库 Fork 到自己的 GitHub 账户。
3. 进入 Fork 后的仓库，顺手点个 `Star` 以示支持。

## 2. 部署到 Vercel

1. 进入 [Vercel 官网](https://vercel.com/) 并登录。
2. 在 Vercel 仪表盘中，点击 `New Project`。
3. 选择刚刚 Fork 的 DoH 仓库。
4. 根据提示进行简单配置后，点击 `Deploy`。

### 可选：绑定自定义域

1. 在 Vercel 项目页面，进入 `Settings` > `Domains`。
2. 添加自定义域名（如 `doh.example.com`）。
3. 按照 Vercel 提示在你的 DNS 解析服务商处添加 CNAME 记录。
4. 等待解析生效后，即可使用自定义域名访问。

## 3. 测试 DoH 服务

使用 curl 或浏览器测试 DoH 是否可用，例如：
```sh
curl -X GET "https://doh.example.com/dns-query?name=example.com&type=A" -H "Accept: application/dns-json"
```
如果返回正确的 JSON 解析结果，则说明部署成功！

## 4. 结语

这样，你就成功在 Vercel 上部署了一个 DoH 转发服务。欢迎 Star & Fork 支持原项目！

