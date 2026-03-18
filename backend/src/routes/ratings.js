const express = require('express');
const { db } = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ============================================
// POST /api/ratings - 提交评价
// ============================================
router.post('/', authenticate, (req, res) => {
  try {
    const { order_id, rated_id, score, punctuality, service, communication, comment } = req.body;

    if (!order_id || !rated_id || !score) {
      return res.status(400).json({ error: '订单ID、被评价人ID和评分为必填项' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
    if (!order) return res.status(404).json({ error: '订单不存在' });
    if (order.status !== 'completed') return res.status(400).json({ error: '只能对已完成的订单进行评价' });

    // 检查是否已评价
    const existing = db.prepare('SELECT id FROM ratings WHERE order_id = ? AND rater_id = ?').get(order_id, req.user.id);
    if (existing) return res.status(400).json({ error: '您已对此订单进行过评价' });

    db.prepare(`
      INSERT INTO ratings (order_id, rater_id, rated_id, rater_role, score, punctuality, service, communication, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(order_id, req.user.id, rated_id, req.user.role, score, punctuality || score, service || score, communication || score, comment || null);

    // 更新被评价人的信用分（加权平均）
    const avgRating = db.prepare('SELECT AVG(score) as avg_score FROM ratings WHERE rated_id = ?').get(rated_id);
    if (avgRating.avg_score) {
      const newCredit = Math.min(100, Math.round(avgRating.avg_score * 20 * 100) / 100);
      db.prepare('UPDATE users SET credit_score = ? WHERE id = ?').run(newCredit, rated_id);
    }

    // 标记订单已评价
    if (req.user.role === 'shipper' || req.user.role === 'forwarder') {
      db.prepare('UPDATE orders SET shipper_rated = 1 WHERE id = ?').run(order_id);
    } else if (req.user.role === 'driver') {
      db.prepare('UPDATE orders SET driver_rated = 1 WHERE id = ?').run(order_id);
    }

    res.status(201).json({ message: '评价提交成功' });
  } catch (err) {
    console.error('提交评价失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// GET /api/ratings/user/:userId - 获取用户评价
// ============================================
router.get('/user/:userId', authenticate, (req, res) => {
  try {
    const ratings = db.prepare(`
      SELECT r.*, u.real_name as rater_name, u.role as rater_actual_role
      FROM ratings r JOIN users u ON r.rater_id = u.id
      WHERE r.rated_id = ? ORDER BY r.created_at DESC
    `).all(req.params.userId);

    const summary = db.prepare(`
      SELECT COUNT(*) as total, AVG(score) as avg_score,
             AVG(punctuality) as avg_punctuality, AVG(service) as avg_service,
             AVG(communication) as avg_communication
      FROM ratings WHERE rated_id = ?
    `).get(req.params.userId);

    res.json({ ratings, summary });
  } catch (err) {
    console.error('获取评价失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
