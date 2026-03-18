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

module.exports = router;
