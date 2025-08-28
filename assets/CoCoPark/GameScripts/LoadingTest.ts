import { _decorator, Component } from 'cc';
import { SaveManager } from './SaveManager';

const { ccclass } = _decorator;

/**
 * 加载流程测试类
 * 用于验证Loading阶段的存档初始化是否正常工作
 */
@ccclass('LoadingTest')
export class LoadingTest extends Component {

    /**
     * 测试加载流程
     */
    public static async testLoadingFlow(): Promise<void> {
        console.log('=== 开始测试加载流程 ===');
        
        try {
            // 测试1: 检查SaveManager是否已初始化
            const saveManager = SaveManager.getInstance();
            if (!saveManager) {
                console.log('✗ 测试失败：SaveManager未初始化');
                return;
            }
            console.log('✓ SaveManager实例获取成功');
            
            // 测试2: 检查云存储可用性状态
            const isCloudAvailable = (saveManager as any).isCloudAvailable;
            console.log(`云存储可用性: ${isCloudAvailable !== undefined ? (isCloudAvailable ? '可用' : '不可用') : '未知'}`);
            
            // 测试3: 测试存档读取
            const currentLevel = await saveManager.loadCurrentLevel();
            console.log(`✓ 存档读取成功，当前关卡: ${currentLevel}`);
            
            // 测试4: 测试存档保存
            const testLevel = 3;
            const saveResult = await saveManager.saveCurrentLevel(testLevel);
            if (saveResult) {
                console.log(`✓ 存档保存成功，测试关卡: ${testLevel}`);
            } else {
                console.log('✗ 存档保存失败');
            }
            
            // 测试5: 验证保存的数据
            const verifyLevel = await saveManager.loadCurrentLevel();
            if (verifyLevel === testLevel) {
                console.log('✓ 存档数据验证成功');
            } else {
                console.log(`✗ 存档数据验证失败，期望: ${testLevel}, 实际: ${verifyLevel}`);
            }
            
            console.log('=== 加载流程测试完成 ===');
            
        } catch (error) {
            console.error('加载流程测试出错:', error);
        }
    }
    
    /**
     * 在游戏启动后运行测试
     */
    start() {
        // 延迟执行测试，确保所有初始化完成
        setTimeout(() => {
            LoadingTest.testLoadingFlow();
        }, 1000);
    }
}