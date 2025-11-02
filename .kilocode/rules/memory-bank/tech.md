# CrazyParking 技术文档

## 技术栈

### 核心技术
- **游戏引擎**: Cocos Creator 3.8.6
- **编程语言**: TypeScript
- **目标平台**: 微信小游戏
- **云服务**: 微信云开发

### 开发工具
- **IDE**: Cocos Creator 3.8.6
- **调试工具**: 微信开发者工具
- **版本控制**: Git
- **包管理**: npm (通过 Cocos Creator 集成)

## 项目配置

### TypeScript 配置
```json
{
  "compilerOptions": {
    "strict": false
  }
}
```

### 项目结构
```
d:/MyProjects/CrazyParking/
├── assets/
│   ├── CoCoPark/           # 游戏核心资源分包
│   │   ├── GameScripts/    # 游戏逻辑脚本
│   │   ├── Scenes/         # 游戏场景
│   │   ├── Sounds/         # 音频资源
│   │   ├── UIAnims/        # UI动画
│   │   ├── UIPrefabs/      # UI预制体
│   │   └── UITextures/     # UI纹理
│   ├── Scripts/            # 全局脚本
│   └── Loading.scene       # 加载场景
├── cloudfunctions/         # 微信云函数
│   ├── saveGameData/
│   ├── loadGameData/
│   └── clearGameData/
├── .kilocode/            # Kilo Code 配置
└── settings/             # 项目设置
```

## 关键技术实现

### 1. 分包加载策略
- **分包名称**: CoCoPark
- **加载时机**: Loading 场景启动时
- **实现方式**: 
```typescript
assetManager.loadBundle("CoCoPark", async (err, bundle) => {
    // 分包加载完成后的处理
});
```

### 2. 存档系统架构
- **双重备份**: 云存储 + 本地存储
- **容错机制**: 自动降级到本地存储
- **数据格式**: JSON
- **存储键名**: 'crazy_parking_save'

### 3. 汽车移动系统
- **状态机**: 使用枚举定义移动状态
- **策略模式**: 不同方向汽车的位置策略
- **联动机制**: 同方向汽车的连锁移动
- **动画系统**: Cocos Creator Tween 动画

### 4. UI 管理系统
- **界面切换**: 基于节点 active 状态
- **动画控制**: Cocos Creator Animation 组件
- **事件处理**: 组件间方法调用

## 微信小游戏集成

### 1. 分享功能
```typescript
wx.shareAppMessage({
    title: "一起玩吧！",
    imageUrl: "",
    query: "inviter=cocoPark"
});
```

### 2. 云函数调用
```typescript
wx.cloud.callFunction({
    name: 'saveGameData',
    data: {
        key: this.SAVE_KEY,
        data: saveData
    }
});
```

### 3. 本地存储
```typescript
wx.setStorageSync(this.SAVE_KEY, dataStr);
wx.getStorageSync(this.SAVE_KEY);
```

## 性能优化策略

### 1. 资源管理
- **分包加载**: 减少主包体积
- **动态加载**: 按需加载关卡资源
- **对象池**: 复用汽车对象

### 2. 渲染优化
- **批处理**: 合并相似渲染调用
- **裁剪**: 只渲染可见区域
- **动画优化**: 使用硬件加速

### 3. 内存管理
- **及时释放**: 清理不用的资源
- **引用管理**: 避免循环引用
- **监控**: 内存使用情况跟踪

## 开发工作流

### 1. 开发环境设置
1. 安装 Cocos Creator 3.8.6
2. 克隆项目到本地
3. 在 Cocos Creator 中打开项目
4. 配置微信开发者工具路径

### 2. 构建流程
1. 在 Cocos Creator 中选择"构建发布"
2. 选择平台为"微信小游戏"
3. 配置构建参数
4. 点击构建
5. 在微信开发者工具中预览

### 3. 调试流程
1. 在 Cocos Creator 中运行预览
2. 查看浏览器控制台日志
3. 在微信开发者工具中调试
4. 使用远程调试功能

## 代码规范

### 1. TypeScript 规范
- 使用 TypeScript 进行类型检查
- 严格模式关闭（兼容旧代码）
- 使用 ES6+ 语法特性

### 2. 命名规范
- **类名**: PascalCase (GameManager)
- **方法名**: camelCase (handleCarClick)
- **变量名**: camelCase (currentLevel)
- **常量**: UPPER_SNAKE_CASE (MAX_LEVEL)

### 3. 文件组织
- 每个类一个文件
- 文件名与类名保持一致
- 使用相对路径导入

## 测试策略

### 1. 单元测试
- SaveTest.ts: 存档功能测试
- 手动测试方法: manualTest()

### 2. 集成测试
- 游戏流程测试
- 存档同步测试
- UI 交互测试

### 3. 平台测试
- 微信开发者工具测试
- 真机测试
- 不同机型适配测试

## 部署配置

### 1. 微信小游戏配置
- **AppID**: 需要在微信公众平台申请
- **项目设置**: 在 project.json 中配置
- **权限配置**: 云存储、分享等权限

### 2. 云函数部署
- 在微信开发者工具中上传云函数
- 配置云环境
- 设置数据库权限

### 3. 版本管理
- 使用 Git 进行版本控制
- 标记重要版本节点
- 维护更新日志

## 常见问题解决

### 1. 分包加载失败
- 检查网络连接
- 确认分包名称正确
- 查看控制台错误信息

### 2. 存档保存失败
- 检查云函数部署状态
- 确认云环境配置
- 查看网络请求状态

### 3. 动画播放异常
- 检查动画组件配置
- 确认动画文件存在
- 验证动画名称正确

## 扩展指南

### 1. 添加新关卡
1. 在 Map/ 目录下创建新文件
2. 实现 MapW、MapH、Map 和 CarData
3. 在 MapData.ts 中注册新关卡
4. 更新 getTotalLevels() 方法

### 2. 添加新功能
1. 创建对应的 Manager 类
2. 在 GameManager 中集成
3. 添加必要的 UI 界面
4. 更新存档数据结构

### 3. 平台适配
1. 抽象平台相关代码
2. 使用条件编译处理差异
3. 创建平台特定的适配器
4. 测试各平台兼容性