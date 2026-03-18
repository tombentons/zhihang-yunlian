const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'zhihang_yunlian_secret_key_2024';

// JWT认证中间件：验证用户身份
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证令牌，请先登录' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: '令牌无效或已过期，请重新登录' });
  }
}

// 角色授权中间件：限制特定角色访问
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '请先登录' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '您没有权限执行此操作' });
    }
    next();
  };
}

module.exports = { authenticate, authorize, JWT_SECRET };
