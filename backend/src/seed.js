const bcrypt = require('bcryptjs');
const { db, initDatabase } = require('./database');

// 初始化数据库表
initDatabase();

console.log('🌱 开始填充种子数据...');

const hash = (pwd) => bcrypt.hashSync(pwd, 10);

// ============================================
// 1. 创建示例用户
// ============================================
const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (username, password, role, real_name, phone, email, company_name,
    license_plate, driver_license, transport_license, vehicle_type, container_types,
    credit_score, total_orders, completed_orders, status, verified, current_lat, current_lng)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, ?, ?)
`);

const users = [
  // 管理员
  ['admin', hash('123456'), 'admin', '系统管理员', '13800000000', 'admin@zhihang.com', '智航云连科技', null, null, null, null, null, 100, 0, 0, 31.2304, 121.4737],
  // 货主
  ['shipper1', hash('123456'), 'shipper', '张明华', '13811111111', 'zhang@trade.com', '上海明华进出口贸易有限公司', null, null, null, null, null, 95, 28, 25, 31.2304, 121.4737],
  ['shipper2', hash('123456'), 'shipper', '李雪梅', '13811112222', 'li@export.com', '浙江瑞丰工贸有限公司', null, null, null, null, null, 92, 15, 13, 30.2741, 120.1551],
  ['shipper3', hash('123456'), 'shipper', '王建国', '13811113333', 'wang@factory.com', '苏州恒通电子制造有限公司', null, null, null, null, null, 88, 10, 8, 31.2989, 120.5853],
  // 司机
  ['driver1', hash('123456'), 'driver', '陈大勇', '13922221111', 'chen@driver.com', null, '沪A12345', '320123199001011234', 'YS-2024-001', '重型集装箱半挂车', '["20GP","40GP","40HQ"]', 96, 120, 115, 30.6302, 122.0658],
  ['driver2', hash('123456'), 'driver', '刘强', '13922222222', 'liu@driver.com', null, '沪B67890', '320456199205051234', 'YS-2024-002', '重型集装箱半挂车', '["20GP","40GP"]', 93, 85, 80, 31.3500, 121.5000],
  ['driver3', hash('123456'), 'driver', '赵志远', '13922223333', 'zhao@driver.com', null, '浙B11223', '330789198808081234', 'YS-2024-003', '重型集装箱半挂车', '["40GP","40HQ","45HQ"]', 90, 60, 55, 30.8700, 121.8900],
  ['driver4', hash('123456'), 'driver', '孙海涛', '13922224444', 'sun@driver.com', null, '沪C44556', '310234199503031234', 'YS-2024-004', '重型集装箱半挂车', '["20GP","40GP","40HQ"]', 88, 45, 40, 31.0500, 121.7300],
  // 货代
  ['forwarder1', hash('123456'), 'forwarder', '周鑫', '13733331111', 'zhou@freight.com', '上海鑫达国际货运代理有限公司', null, null, null, null, null, 94, 50, 45, 31.2304, 121.4737],
];

const insertUserTx = db.transaction(() => {
  for (const u of users) insertUser.run(...u);
});
insertUserTx();
console.log('✅ 用户数据创建完成');

// ============================================
// 2. 创建示例订单
// ============================================
const insertOrder = db.prepare(`
  INSERT OR IGNORE INTO orders (order_no, shipper_id, driver_id, status, cargo_type, container_type,
    container_no, seal_no, bill_of_lading, weight, origin_address, origin_lat, origin_lng,
    destination_address, destination_lat, destination_lng, port_name,
    pickup_time, delivery_deadline, estimated_price, final_price, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const orders = [
  ['ZH20240301001', 2, 5, 'completed', '电子产品', '40HQ', 'CSLU2345678', 'SL001234', 'SHSE24030101', 18.5,
   '上海市松江区九亭镇涞亭南路88号', 31.1050, 121.3200, '上海洋山深水港一期码头', 30.6302, 122.0658,
   '上海洋山港', '2024-03-01 08:00', '2024-03-01 18:00', 1800, 1800, '电子产品，轻拿轻放'],
  ['ZH20240301002', 2, 6, 'completed', '机械配件', '20GP', 'MRKU1234567', 'SL002345', 'SHSE24030102', 22.0,
   '上海市嘉定区安亭镇曹安路1000号', 31.3850, 121.2100, '上海外高桥港区四期', 31.3700, 121.5900,
   '上海外高桥港', '2024-03-01 09:00', '2024-03-01 16:00', 950, 950, '机械配件，注意防雨'],
  ['ZH20240302001', 3, 5, 'completed', '纺织品', '40GP', 'EISU3456789', 'SL003456', 'NBSE24030201', 15.0,
   '浙江省杭州市萧山区开发区万向路88号', 30.1800, 120.2600, '宁波舟山港北仑港区', 29.9500, 121.8500,
   '宁波舟山港', '2024-03-02 07:00', '2024-03-02 17:00', 2200, 2200, null],
  ['ZH20240315001', 2, 7, 'in_transit', '化工品', '20GP', 'TCNU4567890', 'SL004567', 'SHSE24031501', 20.0,
   '上海市青浦区华新镇嘉松中路1000号', 31.1500, 121.1800, '上海洋山深水港三期码头', 30.6200, 122.0700,
   '上海洋山港', '2024-03-15 06:00', '2024-03-15 14:00', 1650, null, '化工品，需危险品运输资质'],
  ['ZH20240315002', 4, 8, 'accepted', '汽车零部件', '40HQ', 'HLBU5678901', 'SL005678', 'SHSE24031502', 25.0,
   '苏州市昆山市花桥镇绿地大道288号', 31.3300, 121.0900, '上海外高桥港区二期', 31.3650, 121.5850,
   '上海外高桥港', '2024-03-15 10:00', '2024-03-15 20:00', 1400, null, null],
  // 待接订单（给司机抢单用）
  ['ZH20240316001', 2, null, 'pending', '家具', '40HQ', null, null, 'SHSE24031601', 12.0,
   '上海市奉贤区南桥镇奉浦大道100号', 30.9200, 121.4700, '上海洋山深水港二期码头', 30.6250, 122.0680,
   '上海洋山港', '2024-03-16 08:00', '2024-03-16 18:00', 1550, null, '家具，需注意防磕碰'],
  ['ZH20240316002', 3, null, 'pending', '服装', '20GP', null, null, 'SHSE24031602', 8.0,
   '浙江省嘉兴市海宁市经编园区纬二路', 30.5100, 120.6800, '上海洋山深水港一期码头', 30.6302, 122.0658,
   '上海洋山港', '2024-03-16 09:00', '2024-03-16 17:00', 1900, null, null],
  ['ZH20240316003', 4, null, 'pending', '电子元器件', '40GP', null, null, 'SHSE24031603', 16.0,
   '苏州市吴中区胥口镇孙武路100号', 31.2200, 120.5600, '上海外高桥港区三期', 31.3680, 121.5880,
   '上海外高桥港', '2024-03-16 07:00', '2024-03-16 15:00', 1350, null, '精密电子元件，轻拿轻放'],
  ['ZH20240316004', 2, null, 'pending', '食品', '20RF', null, null, 'SHSE24031604', 18.0,
   '上海市浦东新区川沙镇城南路200号', 31.1900, 121.6900, '上海洋山深水港二期码头', 30.6250, 122.0680,
   '上海洋山港', '2024-03-16 06:00', '2024-03-16 12:00', 2100, null, '冷藏食品，需冷藏集装箱'],
  ['ZH20240316005', 3, null, 'pending', '五金制品', '40GP', null, null, 'NBSE24031605', 21.0,
   '浙江省温州市瓯海区娄桥工业园', 28.0000, 120.6500, '宁波舟山港梅山港区', 29.9100, 121.9000,
   '宁波舟山港', '2024-03-16 08:00', '2024-03-16 20:00', 2800, null, null],
];

const insertOrderTx = db.transaction(() => {
  for (const o of orders) insertOrder.run(...o);
});
insertOrderTx();
console.log('✅ 订单数据创建完成');

// ============================================
// 3. 创建港口动态数据
// ============================================
const insertDynamic = db.prepare(`
  INSERT INTO port_dynamics (port_name, gate_name, category, title, content,
    congestion_index, estimated_wait_minutes, ship_name, ship_eta, ship_etd, source)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const portDynamics = [
  // 闸口拥堵
  ['上海洋山港', '一号闸口', 'congestion', '一号闸口拥堵指数', '当前一号闸口车辆排队较多，预计等待时间45分钟', 7.2, 45, null, null, null, '港区实时监控'],
  ['上海洋山港', '二号闸口', 'congestion', '二号闸口拥堵指数', '二号闸口通行顺畅，建议从此闸口进港', 3.1, 15, null, null, null, '港区实时监控'],
  ['上海洋山港', '三号闸口', 'congestion', '三号闸口拥堵指数', '三号闸口中度拥堵', 5.5, 30, null, null, null, '港区实时监控'],
  ['上海外高桥港', '北闸口', 'congestion', '北闸口拥堵指数', '北闸口通行正常', 2.8, 12, null, null, null, '港区实时监控'],
  ['上海外高桥港', '南闸口', 'congestion', '南闸口拥堵指数', '南闸口高峰期拥堵', 6.8, 40, null, null, null, '港区实时监控'],
  ['宁波舟山港', '主闸口', 'congestion', '主闸口拥堵指数', '主闸口通行基本正常', 4.0, 20, null, null, null, '港区实时监控'],
  // 船舶动态
  ['上海洋山港', null, 'berth', 'COSCO SHIPPING ARIES 靠泊', 'COSCO SHIPPING ARIES号已靠泊洋山港一期3号泊位', null, null, 'COSCO SHIPPING ARIES', '2024-03-15 14:00', '2024-03-17 08:00', '船代信息'],
  ['上海洋山港', null, 'berth', 'EVER GOLDEN 预计靠泊', 'EVER GOLDEN号预计明日抵达洋山港', null, null, 'EVER GOLDEN', '2024-03-16 10:00', '2024-03-18 06:00', '船代信息'],
  ['上海外高桥港', null, 'berth', 'MSC GULSUN 作业中', 'MSC GULSUN号正在外高桥四期进行装卸作业', null, null, 'MSC GULSUN', '2024-03-14 20:00', '2024-03-16 12:00', '船代信息'],
  ['宁波舟山港', null, 'berth', 'ONE MINATO 靠泊', 'ONE MINATO号已靠泊北仑港区', null, null, 'ONE MINATO', '2024-03-15 06:00', '2024-03-16 22:00', '船代信息'],
  // 堆场作业
  ['上海洋山港', null, 'yard', '洋山一期堆场作业通知', '洋山一期A区堆场今日7:00-19:00开放提还箱作业，B区堆场因设备检修暂停作业至14:00', null, null, null, null, null, '码头通知'],
  ['上海外高桥港', null, 'yard', '外高桥四期堆场通告', '外高桥四期南区堆场因场地改造，3月15-20日暂停对外服务，请提前安排', null, null, null, null, null, '码头通知'],
  // 限行通知
  ['上海洋山港', null, 'restriction', '东海大桥集卡限行通知', '3月16日凌晨2:00-5:00东海大桥进行桥面养护，期间禁止集装箱卡车通行', null, null, null, null, null, '交通管理部门'],
  ['上海外高桥港', null, 'restriction', '外高桥周边道路施工', '杨高北路（港城路-五洲大道段）3月15日起半幅施工，请集卡司机注意绕行', null, null, null, null, null, '交通管理部门'],
  // 公告
  ['上海洋山港', null, 'notice', '洋山港提箱时间调整', '自3月18日起，洋山港提箱受理时间调整为每日06:00-22:00，请各单位知悉', null, null, null, null, null, '港区管理方'],
  ['宁波舟山港', null, 'notice', '梅山港区进港预约系统上线', '梅山港区集卡进港预约系统已上线，请司机通过APP提前预约进港时段', null, null, null, null, null, '港区管理方'],
];

const insertDynamicTx = db.transaction(() => {
  for (const d of portDynamics) insertDynamic.run(...d);
});
insertDynamicTx();
console.log('✅ 港口动态数据创建完成');

// ============================================
// 4. 创建空箱动态数据
// ============================================
const insertContainer = db.prepare(`
  INSERT INTO empty_containers (container_type, shipping_company, yard_name, yard_address,
    yard_lat, yard_lng, quantity, available_from, available_until, action_type, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const emptyContainers = [
  ['20GP', '中远海运(COSCO)', '洋山港一期堆场', '上海市浦东新区东海大桥洋山港', 30.6302, 122.0658, 85, '2024-03-15', '2024-03-20', 'both', '状态良好'],
  ['40GP', '中远海运(COSCO)', '洋山港一期堆场', '上海市浦东新区东海大桥洋山港', 30.6302, 122.0658, 60, '2024-03-15', '2024-03-20', 'both', null],
  ['40HQ', '长荣海运(EVERGREEN)', '洋山港二期堆场', '上海市浦东新区东海大桥洋山港', 30.6250, 122.0680, 45, '2024-03-15', '2024-03-18', 'pickup', '仅提箱'],
  ['20GP', '马士基(MAERSK)', '外高桥港区堆场', '上海市浦东新区外高桥保税区', 31.3700, 121.5900, 120, '2024-03-14', '2024-03-22', 'both', null],
  ['40GP', '马士基(MAERSK)', '外高桥港区堆场', '上海市浦东新区外高桥保税区', 31.3700, 121.5900, 75, '2024-03-14', '2024-03-22', 'both', null],
  ['40HQ', '地中海航运(MSC)', '外高桥四期堆场', '上海市浦东新区外高桥港区', 31.3650, 121.5850, 35, '2024-03-15', '2024-03-19', 'return', '仅还箱'],
  ['20GP', '达飞轮船(CMA CGM)', '太仓港堆场', '江苏省太仓市港区路', 31.6100, 121.1000, 50, '2024-03-15', '2024-03-25', 'both', null],
  ['40GP', '中远海运(COSCO)', '宁波北仑堆场', '浙江省宁波市北仑区', 29.9500, 121.8500, 90, '2024-03-14', '2024-03-21', 'both', null],
  ['40HQ', '阳明海运(YML)', '芦潮港集装箱堆场', '上海市浦东新区芦潮港', 30.8600, 121.8500, 40, '2024-03-15', '2024-03-20', 'both', '靠近东海大桥入口'],
  ['20RF', '中远海运(COSCO)', '洋山港冷藏箱堆场', '上海市浦东新区洋山港', 30.6280, 122.0650, 15, '2024-03-15', '2024-03-18', 'pickup', '冷藏集装箱'],
];

const insertContainerTx = db.transaction(() => {
  for (const c of emptyContainers) insertContainer.run(...c);
});
insertContainerTx();
console.log('✅ 空箱动态数据创建完成');

// ============================================
// 5. 创建模拟轨迹数据（为运输中的订单）
// ============================================
const insertTracking = db.prepare(`
  INSERT INTO tracking_records (order_id, driver_id, latitude, longitude, speed, heading, status_note, recorded_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// 为订单4（运输中）创建轨迹
const now = Date.now();
const trackingData = [];
const startLat = 31.1500, startLng = 121.1800;
const endLat = 30.6200, endLng = 122.0700;
for (let i = 0; i <= 15; i++) {
  const ratio = i / 15;
  const lat = startLat + (endLat - startLat) * ratio + (Math.random() - 0.5) * 0.003;
  const lng = startLng + (endLng - startLng) * ratio + (Math.random() - 0.5) * 0.003;
  const speed = 35 + Math.random() * 45;
  const time = new Date(now - (15 - i) * 20 * 60 * 1000).toISOString();
  let note = null;
  if (i === 0) note = '从青浦工厂出发';
  if (i === 5) note = '经过S32高速入口';
  if (i === 10) note = '通过东海大桥收费站';
  if (i === 15) note = '即将到达洋山港';
  trackingData.push([4, 7, lat, lng, speed, 160 + Math.random() * 20, note, time]);
}

const insertTrackingTx = db.transaction(() => {
  for (const t of trackingData) insertTracking.run(...t);
});
insertTrackingTx();
console.log('✅ 轨迹追踪数据创建完成');

// ============================================
// 6. 创建评价数据
// ============================================
const insertRating = db.prepare(`
  INSERT INTO ratings (order_id, rater_id, rated_id, rater_role, score, punctuality, service, communication, comment)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const ratingsData = [
  [1, 2, 5, 'shipper', 5, 5, 5, 5, '陈师傅非常靠谱，准时提货准时到港，货物毫发无损！'],
  [1, 5, 2, 'driver', 5, 5, 5, 5, '张总公司装货效率高，单据齐全，配合度很好。'],
  [2, 2, 6, 'shipper', 4, 4, 5, 4, '刘师傅服务态度好，运输过程顺利，好评！'],
  [2, 6, 2, 'driver', 5, 5, 4, 5, '货物信息清晰，装货点交通方便。'],
  [3, 3, 5, 'shipper', 5, 5, 5, 4, '跨省运输也能准时到达，非常专业！'],
];

const insertRatingTx = db.transaction(() => {
  for (const r of ratingsData) insertRating.run(...r);
});
insertRatingTx();
console.log('✅ 评价数据创建完成');

// ============================================
// 7. 创建通知数据
// ============================================
const insertNotification = db.prepare(`
  INSERT INTO notifications (user_id, type, title, content, is_read, related_id)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const notifications = [
  [2, 'system', '欢迎使用智航云连', '感谢您注册智航云连平台！我们致力于打造港航集疏运数字服务平台。', 1, null],
  [2, 'order', '订单已完成', '您的订单 ZH20240301001 已完成运输，请对司机进行评价。', 1, 1],
  [2, 'port', '港区拥堵预警', '洋山港一号闸口当前拥堵严重，预计等待45分钟，建议选择二号闸口。', 0, null],
  [5, 'system', '欢迎使用智航云连', '感谢您注册智航云连！开始接单，开启高效运输之旅。', 1, null],
  [5, 'payment', '运费到账通知', '订单 ZH20240301001 的运费 ¥1710.00 已到账，请查看结算中心。', 0, 1],
  [5, 'port', '东海大桥限行通知', '3月16日凌晨2:00-5:00东海大桥进行桥面养护，禁止集卡通行。', 0, null],
];

const insertNotifTx = db.transaction(() => {
  for (const n of notifications) insertNotification.run(...n);
});
insertNotifTx();
console.log('✅ 通知数据创建完成');

// ============================================
// 8. 创建结算数据
// ============================================
const insertSettlement = db.prepare(`
  INSERT INTO settlements (order_id, driver_id, shipper_id, amount, platform_fee, driver_amount, status, payment_method, paid_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const settlements = [
  [1, 5, 2, 1800, 90, 1710, 'completed', '银行转账', '2024-03-02 10:00:00'],
  [2, 6, 2, 950, 47.5, 902.5, 'completed', '银行转账', '2024-03-02 14:00:00'],
  [3, 5, 3, 2200, 110, 2090, 'completed', '银行转账', '2024-03-03 11:00:00'],
];

const insertSettlementTx = db.transaction(() => {
  for (const s of settlements) insertSettlement.run(...s);
});
insertSettlementTx();
console.log('✅ 结算数据创建完成');

console.log('\n🎉 所有种子数据填充完成！');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 测试账号信息：');
console.log('  管理员: admin / 123456');
console.log('  货　主: shipper1 / 123456');
console.log('  司　机: driver1 / 123456');
console.log('  货　代: forwarder1 / 123456');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
