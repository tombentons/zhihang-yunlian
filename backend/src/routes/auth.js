const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// ============================================
// POST /api/auth/register - 用户注册
// ============================================
router.post('/register', (req, res) => {
  try {
    const { username, password, role, real_name, phone, email, company_name,
            license_plate, driver_license, transport_license, vehicle_type, container_types } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: '用户名、密码和角色为必填项' });
    }
    if (!['shipper', 'driver', 'forwarder', 'admin'].includes(role)) {
      return res.status(400).json({ error: '无效的角色类型' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度不能少于6位' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(409).json({ error: '该用户名已被注册' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const stmt = db.prepare(`
      INSERT INTO users (username, password, role, real_name, phone, email, company_name,
        license_plate, driver_license, transport_license, vehicle_type, container_types, status, verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const needsReview = role === 'driver';
    const result = stmt.run(
      username, hashedPassword, role, real_name || null, phone || null, email || null,
      company_name || null, license_plate || null, driver_license || null,
      transport_license || null, vehicle_type || null,
      container_types ? JSON.stringify(container_types) : null,
      needsReview ? 'pending_review' : 'active',
      needsReview ? 0 : 1
    );

    const token = jwt.sign(
      { id: result.lastInsertRowid, username, role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 创建欢迎通知
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, content)
      VALUES (?, 'system', '欢迎加入智航云连', '感谢您注册智航云连平台！我们致力于打造港航集疏运数字服务平台，为您提供透明、高效的物流服务。')
    `).run(result.lastInsertRowid);

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: result.lastInsertRowid,
        username,
        role,
        real_name,
        phone,
        status: needsReview ? 'pending_review' : 'active'
      }
    });
  } catch (err) {
    console.error('注册失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// POST /api/auth/login - 用户登录
// ============================================
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和密码' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: '您的账户已被暂停，请联系客服' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        real_name: user.real_name,
        phone: user.phone,
        company_name: user.company_name,
        credit_score: user.credit_score,
        total_orders: user.total_orders,
        completed_orders: user.completed_orders,
        status: user.status,
        verified: user.verified,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// GET /api/auth/me - 获取当前用户信息
// ============================================
router.get('/me', authenticate, (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    const { password, ...userInfo } = user;
    res.json({ user: userInfo });
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// PUT /api/auth/profile - 更新个人信息
// ============================================
router.put('/profile', authenticate, (req, res) => {
  try {
    const { real_name, phone, email, company_name, license_plate, vehicle_type } = req.body;
    db.prepare(`
      UPDATE users SET real_name=?, phone=?, email=?, company_name=?, license_plate=?, vehicle_type=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(real_name, phone, email, company_name, license_plate, vehicle_type, req.user.id);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const { password, ...userInfo } = user;
    res.json({ message: '个人信息更新成功', user: userInfo });
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
