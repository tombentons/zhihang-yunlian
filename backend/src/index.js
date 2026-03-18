const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { initDatabase } = require('./database');

// 初始化数据库
initDatabase();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/api/health') {
      console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
});

// 注册路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/port', require('./routes/port'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/containers', require('./routes/containers'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/consolidation', require('./routes/consolidation'));
app.use('/api/settlements', require('./routes/settlements'));
app.use('/api/admin', require('./routes/admin'));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: '智航云连后端服务', version: '1.0.0', time: new Date().toISOString() });
});

// API 404处理（仅针对/api路径）
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 服务前端静态文件
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

// 所有非API请求返回index.html（支持前端路由）
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('未捕获的错误:', err);
  res.status(500).json({ error: '服务器内部错误，请稍后重试' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 智航云连后端服务已启动`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`🌐 前端页面: http://localhost:${PORT}/`);
  console.log(`❤️  健康检查: http://localhost:${PORT}/api/health`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});
