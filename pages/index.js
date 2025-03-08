export default function Home() {
  return (
    <div style={{ 
      fontFamily: 'system-ui, -apple-system, sans-serif', 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '2rem 1rem' 
    }}>
      <h1>DOH代理服务</h1>
      <p>这是一个简单的DNS over HTTPS代理服务。</p>
      <p>您可以通过以下方式使用此服务:</p>
      <code style={{ 
        display: 'block', 
        background: '#f4f4f4', 
        padding: '1rem', 
        borderRadius: '4px' 
      }}>
        /dns-query?name=example.com&type=A
      </code>
      <p>状态: 正在运行</p>
    </div>
  );
}
