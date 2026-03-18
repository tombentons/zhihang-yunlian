const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'zhihang.db');
const db = new Database(dbPath);

// 开启WAL模式提升并发性能
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    -- ============================================
    -- 用户表：支持货主、司机、货代、管理员四种角色
    -- ============================================
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('shipper','driver','forwarder','admin')),
      real_name TEXT,
      phone TEXT,
      email TEXT,
      company_name TEXT,
      -- 司机专属字段
      license_plate TEXT,
      driver_license TEXT,
      transport_license TEXT,
      vehicle_type TEXT,
      container_types TEXT,
      current_lat REAL,
      current_lng REAL,
      -- 通用字段
      credit_score REAL DEFAULT 100.0,
      total_orders INTEGER DEFAULT 0,
      completed_orders INTEGER DEFAULT 0,
      avatar TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','suspended','pending_review')),
      verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ============================================
    -- 运输订单表：核心业务表
    -- ============================================
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      shipper_id INTEGER NOT NULL,
      driver_id INTEGER,
      forwarder_id INTEGER,
      status TEXT DEFAULT 'pending' CHECK(status IN (
        'pending','matching','matched','accepted',
        'pickup','in_transit','at_port','completed',
        'cancelled','disputed'
      )),
      -- 货物信息
      cargo_type TEXT,
      container_type TEXT CHECK(container_type IN ('20GP','40GP','40HQ','45HQ','20RF','40RF')),
      container_no TEXT,
      seal_no TEXT,
      bill_of_lading TEXT,
      weight REAL,
      -- 运输路线
      origin_address TEXT NOT NULL,
      origin_lat REAL,
      origin_lng REAL,
      destination_address TEXT NOT NULL,
      destination_lat REAL,
      destination_lng REAL,
      port_name TEXT,
      -- 时间
      pickup_time DATETIME,
      delivery_deadline DATETIME,
      actual_pickup_time DATETIME,
      actual_delivery_time DATETIME,
      -- 费用
      estimated_price REAL,
      final_price REAL,
      platform_fee REAL,
      -- 备注
      notes TEXT,
      special_requirements TEXT,
      -- 评价
      shipper_rated INTEGER DEFAULT 0,
      driver_rated INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shipper_id) REFERENCES users(id),
      FOREIGN KEY (driver_id) REFERENCES users(id),
      FOREIGN KEY (forwarder_id) REFERENCES users(id)
    );

    -- ============================================
    -- 港口动态表：闸口拥堵、堆场作业、船舶动态等
    -- ============================================
    CREATE TABLE IF NOT EXISTS port_dynamics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      port_name TEXT NOT NULL,
      gate_name TEXT,
      category TEXT CHECK(category IN ('congestion','berth','yard','restriction','notice')),
      title TEXT NOT NULL,
      content TEXT,
      congestion_index REAL,
      estimated_wait_minutes INTEGER,
      ship_name TEXT,
      ship_eta DATETIME,
      ship_etd DATETIME,
      status TEXT DEFAULT 'active',
      source TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ============================================
    -- 车辆轨迹追踪表
    -- ============================================
    CREATE TABLE IF NOT EXISTS tracking_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      driver_id INTEGER NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      speed REAL,
      heading REAL,
      status_note TEXT,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (driver_id) REFERENCES users(id)
    );

    -- ============================================
    -- 空箱动态表：空箱流转调度
    -- ============================================
    CREATE TABLE IF NOT EXISTS empty_containers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      container_type TEXT NOT NULL,
      shipping_company TEXT,
      yard_name TEXT NOT NULL,
      yard_address TEXT,
      yard_lat REAL,
      yard_lng REAL,
      quantity INTEGER DEFAULT 1,
      available_from DATETIME,
      available_until DATETIME,
      action_type TEXT CHECK(action_type IN ('pickup','return','both')),
      status TEXT DEFAULT 'available' CHECK(status IN ('available','reserved','unavailable')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ============================================
    -- 评价表：双向评价体系
    -- ============================================
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      rater_id INTEGER NOT NULL,
      rated_id INTEGER NOT NULL,
      rater_role TEXT NOT NULL,
      score INTEGER NOT NULL CHECK(score >= 1 AND score <= 5),
      punctuality INTEGER CHECK(punctuality >= 1 AND punctuality <= 5),
      service INTEGER CHECK(service >= 1 AND service <= 5),
      communication INTEGER CHECK(communication >= 1 AND communication <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (rater_id) REFERENCES users(id),
      FOREIGN KEY (rated_id) REFERENCES users(id)
    );

    -- ============================================
    -- 智能拼单推荐表
    -- ============================================
    CREATE TABLE IF NOT EXISTS consolidation_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER,
      order_ids TEXT NOT NULL,
      route_description TEXT,
      estimated_savings REAL,
      total_distance REAL,
      empty_reduction_km REAL,
      plan_type TEXT CHECK(plan_type IN ('double_load','return_cargo','nearby_return')),
      status TEXT DEFAULT 'suggested' CHECK(status IN ('suggested','accepted','rejected','completed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (driver_id) REFERENCES users(id)
    );

    -- ============================================
    -- 通知消息表
    -- ============================================
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT CHECK(type IN ('order','system','port','payment','warning')),
      title TEXT NOT NULL,
      content TEXT,
      is_read INTEGER DEFAULT 0,
      related_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- ============================================
    -- 运费结算表
    -- ============================================
    CREATE TABLE IF NOT EXISTS settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      driver_id INTEGER NOT NULL,
      shipper_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      platform_fee REAL DEFAULT 0,
      driver_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','processing','completed','failed')),
      payment_method TEXT,
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (driver_id) REFERENCES users(id),
      FOREIGN KEY (shipper_id) REFERENCES users(id)
    );

    -- 创建索引以提升查询性能
    CREATE INDEX IF NOT EXISTS idx_orders_shipper ON orders(shipper_id);
    CREATE INDEX IF NOT EXISTS idx_orders_driver ON orders(driver_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_tracking_order ON tracking_records(order_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_port_dynamics_port ON port_dynamics(port_name);
    CREATE INDEX IF NOT EXISTS idx_empty_containers_type ON empty_containers(container_type);
  `);

  console.log('✅ 数据库初始化完成');
}

module.exports = { db, initDatabase };
