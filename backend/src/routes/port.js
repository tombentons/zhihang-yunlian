const express = require('express');
const { db } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// ============================================
// GET /api/port/dynamics - 获取港口动态列表
// ============================================
router.get('/dynamics', authenticate, (req, res) => {
  try {
    const { port_name, category, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let query = "SELECT * FROM port_dynamics WHERE status = 'active'";
    let params = [];

    if (port_name) {
      query += ' AND port_name LIKE ?';
      params.push(`%${port_name}%`);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    const dynamics = db.prepare(query).all(...params, parseInt(limit), parseInt(offset));
    res.json({ dynamics });
  } catch (err) {
    console.error('获取港口动态失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// GET /api/port/congestion - 获取闸口拥堵指数概览
// ============================================
router.get('/congestion', authenticate, (req, res) => {
  try {
    const congestion = db.prepare(`
      SELECT port_name, gate_name, congestion_index, estimated_wait_minutes, updated_at
      FROM port_dynamics
      WHERE category = 'congestion' AND status = 'active'
      ORDER BY port_name, gate_name
    `).all();
    res.json({ congestion });
  } catch (err) {
    console.error('获取拥堵数据失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// GET /api/port/ships - 获取船舶动态
// ============================================
router.get('/ships', authenticate, (req, res) => {
  try {
    const { port_name } = req.query;
    let query = "SELECT * FROM port_dynamics WHERE category = 'berth' AND status = 'active'";
    let params = [];
    if (port_name) {
      query += ' AND port_name LIKE ?';
      params.push(`%${port_name}%`);
    }
    query += ' ORDER BY ship_eta ASC';
    const ships = db.prepare(query).all(...params);
    res.json({ ships });
  } catch (err) {
    console.error('获取船舶动态失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// POST /api/port/dynamics - 管理员发布港口动态
// ============================================
router.post('/dynamics', authenticate, authorize('admin'), (req, res) => {
  try {
    const { port_name, gate_name, category, title, content,
            congestion_index, estimated_wait_minutes, ship_name, ship_eta, ship_etd, source } = req.body;

    if (!port_name || !title || !category) {
      return res.status(400).json({ error: '港口名称、标题和类别为必填项' });
    }

    const stmt = db.prepare(`
      INSERT INTO port_dynamics (port_name, gate_name, category, title, content,
        congestion_index, estimated_wait_minutes, ship_name, ship_eta, ship_etd, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(port_name, gate_name, category, title, content,
      congestion_index, estimated_wait_minutes, ship_name, ship_eta, ship_etd, source);

    const dynamic = db.prepare('SELECT * FROM port_dynamics WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: '港口动态发布成功', dynamic });
  } catch (err) {
    console.error('发布港口动态失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// GET /api/port/overview - 港口数据总览（看板用）
// ============================================
router.get('/overview', authenticate, (req, res) => {
  try {
    const totalDynamics = db.prepare("SELECT COUNT(*) as count FROM port_dynamics WHERE status='active'").get();
    const congestionData = db.prepare(`
      SELECT port_name, AVG(congestion_index) as avg_congestion, AVG(estimated_wait_minutes) as avg_wait
      FROM port_dynamics WHERE category='congestion' AND status='active'
      GROUP BY port_name
    `).all();
    const recentNotices = db.prepare(`
      SELECT * FROM port_dynamics WHERE category IN ('restriction','notice') AND status='active'
      ORDER BY created_at DESC LIMIT 5
    `).all();
    const shipCount = db.prepare("SELECT COUNT(*) as count FROM port_dynamics WHERE category='berth' AND status='active'").get();

    res.json({
      overview: {
        total_dynamics: totalDynamics.count,
        congestion_by_port: congestionData,
        recent_notices: recentNotices,
        active_ships: shipCount.count
      }
    });
  } catch (err) {
    console.error('获取港口总览失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
