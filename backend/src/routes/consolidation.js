const express = require('express');
const { db } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// ============================================
// POST /api/consolidation/smart-match - 智能拼单推荐（核心算法）
// 基于司机当前位置、订单路线，推荐最优的重进重出/双重运输方案
// ============================================
router.post('/smart-match', authenticate, authorize('driver'), (req, res) => {
  try {
    const { current_lat, current_lng, preferred_container_types, max_distance_km = 80 } = req.body;

    const driverLat = current_lat || 31.2;
    const driverLng = current_lng || 121.5;

    // 获取所有待接订单
    const pendingOrders = db.prepare(`
      SELECT o.*, u.company_name as shipper_company
      FROM orders o JOIN users u ON o.shipper_id = u.id
      WHERE o.status = 'pending' AND o.driver_id IS NULL
    `).all();

    if (pendingOrders.length === 0) {
      return res.json({ plans: [], message: '当前没有可拼单的订单' });
    }

    // 计算每个订单到司机的距离
    const ordersWithDistance = pendingOrders.map(order => {
      const dLat = (order.origin_lat || 31.2) - driverLat;
      const dLng = (order.origin_lng || 121.5) - driverLng;
      const distToPickup = Math.sqrt(dLat * dLat + dLng * dLng) * 111;
      return { ...order, dist_to_pickup: Math.round(distToPickup * 10) / 10 };
    }).filter(o => o.dist_to_pickup <= max_distance_km);

    // 按距离排序
    ordersWithDistance.sort((a, b) => a.dist_to_pickup - b.dist_to_pickup);

    // 尝试两两组合，寻找可拼单方案
    const plans = [];

    for (let i = 0; i < Math.min(ordersWithDistance.length, 10); i++) {
      const order1 = ordersWithDistance[i];

      // 方案1：单独接单
      plans.push({
        type: 'single',
        plan_type: 'nearby_return',
        orders: [order1],
        description: `直接前往 ${order1.origin_address} 提货，送至 ${order1.destination_address}`,
        total_distance: order1.dist_to_pickup + 50,
        empty_km: order1.dist_to_pickup,
        estimated_earnings: order1.estimated_price || 600,
        efficiency_score: Math.round((1 - order1.dist_to_pickup / 100) * 100)
      });

      // 方案2：与其他订单组合（双重运输）
      for (let j = i + 1; j < Math.min(ordersWithDistance.length, 10); j++) {
        const order2 = ordersWithDistance[j];

        // 检查两个订单目的地是否在同一方向（简化判断）
        const dest1Lat = order1.destination_lat || 30.6;
        const dest2Lat = order2.destination_lat || 30.7;
        const dest1Lng = order1.destination_lng || 122.0;
        const dest2Lng = order2.destination_lng || 121.9;

        const destDist = Math.sqrt(Math.pow(dest1Lat - dest2Lat, 2) + Math.pow(dest1Lng - dest2Lng, 2)) * 111;

        if (destDist < 30) {
          const totalEarnings = (order1.estimated_price || 600) + (order2.estimated_price || 600);
          const totalDist = order1.dist_to_pickup + 50 + destDist + 50;
          const savedKm = order2.dist_to_pickup;

          plans.push({
            type: 'double_load',
            plan_type: 'double_load',
            orders: [order1, order2],
            description: `双重运输：先提 ${order1.origin_address} 的货，再顺路提 ${order2.origin_address} 的货，两票送至港区`,
            total_distance: Math.round(totalDist),
            empty_km: Math.round(order1.dist_to_pickup),
            saved_empty_km: Math.round(savedKm),
            estimated_earnings: totalEarnings,
            estimated_savings: Math.round(savedKm * 8),
            efficiency_score: Math.min(100, Math.round((1 - order1.dist_to_pickup / 200) * 100 + 20))
          });
        }
      }
    }

    // 查找附近的空箱堆场，推荐顺路还箱
    const nearbyContainers = db.prepare(`
      SELECT * FROM empty_containers WHERE status = 'available'
    `).all().map(c => {
      const d = Math.sqrt(Math.pow((c.yard_lat || 31.1) - driverLat, 2) + Math.pow((c.yard_lng || 121.7) - driverLng, 2)) * 111;
      return { ...c, distance_km: Math.round(d * 10) / 10 };
    }).filter(c => c.distance_km <= 30).sort((a, b) => a.distance_km - b.distance_km).slice(0, 3);

    // 按效率评分排序
    plans.sort((a, b) => b.efficiency_score - a.efficiency_score);

    res.json({
      total_plans: plans.length,
      plans: plans.slice(0, 10),
      nearby_empty_containers: nearbyContainers,
      tips: '系统已根据您的位置和订单情况，为您推荐最优的拼单方案。双重运输方案可有效减少空驶里程。'
    });
  } catch (err) {
    console.error('智能拼单匹配失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================
// GET /api/consolidation/plans - 获取我的拼单计划
// ============================================
router.get('/plans', authenticate, authorize('driver'), (req, res) => {
  try {
    const plans = db.prepare(`
      SELECT * FROM consolidation_plans WHERE driver_id = ? ORDER BY created_at DESC
    `).all(req.user.id);
    res.json({ plans });
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
