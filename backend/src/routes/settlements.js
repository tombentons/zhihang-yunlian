const express = require('express');
const { db } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// ============================================
// GET /api/settlements - 获取结算记录
// ============================================
router.get('/', authenticate, (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let query = '';
    let params = [];

    if (req.user.role === 'admin') {
      query = `SELECT s.*, o.order_no, u1.real_name as driver_name, u2.real_name as shipper_name
               FROM settlements s
               JOIN orders o ON s.order_id = o.id
               JOIN users u1 ON s.driver_id = u1.id
               JOIN users u2 ON s.shipper_id = u2.id`;
    } else if (req.user.role === 'driver') {
      query = `SELECT s.*, o.order_no, u.real_name as shipper_name, u.company_name
               FROM settlements s
               JOIN orders o ON s.order_id = o.id
               JOIN users u ON s.shipper_id = u.id
               WHERE s.driver_id = ?`;
      params.push(req.user.id);
    } else {
      query = `SELECT s.*, o.order_no, u.real_name as driver_name, u.license_plate
               FROM settlements s
               JOIN orders o ON s.order_id = o.id
               JOIN users u ON s.driver_id = u.id
               WHERE s.shipper_id = ?`;
      params.push(req.user.id);
    }

    if (status) {
      query += params.length > 0 ? ' AND' : ' WHERE';
      query += ' s.status = ?';
      params.push(status);
    }

    query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    const settlements = db.prepare(query).all(...params, parseInt(limit), parseInt(offset));

    // 统计金额
    let statsQuery = 'SELECT COALESCE(SUM(amount),0) as total_amount, COALESCE(SUM(driver_amount),0) as total_driver_amount, COALESCE(SUM(platform_fee),0) as total_platform_fee FROM settlements';
    let statsParams = [];
    if (req.user.role === 'driver') {
      statsQuery += ' WHERE driver_id = ?';
      statsParams.push(req.user.id);
    } else if (req.user.role !== 'admin') {
      statsQuery += ' WHERE shipper_id = ?';
      statsParams.push(req.user.id);
    }

    const stats = db.prepare(statsQuery).get(...statsParams);

    res.json({ settlements, stats });
  } catch (err) {
    console.error('获取结算记录失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// PUT /api/settlements/:id/complete - 完成结算（极速结算）
// ============================================
router.put('/:id/complete', authenticate, authorize('admin'), (req, res) => {
  try {
    const settlement = db.prepare('SELECT * FROM settlements WHERE id = ?').get(req.params.id);
    if (!settlement) return res.status(404).json({ error: '结算记录不存在' });
    if (settlement.status !== 'pending') return res.status(400).json({ error: '该结算已处理' });

    db.prepare(`
      UPDATE settlements SET status = 'completed', paid_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(req.params.id);

    // 通知司机
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, content, related_id)
      VALUES (?, 'payment', '运费到账通知', '您有一笔运费 ¥${settlement.driver_amount} 已到账，请查看结算中心。', ?)
    `).run(settlement.driver_id, settlement.order_id);

    res.json({ message: '结算完成' });
  } catch (err) {
    console.error('结算失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
