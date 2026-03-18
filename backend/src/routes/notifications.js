const express = require('express');
const { db } = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ============================================
// GET /api/notifications - 获取当前用户的通知列表
// ============================================
router.get('/', authenticate, (req, res) => {
  try {
    const { type, is_read, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    let params = [req.user.id];

    if (type) { query += ' AND type = ?'; params.push(type); }
    if (is_read !== undefined) { query += ' AND is_read = ?'; params.push(parseInt(is_read)); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const notifications = db.prepare(query).all(...params, parseInt(limit), parseInt(offset));

    const unread = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id);

    res.json({ notifications, unread_count: unread.count });
  } catch (err) {
    console.error('获取通知失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// PUT /api/notifications/:id/read - 标记通知为已读
// ============================================
router.put('/:id/read', authenticate, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ message: '已标记为已读' });
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// PUT /api/notifications/read-all - 全部标记为已读
// ============================================
router.put('/read-all', authenticate, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(req.user.id);
    res.json({ message: '全部已标记为已读' });
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
