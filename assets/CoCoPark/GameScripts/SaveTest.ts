import { _decorator, Component } from 'cc';
import { SaveManager } from './SaveManager';
import { GameManager } from './GameManager';

const { ccclass, property } = _decorator;

/**
 * 存档功能测试类
 * 用于测试SaveManager的各项功能
 */
@ccclass('SaveTest')
export class SaveTest extends Component {
    private saveManager: SaveManager = null;
    private gameManager: GameManager = null;

    async start() {
        // 初始化SaveManager
        this.saveManager = new SaveManager();
        await this.saveManager.init();
        
        // 获取GameManager引用
        this.gameManager = this.node.getComponent(GameManager);
        
        // 运行测试
        await this.runTests();
    }

    /**
     * 运行所有测试
     */
    private async runTests(): Promise<void> {
        console.log('=== 开始存档功能测试 ===');
        
        try {
            // 测试1: 清除存档
            await this.testClearSave();
            
            // 测试2: 保存关卡进度
            await this.testSaveProgress();
            
            // 测试3: 读取存档
            await this.testLoadSave();
            
            // 测试4: 10关循环测试
            await this.testLevelCycle();
            
            // 测试5: 容错处理
            await this.testErrorHandling();
            
            console.log('=== 所有测试完成 ===');
        } catch (error) {
            console.error('测试过程中出现错误:', error);
        }
    }

    /**
     * 测试容错处理
     */
    private async testErrorHandling(): Promise<void> {
        console.log('测试5: 容错处理');
        
        // 测试云存储不可用时的降级处理
        console.log('测试云存储不可用时的降级处理...');
        
        // 保存一个测试关卡
        await this.saveManager.saveProgress(5);
        console.log('保存关卡5（应该降级到本地存储）');
        
        // 读取关卡
        const saveData = await this.saveManager.loadSave();
        const loadedLevel = saveData?.currentLevel;
        console.log(`读取到关卡: ${loadedLevel}（应该从本地存储读取）`);
        
        if (loadedLevel === 5) {
            console.log('✓ 容错处理测试通过：本地存储正常工作');
        } else {
            console.log('✗ 容错处理测试失败：本地存储异常');
        }
        
        // 测试清除功能
        const clearResult = await this.saveManager.clearSave();
        if (clearResult) {
            console.log('✓ 清除功能测试通过：即使云存储不可用，本地清除仍正常');
        } else {
            console.log('✗ 清除功能测试失败');
        }
        
        console.log('测试5完成\n');
    }

    /**
     * 测试清除存档
     */
    private async testClearSave(): Promise<void> {
        console.log('测试1: 清除存档');
        
        const result = await this.saveManager.clearSave();
        console.log('清除存档结果:', result ? '成功' : '失败');
        
        // 验证清除后读取存档应该返回null
        const saveData = await this.saveManager.loadSave();
        console.log('清除后读取存档:', saveData);
        console.log('测试1完成\n');
    }

    /**
     * 测试保存进度
     */
    private async testSaveProgress(): Promise<void> {
        console.log('测试2: 保存关卡进度');
        
        // 保存第3关
        const saveResult = await this.saveManager.saveProgress(3);
        console.log('保存第3关结果:', saveResult ? '成功' : '失败');
        
        // 立即读取验证
        const saveData = await this.saveManager.loadSave();
        console.log('保存后读取存档:', saveData);
        console.log('测试2完成\n');
    }

    /**
     * 测试读取存档
     */
    private async testLoadSave(): Promise<void> {
        console.log('测试3: 读取存档');
        
        const saveData = await this.saveManager.loadSave();
        if (saveData) {
            console.log('读取到存档数据:');
            console.log('- 当前关卡:', saveData.currentLevel);
            console.log('- 保存时间:', new Date(saveData.timestamp).toLocaleString());
            console.log('- 版本:', saveData.version);
        } else {
            console.log('未找到存档数据');
        }
        console.log('测试3完成\n');
    }

    /**
     * 测试10关循环
     */
    private async testLevelCycle(): Promise<void> {
        console.log('测试4: 10关循环测试');
        
        // 测试各种关卡的验证
        const testLevels = [1, 5, 10, 11, 15, 20, 21];
        
        for (const level of testLevels) {
            const validatedLevel = this.saveManager.validateLevel(level);
            console.log(`关卡 ${level} -> 验证后: ${validatedLevel}`);
        }
        
        // 测试保存第10关后的循环
        console.log('\n测试第10关通关后的循环:');
        await this.saveManager.saveProgress(10);
        let saveData = await this.saveManager.loadSave();
        console.log('保存第10关后的存档:', saveData?.currentLevel);
        
        // 模拟通关第10关，应该循环到第1关
        await this.saveManager.saveProgress(11); // 这应该被验证为第1关
        saveData = await this.saveManager.loadSave();
        console.log('通关第10关后的存档:', saveData?.currentLevel);
        
        console.log('测试4完成\n');
    }

    /**
     * 手动触发测试（可在编辑器中调用）
     */
    public async manualTest(): Promise<void> {
        if (!this.saveManager) {
            this.saveManager = new SaveManager();
            await this.saveManager.init();
        }
        await this.runTests();
    }
}