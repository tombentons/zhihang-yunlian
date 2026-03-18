const express = require('express');
const { db } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// 生成订单号：ZH + 年月日 + 6位随机数
function generateOrderNo() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `ZH${date}${rand}`;
}

// 根据距离和箱型估算运费
function estimatePrice(containerType, distanceKm) {
  const basePrices = {
    '20GP': 8, '40GP': 12, '40HQ': 13,
    '45HQ': 15, '20RF': 14, '40RF': 18
  };
  const pricePerKm = basePrices[containerType] || 10;
  const baseCharge = 200;
  return Math.round((baseCharge + pricePerKm * (distanceKm || 50)) * 100) / 100;
}

// ============================================
// POST /api/orders - 货主发布运输订单
// ============================================
router.post('/', authenticate, authorize('shipper', 'forwarder', 'admin'), (req, res) => {
  try {
    const {
      cargo_type, container_type, container_no, seal_no, bill_of_lading, weight,
      origin_address, origin_lat, origin_lng, destination_address, destination_lat, destination_lng,
      port_name, pickup_time, delivery_deadline, notes, special_requirements
    } = req.body;

    if (!origin_address || !destination_address || !container_type) {
      return res.status(400).json({ error: '起始地址、目的地址和箱型为必填项' });
    }

    const order_no = generateOrderNo();
    const estimated_price = estimatePrice(container_type, null);

    const stmt = db.prepare(`
      INSERT INTO orders (order_no, shipper_id, status, cargo_type, container_type, container_no,
        seal_no, bill_of_lading, weight, origin_address, origin_lat, origin_lng,
        destination_address, destination_lat, destination_lng, port_name,
        pickup_time, delivery_deadline, estimated_price, notes, special_requirements)
      VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      order_no, req.user.id, cargo_type || null, container_type, container_no || null,
      seal_no || null, bill_of_lading || null, weight || null,
      origin_address, origin_lat || 31.2304, origin_lng || 121.4737,
      destination_address, destination_lat || 30.6302, destination_lng || 122.0658,
      port_name || '上海洋山港', pickup_time || null, delivery_deadline || null,
      estimated_price, notes || null, special_requirements || null
    );

    // 更新货主订单数
    db.prepare('UPDATE users SET total_orders = total_orders + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.user.id);

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: '订单发布成功', order });
  } catch (err) {
    console.error('发布订单失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// GET /api/orders - 获取订单列表
// ============================================
router.get('/', authenticate, (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let query = '';
    let countQuery = '';
    let params = [];

    if (req.user.role === 'admin') {
      query = 'SELECT o.*, u1.real_name as shipper_name, u1.company_name, u2.real_name as driver_name, u2.license_plate FROM orders o LEFT JOIN users u1 ON o.shipper_id = u1.id LEFT JOIN users u2 ON o.driver_id = u2.id';
      countQuery = 'SELECT COUNT(*) as total FROM orders';
      if (status) {
        query += ' WHERE o.status = ?';
        countQuery += ' WHERE status = ?';
        params.push(status);
      }
    } else if (req.user.role === 'shipper' || req.user.role === 'forwarder') {
      query = `SELECT o.*, u2.real_name as driver_name, u2.license_plate, u2.phone as driver_phone, u2.credit_score as driver_credit
               FROM orders o LEFT JOIN users u2 ON o.driver_id = u2.id WHERE o.shipper_id = ?`;
      countQuery = 'SELECT COUNT(*) as total FROM orders WHERE shipper_id = ?';
      params.push(req.user.id);
      if (status) {
        query += ' AND o.status = ?';
        countQuery += ' AND status = ?';
        params.push(status);
      }
    } else if (req.user.role === 'driver') {
      query = `SELECT o.*, u1.real_name as shipper_name, u1.company_name, u1.phone as shipper_phone
               FROM orders o LEFT JOIN users u1 ON o.shipper_id = u1.id WHERE o.driver_id = ?`;
      countQuery = 'SELECT COUNT(*) as total FROM orders WHERE driver_id = ?';
      params.push(req.user.id);
      if (status) {
        query += ' AND o.status = ?';
        countQuery += ' AND status = ?';
        params.push(status);
      }
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    const orders = db.prepare(query).all(...params, parseInt(limit), parseInt(offset));
    const { total } = db.prepare(countQuery).get(...params);

    res.json({
      orders,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('获取订单列表失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// GET /api/orders/available - 司机查看可接订单（抢单大厅）
// ============================================
router.get('/available', authenticate, authorize('driver'), (req, res) => {
  try {
    const { container_type, port_name, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let query = `SELECT o.*, u.company_name as shipper_company, u.credit_score as shipper_credit
                 FROM orders o JOIN users u ON o.shipper_id = u.id WHERE o.status = 'pending'`;
    let params = [];

    if (container_type) {
      query += ' AND o.container_type = ?';
      params.push(container_type);
    }
    if (port_name) {
      query += ' AND o.port_name LIKE ?';
      params.push(`%${port_name}%`);
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    const orders = db.prepare(query).all(...params, parseInt(limit), parseInt(offset));
    res.json({ orders });
  } catch (err) {
    console.error('获取可接订单失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// GET /api/orders/:id - 获取订单详情
// ============================================
router.get('/:id', authenticate, (req, res) => {
  try {
    const order = db.prepare(`
      SELECT o.*, u1.real_name as shipper_name, u1.company_name, u1.phone as shipper_phone, u1.credit_score as shipper_credit,
             u2.real_name as driver_name, u2.license_plate, u2.phone as driver_phone, u2.credit_score as driver_credit, u2.vehicle_type
      FROM orders o
      LEFT JOIN users u1 ON o.shipper_id = u1.id
      LEFT JOIN users u2 ON o.driver_id = u2.id
      WHERE o.id = ?
    `).get(req.params.id);

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    // 获取该订单的追踪记录
    const trackingRecords = db.prepare(
      'SELECT * FROM tracking_records WHERE order_id = ? ORDER BY recorded_at DESC LIMIT 50'
    ).all(req.params.id);

    // 获取该订单的评价
    const ratings = db.prepare('SELECT * FROM ratings WHERE order_id = ?').all(req.params.id);

    res.json({ order, trackingRecords, ratings });
  } catch (err) {
    console.error('获取订单详情失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// PUT /api/orders/:id/accept - 司机接单
// ============================================
router.put('/:id/accept', authenticate, authorize('driver'), (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: '订单不存在' });
    if (order.status !== 'pending') return res.status(400).json({ error: '该订单已被接取或已取消' });

    db.prepare(`
      UPDATE orders SET driver_id = ?, status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(req.user.id, req.params.id);

    db.prepare('UPDATE users SET total_orders = total_orders + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.user.id);

    // 通知货主
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, content, related_id)
      VALUES (?, 'order', '订单已被接取', '您的订单 ${order.order_no} 已被司机接取，正在准备提货。', ?)
    `).run(order.shipper_id, order.id);

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    res.json({ message: '接单成功', order: updated });
  } catch (err) {
    console.error('接单失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// PUT /api/orders/:id/status - 更新订单状态
// ============================================
router.put('/:id/status', authenticate, (req, res) => {
  try {
    const { status } = req.body;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: '订单不存在' });

    const validTransitions = {
      'accepted': ['pickup', 'cancelled'],
      'pickup': ['in_transit'],
      'in_transit': ['at_port', 'completed'],
      'at_port': ['completed'],
      'pending': ['cancelled', 'matching']
    };

    if (!validTransitions[order.status] || !validTransitions[order.status].includes(status)) {
      return res.status(400).json({ error: `不允许从 "${order.status}" 转换到 "${status}"` });
    }

    const updates = { status };
    if (status === 'pickup') updates.actual_pickup_time = new Date().toISOString();
    if (status === 'completed') {
      updates.actual_delivery_time = new Date().toISOString();
      updates.final_price = order.estimated_price;
      // 更新完成订单数
      if (order.driver_id) {
        db.prepare('UPDATE users SET completed_orders = completed_orders + 1 WHERE id = ?').run(order.driver_id);
      }
      db.prepare('UPDATE users SET completed_orders = completed_orders + 1 WHERE id = ?').run(order.shipper_id);

      // 创建结算记录
      const platformFee = Math.round(order.estimated_price * 0.05 * 100) / 100;
      db.prepare(`
        INSERT INTO settlements (order_id, driver_id, shipper_id, amount, platform_fee, driver_amount, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
      `).run(order.id, order.driver_id, order.shipper_id, order.estimated_price, platformFee, order.estimated_price - platformFee);
    }

    let setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    setClause += ', updated_at = CURRENT_TIMESTAMP';
    db.prepare(`UPDATE orders SET ${setClause} WHERE id = ?`).run(...Object.values(updates), req.params.id);

    // 发送通知
    const statusNames = {
      'pickup': '司机已到达提货点',
      'in_transit': '货物正在运输中',
      'at_port': '车辆已到达港区',
      'completed': '运输已完成',
      'cancelled': '订单已取消'
    };

    const notifyUserId = req.user.role === 'driver' ? order.shipper_id : order.driver_id;
    if (notifyUserId) {
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, content, related_id)
        VALUES (?, 'order', ?, ?, ?)
      `).run(notifyUserId, statusNames[status] || '订单状态更新', `订单 ${order.order_no} ${statusNames[status] || '状态已更新'}`, order.id);
    }

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    res.json({ message: '订单状态更新成功', order: updated });
  } catch (err) {
    console.error('更新订单状态失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// GET /api/orders/stats/overview - 订单统计概览
// ============================================
router.get('/stats/overview', authenticate, (req, res) => {
  try {
    let where = '';
    let params = [];
    if (req.user.role === 'shipper') {
      where = 'WHERE shipper_id = ?';
      params = [req.user.id];
    } else if (req.user.role === 'driver') {
      where = 'WHERE driver_id = ?';
      params = [req.user.id];
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM orders ${where}`).get(...params);
    const completed = db.prepare(`SELECT COUNT(*) as count FROM orders ${where ? where + ' AND' : 'WHERE'} status='completed'`).get(...params);
    const inTransit = db.prepare(`SELECT COUNT(*) as count FROM orders ${where ? where + ' AND' : 'WHERE'} status='in_transit'`).get(...params);
    const pending = db.prepare(`SELECT COUNT(*) as count FROM orders ${where ? where + ' AND' : 'WHERE'} status='pending'`).get(...params);

    const revenue = db.prepare(`SELECT COALESCE(SUM(final_price),0) as total FROM orders ${where ? where + ' AND' : 'WHERE'} status='completed'`).get(...params);

    res.json({
      stats: {
        total: total.count,
        completed: completed.count,
        in_transit: inTransit.count,
        pending: pending.count,
        revenue: revenue.total
      }
    });
  } catch (err) {
    console.error('获取统计数据失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
