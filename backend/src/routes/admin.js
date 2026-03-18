const express = require('express');
const { db } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// ============================================
// GET /api/admin/dashboard - 管理后台数据总览
// ============================================
router.get('/dashboard', authenticate, authorize('admin'), (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const usersByRole = db.prepare('SELECT role, COUNT(*) as count FROM users GROUP BY role').all();
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get();
    const ordersByStatus = db.prepare('SELECT status, COUNT(*) as count FROM orders GROUP BY status').all();
    const totalRevenue = db.prepare("SELECT COALESCE(SUM(final_price),0) as total FROM orders WHERE status='completed'").get();
    const totalPlatformFee = db.prepare("SELECT COALESCE(SUM(platform_fee),0) as total FROM settlements").get();
    const pendingReviews = db.prepare("SELECT COUNT(*) as count FROM users WHERE status='pending_review'").get();

    // 近7天订单趋势
    const orderTrend = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM orders WHERE created_at >= DATE('now', '-7 days')
      GROUP BY DATE(created_at) ORDER BY date
    `).all();

    // 热门港口
    const topPorts = db.prepare(`
      SELECT port_name, COUNT(*) as order_count
      FROM orders WHERE port_name IS NOT NULL
      GROUP BY port_name ORDER BY order_count DESC LIMIT 5
    `).all();

    res.json({
      dashboard: {
        total_users: totalUsers.count,
        users_by_role: usersByRole,
        total_orders: totalOrders.count,
        orders_by_status: ordersByStatus,
        total_revenue: totalRevenue.total,
        total_platform_fee: totalPlatformFee.total,
        pending_reviews: pendingReviews.count,
        order_trend: orderTrend,
        top_ports: topPorts
      }
    });
  } catch (err) {
    console.error('获取仪表盘数据失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// GET /api/admin/users - 获取用户列表
// ============================================
router.get('/users', authenticate, authorize('admin'), (req, res) => {
  try {
    const { role, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let query = 'SELECT id, username, role, real_name, phone, email, company_name, license_plate, credit_score, total_orders, completed_orders, status, verified, created_at FROM users';
    let conditions = [];
    let params = [];

    if (role) { conditions.push('role = ?'); params.push(role); }
    if (status) { conditions.push('status = ?'); params.push(status); }

    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    const users = db.prepare(query).all(...params, parseInt(limit), parseInt(offset));
    const total = db.prepare('SELECT COUNT(*) as count FROM users').get();

    res.json({ users, total: total.count });
  } catch (err) {
    console.error('获取用户列表失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// PUT /api/admin/users/:id/verify - 审核用户（司机资质审核）
// ============================================
router.put('/users/:id/verify', authenticate, authorize('admin'), (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: '用户不存在' });

    if (action === 'approve') {
      db.prepare("UPDATE users SET status = 'active', verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, content)
        VALUES (?, 'system', '资质审核通过', '恭喜！您的资质审核已通过，现在可以开始接单了。')
      `).run(req.params.id);
    } else {
      db.prepare("UPDATE users SET status = 'suspended', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, content)
        VALUES (?, 'system', '资质审核未通过', '很遗憾，您提交的资质审核未通过，请检查并重新提交相关材料。')
      `).run(req.params.id);
    }

    res.json({ message: action === 'approve' ? '审核通过' : '审核拒绝' });
  } catch (err) {
    console.error('审核用户失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// PUT /api/admin/users/:id/status - 更新用户状态
// ============================================
router.put('/users/:id/status', authenticate, authorize('admin'), (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ error: '无效的状态' });
    }
    db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
    res.json({ message: '用户状态更新成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// DELETE /api/admin/users/:id - 删除用户
// ============================================
router.delete('/users/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    if (user.role === 'admin') return res.status(403).json({ error: '不能删除管理员账户' });
    db.prepare('DELETE FROM notifications WHERE user_id = ?').run(req.params.id);
    db.prepare('DELETE FROM ratings WHERE rater_id = ? OR rated_id = ?').run(req.params.id, req.params.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ message: '用户已删除' });
  } catch (err) {
    console.error('删除用户失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// PUT /api/admin/users/:id - 编辑用户信息
// ============================================
router.put('/users/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    const { real_name, phone, email, company_name, credit_score, role } = req.body;
    db.prepare(`UPDATE users SET
      real_name = COALESCE(?, real_name), phone = COALESCE(?, phone),
      email = COALESCE(?, email), company_name = COALESCE(?, company_name),
      credit_score = COALESCE(?, credit_score), role = COALESCE(?, role),
      updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(real_name, phone, email, company_name, credit_score, role, req.params.id);
    const updated = db.prepare('SELECT id, username, role, real_name, phone, email, company_name, credit_score, status FROM users WHERE id = ?').get(req.params.id);
    res.json({ message: '用户信息更新成功', user: updated });
  } catch (err) {
    console.error('编辑用户失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// GET /api/admin/orders - 管理所有订单
// ============================================
router.get('/orders', authenticate, authorize('admin'), (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let query = `SELECT o.*, u1.real_name as shipper_name, u1.company_name, u2.real_name as driver_name, u2.license_plate
      FROM orders o LEFT JOIN users u1 ON o.shipper_id=u1.id LEFT JOIN users u2 ON o.driver_id=u2.id`;
    let params = [];
    if (status) { query += ' WHERE o.status = ?'; params.push(status); }
    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    const orders = db.prepare(query).all(...params, parseInt(limit), parseInt(offset));
    const total = db.prepare('SELECT COUNT(*) as count FROM orders').get();
    res.json({ orders, total: total.count });
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// PUT /api/admin/orders/:id - 管理员编辑订单
// ============================================
router.put('/orders/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: '订单不存在' });
    const { status, final_price, notes } = req.body;
    db.prepare(`UPDATE orders SET
      status = COALESCE(?, status), final_price = COALESCE(?, final_price),
      notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(status, final_price, notes, req.params.id);
    res.json({ message: '订单更新成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// DELETE /api/admin/orders/:id - 删除订单
// ============================================
router.delete('/orders/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: '订单不存在' });
    db.prepare('DELETE FROM tracking_records WHERE order_id = ?').run(req.params.id);
    db.prepare('DELETE FROM ratings WHERE order_id = ?').run(req.params.id);
    db.prepare('DELETE FROM settlements WHERE order_id = ?').run(req.params.id);
    db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
    res.json({ message: '订单已删除' });
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// POST /api/admin/port-dynamics - 创建港口动态
// ============================================
router.post('/port-dynamics', authenticate, authorize('admin'), (req, res) => {
  try {
    const { port_name, category, title, content, congestion_index, estimated_wait_minutes, gate_name, ship_name, ship_eta, source } = req.body;
    if (!port_name || !category || !title) return res.status(400).json({ error: '缺少必要字段' });
    const result = db.prepare(`INSERT INTO port_dynamics (port_name, category, title, content, congestion_index, estimated_wait_minutes, gate_name, ship_name, ship_eta, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(port_name, category, title, content, congestion_index, estimated_wait_minutes, gate_name, ship_name, ship_eta, source || '管理员发布');
    res.json({ message: '港口动态发布成功', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// DELETE /api/admin/port-dynamics/:id - 删除港口动态
// ============================================
router.delete('/port-dynamics/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    db.prepare('DELETE FROM port_dynamics WHERE id = ?').run(req.params.id);
    res.json({ message: '港口动态已删除' });
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// POST /api/admin/containers - 添加空箱信息
// ============================================
router.post('/containers', authenticate, authorize('admin'), (req, res) => {
  try {
    const { yard_name, yard_address, container_type, quantity, shipping_company, action_type, available_from, available_until, notes, yard_lat, yard_lng } = req.body;
    if (!yard_name || !container_type || !quantity) return res.status(400).json({ error: '缺少必要字段' });
    const result = db.prepare(`INSERT INTO empty_containers (yard_name, yard_address, container_type, quantity, shipping_company, action_type, available_from, available_until, notes, yard_lat, yard_lng)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(yard_name, yard_address, container_type, quantity, shipping_company, action_type || 'both', available_from, available_until, notes, yard_lat, yard_lng);
    res.json({ message: '空箱信息添加成功', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// DELETE /api/admin/containers/:id - 删除空箱信息
// ============================================
router.delete('/containers/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    db.prepare('DELETE FROM empty_containers WHERE id = ?').run(req.params.id);
    res.json({ message: '空箱信息已删除' });
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
