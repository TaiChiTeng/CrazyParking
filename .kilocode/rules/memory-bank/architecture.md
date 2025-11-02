# CrazyParking 系统架构

## 整体架构
CrazyParking 采用分层架构设计，主要分为表现层、逻辑层和数据层。游戏使用 Cocos Creator 3.8.6 引擎开发，采用 TypeScript 语言。

```
┌─────────────────────────────────────────────────────────────┐
│                    表现层 (Presentation Layer)              │
├─────────────────────────────────────────────────────────────┤
│  UI系统 (UIManager)  │  动画系统 (Animation)  │  音频系统 (Audio)  │
├─────────────────────────────────────────────────────────────┤
│                    逻辑层 (Logic Layer)                    │
├─────────────────────────────────────────────────────────────┤
│ GameManager │ CarManager │ MapManager │ SaveManager │ wxManager │
├─────────────────────────────────────────────────────────────┤
│                    数据层 (Data Layer)                     │
├─────────────────────────────────────────────────────────────┤
│  MapData  │  本地存储  │  微信云存储  │  配置数据  │
└─────────────────────────────────────────────────────────────┘
```

## 核心组件架构

### 1. GameManager (游戏主控制器)
- **职责**: 游戏流程控制、组件协调、状态管理
- **关键方法**:
  - `start()`: 初始化游戏
  - `setCurrentLevel()`: 设置当前关卡
  - `onLevelClear()`: 处理通关逻辑
- **依赖关系**: 依赖 UIManager、CarManager、MapManager、SaveManager

### 2. CarManager (汽车管理器)
- **职责**: 汽车创建、移动逻辑、碰撞检测、动画控制
- **设计模式**: 策略模式 (不同方向汽车的位置策略)
- **关键方法**:
  - `initCars()`: 初始化汽车
  - `handleCarClick()`: 处理汽车点击
  - `executeCarMovement()`: 执行汽车移动
- **依赖关系**: 依赖 MapData、UIManager

### 3. SaveManager (存档管理器)
- **职责**: 数据持久化、云存储同步、容错处理
- **设计模式**: 单例模式
- **关键方法**:
  - `saveCurrentLevel()`: 保存当前关卡
  - `loadGameData()`: 读取游戏数据
  - `clearSaveData()`: 清除存档
- **依赖关系**: 依赖微信云函数 API

### 4. UIManager (UI管理器)
- **职责**: 界面切换、动画控制、状态显示
- **关键方法**:
  - `showMainMenuOnly()`: 显示主菜单
  - `showLevelOnly()`: 显示游戏界面
  - `updateLevelLabel()`: 更新关卡显示
- **依赖关系**: 依赖 Animation 组件

### 5. MapManager (地图管理器)
- **职责**: 地图创建、阻挡物管理、关卡数据加载
- **关键方法**:
  - `setCurrentLevel()`: 设置当前关卡
  - `createMap()`: 创建地图
  - `updateMapDisplay()`: 更新地图显示
- **依赖关系**: 依赖 MapData

## 数据流架构

### 游戏初始化流程
```
Loading.ts → SaveManager.init() → GameManager.start() → 
UIManager.showMainMenuOnly() → loadCurrentLevel() → 
MapManager.setCurrentLevel() → CarManager.initCars()
```

### 游戏操作流程
```
用户点击汽车 → CarManager.handleCarClick() → 
calculateCarMovementStatus() → executeCarMovement() → 
updateParkingCount() → checkLevelComplete() → 
GameManager.onLevelClear() → SaveManager.saveCurrentLevel()
```

### 存档数据流
```
GameManager → SaveManager → 微信云函数/本地存储 → 
数据验证 → 同步备份 → 状态更新
```

## 关键设计模式

### 1. 单例模式
- **应用**: SaveManager、AudioMgr
- **目的**: 确保全局唯一实例，统一管理资源

### 2. 策略模式
- **应用**: CarManager 中的汽车位置策略
- **实现**: UpperCarPositionStrategy、LeftCarPositionStrategy、RightCarPositionStrategy
- **目的**: 不同方向汽车的移动逻辑分离

### 3. 观察者模式
- **应用**: UI 事件处理、动画回调
- **目的**: 解耦事件发送者和接收者

## 文件结构组织

### 核心脚本 (`assets/CoCoPark/GameScripts/`)
```
GameManager.ts      # 游戏主控制器
CarManager.ts       # 汽车管理器 (1700+ 行，需重构)
SaveManager.ts     # 存档管理器
UIManager.ts       # UI管理器
MapManager.ts      # 地图管理器
AudioMgr.ts        # 音频管理器
MapData.ts         # 地图数据管理
wxManager.ts       # 微信功能管理
SaveTest.ts        # 存档功能测试
```

### 地图数据 (`assets/CoCoPark/GameScripts/Map/`)
```
lv1.ts - lv10.ts   # 已实现的关卡数据
lv11.ts - lv16.ts  # 预留的关卡数据结构
```

### UI 资源 (`assets/CoCoPark/`)
```
UIPrefabs/         # UI 预制体
UIAnims/           # UI 动画
UITextures/        # UI 纹理
```

## 关键技术决策

### 1. 分包加载
- **决策**: 将游戏核心资源放在 CoCoPark 分包中
- **原因**: 减少主包体积，提高加载速度
- **实现**: Loading 场景负责分包加载

### 2. 存档策略
- **决策**: 云存储 + 本地存储双重备份
- **原因**: 确保数据安全，支持离线游戏
- **实现**: 优先使用云存储，失败时降级到本地存储

### 3. 汽车移动逻辑
- **决策**: 基于状态机的移动系统
- **原因**: 处理复杂的移动状态和联动逻辑
- **实现**: CarMovementStatus 枚举定义各种移动状态

## 性能考虑

### 1. 资源管理
- 使用对象池管理汽车对象
- 动态加载和卸载关卡资源
- 预加载常用资源

### 2. 渲染优化
- 减少不必要的重绘
- 使用批处理渲染相似对象
- 优化动画性能

### 3. 内存管理
- 及时释放不用的资源
- 避免内存泄漏
- 监控内存使用情况

## 扩展性设计

### 1. 关卡扩展
- MapData 类支持动态添加新关卡
- 预留了 lv11-lv16 的数据结构
- 关卡验证机制确保数据完整性

### 2. 功能扩展
- 模块化设计便于添加新功能
- 事件驱动架构支持功能解耦
- 配置化设计支持参数调整

### 3. 平台扩展
- 抽象平台相关代码
- 使用适配器模式处理平台差异
- 预留接口支持其他平台