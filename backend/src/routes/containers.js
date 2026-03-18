const express = require('express');
const { db } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// ============================================
// GET /api/containers/empty - 查询空箱动态
// ============================================
router.get('/empty', authenticate, (req, res) => {
  try {
    const { container_type, yard_name, action_type, shipping_company, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let query = "SELECT * FROM empty_containers WHERE status = 'available'";
    let params = [];

    if (container_type) {
      query += ' AND container_type = ?';
      params.push(container_type);
    }
    if (yard_name) {
      query += ' AND yard_name LIKE ?';
      params.push(`%${yard_name}%`);
    }
    if (action_type) {
      query += ' AND (action_type = ? OR action_type = ?)';
      params.push(action_type, 'both');
    }
    if (shipping_company) {
      query += ' AND shipping_company LIKE ?';
      params.push(`%${shipping_company}%`);
    }

    query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    const containers = db.prepare(query).all(...params, parseInt(limit), parseInt(offset));

    const totalQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total').replace(/ ORDER BY.*$/, '');
    // 简化计数
    const countQ = "SELECT COUNT(*) as total FROM empty_containers WHERE status = 'available'";
    const { total } = db.prepare(countQ).get();

    res.json({ containers, total });
  } catch (err) {
    console.error('查询空箱动态失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// POST /api/containers/match - 智能空箱匹配（核心算法）
// ============================================
router.post('/match', authenticate, (req, res) => {
  try {
    const { container_type, action_type, current_lat, current_lng, radius_km = 50 } = req.body;

    if (!container_type || !action_type) {
      return res.status(400).json({ error: '箱型和操作类型为必填项' });
    }

    // 查询符合条件的空箱
    let query = "SELECT * FROM empty_containers WHERE status = 'available' AND container_type = ? AND (action_type = ? OR action_type = 'both')";
    const containers = db.prepare(query).all(container_type, action_type);

    // 如果提供了当前位置，按距离排序（简化的距离计算）
    let matched = containers;
    if (current_lat && current_lng) {
      matched = containers.map(c => {
        const dLat = (c.yard_lat || 31.1) - current_lat;
        const dLng = (c.yard_lng || 121.7) - current_lng;
        const distance = Math.sqrt(dLat * dLat + dLng * dLng) * 111;
        return { ...c, distance_km: Math.round(distance * 10) / 10 };
      }).filter(c => c.distance_km <= radius_km)
        .sort((a, b) => a.distance_km - b.distance_km);
    }

    // 生成推荐方案
    const recommendations = matched.slice(0, 5).map((c, i) => ({
      rank: i + 1,
      container: c,
      estimated_savings: Math.round((50 - (c.distance_km || 20)) * 8 * 100) / 100,
      recommendation: c.distance_km < 10 ? '强烈推荐 - 距离最近' :
                       c.distance_km < 25 ? '推荐 - 距离较近' : '可选 - 距离适中'
    }));

    res.json({
      total_available: matched.length,
      recommendations,
      query_params: { container_type, action_type, current_lat, current_lng, radius_km }
    });
  } catch (err) {
    console.error('空箱匹配失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// POST /api/containers/empty - 管理员添加空箱信息
// ============================================
router.post('/empty', authenticate, authorize('admin'), (req, res) => {
  try {
    const { container_type, shipping_company, yard_name, yard_address,
            yard_lat, yard_lng, quantity, available_from, available_until, action_type, notes } = req.body;

    if (!container_type || !yard_name) {
      return res.status(400).json({ error: '箱型和堆场名称为必填项' });
    }

    const result = db.prepare(`
      INSERT INTO empty_containers (container_type, shipping_company, yard_name, yard_address,
        yard_lat, yard_lng, quantity, available_from, available_until, action_type, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(container_type, shipping_company, yard_name, yard_address,
      yard_lat, yard_lng, quantity || 1, available_from, available_until, action_type || 'both', notes);

    const container = db.prepare('SELECT * FROM empty_containers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: '空箱信息添加成功', container });
  } catch (err) {
    console.error('添加空箱信息失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
