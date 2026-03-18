const express = require('express');
const { db } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// ============================================
// POST /api/tracking - 司机上报位置（模拟北斗定位）
// ============================================
router.post('/', authenticate, authorize('driver'), (req, res) => {
  try {
    const { order_id, latitude, longitude, speed, heading, status_note } = req.body;

    if (!order_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: '订单ID和经纬度为必填项' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND driver_id = ?').get(order_id, req.user.id);
    if (!order) {
      return res.status(404).json({ error: '订单不存在或不属于您' });
    }

    db.prepare(`
      INSERT INTO tracking_records (order_id, driver_id, latitude, longitude, speed, heading, status_note)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(order_id, req.user.id, latitude, longitude, speed || 0, heading || 0, status_note || null);

    // 同步更新司机当前位置
    db.prepare('UPDATE users SET current_lat = ?, current_lng = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(latitude, longitude, req.user.id);

    res.json({ message: '位置上报成功' });
  } catch (err) {
    console.error('位置上报失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// GET /api/tracking/:orderId - 获取订单轨迹
// ============================================
router.get('/:orderId', authenticate, (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    // 权限检查：只有货主、司机本人和管理员可以查看
    if (req.user.role !== 'admin' && order.shipper_id !== req.user.id && order.driver_id !== req.user.id) {
      return res.status(403).json({ error: '无权查看该订单轨迹' });
    }

    const records = db.prepare(`
      SELECT tr.*, u.real_name as driver_name, u.license_plate
      FROM tracking_records tr
      JOIN users u ON tr.driver_id = u.id
      WHERE tr.order_id = ?
      ORDER BY tr.recorded_at ASC
    `).all(req.params.orderId);

    // 获取最新位置
    const latest = records.length > 0 ? records[records.length - 1] : null;

    res.json({
      order_id: parseInt(req.params.orderId),
      order_no: order.order_no,
      order_status: order.status,
      total_points: records.length,
      latest_position: latest,
      track: records
    });
  } catch (err) {
    console.error('获取轨迹失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// POST /api/tracking/simulate/:orderId - 模拟轨迹数据生成
// ============================================
router.post('/simulate/:orderId', authenticate, (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.orderId);
    if (!order) return res.status(404).json({ error: '订单不存在' });
    if (!order.driver_id) return res.status(400).json({ error: '订单尚未分配司机' });

    // 模拟从起点到终点的轨迹
    const startLat = order.origin_lat || 31.2304;
    const startLng = order.origin_lng || 121.4737;
    const endLat = order.destination_lat || 30.6302;
    const endLng = order.destination_lng || 122.0658;

    const points = 20;
    const insertStmt = db.prepare(`
      INSERT INTO tracking_records (order_id, driver_id, latitude, longitude, speed, heading, status_note, recorded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = Date.now();
    const transaction = db.transaction(() => {
      for (let i = 0; i <= points; i++) {
        const ratio = i / points;
        const lat = startLat + (endLat - startLat) * ratio + (Math.random() - 0.5) * 0.005;
        const lng = startLng + (endLng - startLng) * ratio + (Math.random() - 0.5) * 0.005;
        const speed = 40 + Math.random() * 40;
        const time = new Date(now - (points - i) * 15 * 60 * 1000).toISOString();
        let note = null;
        if (i === 0) note = '出发提货';
        else if (i === Math.floor(points / 2)) note = '途经S32高速';
        else if (i === points) note = '到达港区';

        insertStmt.run(order.id, order.driver_id, lat, lng, speed, 0, note, time);
      }
    });
    transaction();

    res.json({ message: `已生成 ${points + 1} 个模拟轨迹点` });
  } catch (err) {
    console.error('模拟轨迹生成失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
