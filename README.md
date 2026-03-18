# 智航云连 APP - 港航集疏运数字服务平台

> 挑战杯大学生创业计划竞赛项目 | 上海海事大学

## 项目简介

智航云连APP是一个聚焦港航集疏运垂直领域的产业互联网平台，以"去中介化、智能化、可视化"为核心方向，破解当前港航集疏运环节的交易与调度难题，打造中小微企业专属的港航集疏运数字服务平台。

## 核心功能

### 1. 运力直连交易
- **货主发单**：中小微外贸企业一键发布集装箱运输需求
- **司机抢单**：司机在抢单大厅查看并接取订单
- **智能匹配**：基于大数据精准画像，智能匹配货主与司机

### 2. 港区动态与可视化物流追踪
- **闸口拥堵指数**：实时显示各港口闸口的拥堵情况
- **船舶动态**：查看船舶靠泊、离港等信息
- **堆场作业**：堆场开放时间、作业通知
- **物流轨迹追踪**：模拟北斗定位，全程可追溯

### 3. 智能拼单与空箱流转
- **智能拼单**：基于运筹优化算法推荐双重运输/返程配货方案
- **空箱动态**：实时查看各堆场空箱库存
- **智能空箱匹配**：按距离推荐最优提还箱堆场

### 4. 信用与结算体系
- **双向评价**：货主与司机互评，建立信用评级
- **极速结算**：运输完成后即时结算，解决运费拖欠
- **平台服务费**：低比例抽佣，双方获益

### 5. 管理后台
- **数据总览**：用户、订单、收入等核心指标看板
- **用户管理**：司机资质审核（四证合一）、用户状态管理
- **港口动态管理**：发布闸口拥堵、船舶动态等信息

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | React 18 + Vite | 快速构建现代化单页应用 |
| UI样式 | TailwindCSS 3 | 原子化CSS，高效定制UI |
| 图标 | Lucide React | 美观一致的SVG图标库 |
| 路由 | React Router 6 | 前端路由管理 |
| HTTP请求 | Axios | 封装API调用与拦截器 |
| 后端框架 | Express.js | 轻量高效的Node.js框架 |
| 数据库 | SQLite (better-sqlite3) | 轻量级嵌入式数据库 |
| 认证 | JWT (jsonwebtoken) | 无状态的用户认证 |
| 密码加密 | bcryptjs | 安全的密码哈希 |

## 目录结构

```
zhihang-yunlian/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── index.js           # 服务入口
│   │   ├── database.js        # 数据库初始化与表结构
│   │   ├── seed.js            # 种子数据填充
│   │   ├── middleware/
│   │   │   └── auth.js        # JWT认证中间件
│   │   └── routes/
│   │       ├── auth.js        # 用户认证（注册/登录）
│   │       ├── orders.js      # 订单管理
│   │       ├── port.js        # 港口动态
│   │       ├── tracking.js    # 轨迹追踪
│   │       ├── containers.js  # 空箱管理
│   │       ├── consolidation.js # 智能拼单
│   │       ├── ratings.js     # 评价系统
│   │       ├── settlements.js # 运费结算
│   │       ├── notifications.js # 消息通知
│   │       └── admin.js       # 管理后台
│   ├── data/                  # SQLite数据库文件
│   ├── package.json
│   └── .env
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── main.jsx           # 应用入口
│   │   ├── App.jsx            # 路由配置
│   │   ├── api.js             # API封装
│   │   ├── index.css          # 全局样式
│   │   ├── context/
│   │   │   └── AuthContext.jsx # 认证上下文
│   │   ├── components/
│   │   │   └── Layout.jsx     # 全局布局（侧边栏+顶栏）
│   │   └── pages/
│   │       ├── Login.jsx      # 登录页
│   │       ├── Register.jsx   # 注册页（角色选择）
│   │       ├── Dashboard.jsx  # 工作台首页
│   │       ├── OrderCreate.jsx # 发布订单
│   │       ├── OrderList.jsx  # 订单列表
│   │       ├── OrderDetail.jsx # 订单详情
│   │       ├── AvailableOrders.jsx # 抢单大厅（司机）
│   │       ├── PortDynamics.jsx # 港口动态
│   │       ├── EmptyContainers.jsx # 空箱动态
│   │       ├── Consolidation.jsx # 智能拼单（司机）
│   │       ├── Tracking.jsx   # 物流追踪
│   │       ├── Settlements.jsx # 结算中心
│   │       ├── Notifications.jsx # 消息中心
│   │       ├── AdminDashboard.jsx # 管理后台
│   │       └── AdminUsers.jsx # 用户管理
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## 快速启动

### 前置条件
- Node.js >= 18

### 1. 启动后端

```bash
cd backend
npm install          # 安装依赖
npm run seed         # 填充种子数据（首次运行）
npm run dev          # 启动开发服务器（端口3001）
```

### 2. 启动前端

```bash
cd frontend
npm install          # 安装依赖
npm run dev          # 启动开发服务器（端口5173）
```

### 3. 打开浏览器

访问 http://localhost:5173

## 测试账号

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 管理员 | admin | admin123 | 系统管理员，可查看数据总览、审核用户 |
| 货主 | shipper1 | 123456 | 张明华，上海明华进出口贸易有限公司 |
| 司机 | driver1 | 123456 | 陈大勇，沪A12345，经验丰富的集卡司机 |
| 货代 | forwarder1 | 123456 | 周鑫，上海鑫达国际货运代理有限公司 |

## 数据库设计

### 核心数据表（共8张）

1. **users** - 用户表（支持货主/司机/货代/管理员四种角色）
2. **orders** - 运输订单表（核心业务表，包含完整的订单生命周期）
3. **port_dynamics** - 港口动态表（闸口拥堵/船舶动态/堆场作业/限行通知）
4. **tracking_records** - 车辆轨迹追踪表（模拟北斗定位数据）
5. **empty_containers** - 空箱动态表（各堆场空箱库存与提还箱信息）
6. **ratings** - 评价表（双向评价体系）
7. **settlements** - 运费结算表（含平台服务费计算）
8. **notifications** - 消息通知表（订单/系统/港口/支付等类型）
9. **consolidation_plans** - 智能拼单推荐表

## API接口文档

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `PUT /api/auth/profile` - 更新个人信息

### 订单相关
- `POST /api/orders` - 发布运输订单
- `GET /api/orders` - 获取订单列表
- `GET /api/orders/available` - 获取可接订单（司机抢单）
- `GET /api/orders/:id` - 获取订单详情
- `PUT /api/orders/:id/accept` - 司机接单
- `PUT /api/orders/:id/status` - 更新订单状态
- `GET /api/orders/stats/overview` - 订单统计

### 港口动态
- `GET /api/port/dynamics` - 获取港口动态
- `GET /api/port/congestion` - 闸口拥堵指数
- `GET /api/port/ships` - 船舶动态
- `GET /api/port/overview` - 港口总览

### 轨迹追踪
- `POST /api/tracking` - 上报位置
- `GET /api/tracking/:orderId` - 获取轨迹
- `POST /api/tracking/simulate/:orderId` - 生成模拟轨迹

### 空箱管理
- `GET /api/containers/empty` - 查询空箱动态
- `POST /api/containers/match` - 智能空箱匹配

### 智能拼单
- `POST /api/consolidation/smart-match` - 智能拼单推荐

### 评价系统
- `POST /api/ratings` - 提交评价
- `GET /api/ratings/user/:userId` - 获取用户评价

### 结算中心
- `GET /api/settlements` - 结算记录
- `PUT /api/settlements/:id/complete` - 完成结算

### 消息通知
- `GET /api/notifications` - 通知列表
- `PUT /api/notifications/:id/read` - 标记已读
- `PUT /api/notifications/read-all` - 全部已读

### 管理后台
- `GET /api/admin/dashboard` - 数据总览
- `GET /api/admin/users` - 用户列表
- `PUT /api/admin/users/:id/verify` - 审核用户
- `PUT /api/admin/users/:id/status` - 更新用户状态

## 使用流程演示

### 货主流程
1. 注册/登录 → 选择"我是货主"
2. 工作台查看订单概况和港口动态
3. 点击"发布订单" → 填写运输需求
4. 在"我的订单"跟踪订单状态
5. 在"物流追踪"查看实时轨迹
6. 运输完成后评价司机

### 司机流程
1. 注册/登录 → 选择"我是司机"
2. 进入"抢单大厅" → 筛选、接取订单
3. 使用"智能拼单"减少空驶
4. 查看"港口动态"避开拥堵闸口
5. 更新运输状态（提货→运输→到港→完成）
6. 在"结算中心"查看运费到账

## 项目亮点

1. **完整的四端体验**：货主端、司机端、货代端、管理后台
2. **真实的业务场景**：贴合港航集疏运实际流程
3. **智能算法**：拼单优化、空箱匹配、距离排序
4. **丰富的种子数据**：10个用户、10个订单、16条港口动态、10条空箱信息
5. **响应式设计**：支持桌面端和移动端
6. **完整的订单生命周期**：发单→接单→提货→运输→到港→完成→评价→结算
