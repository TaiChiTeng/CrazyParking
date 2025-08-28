import { _decorator, Component, Node } from 'cc';
import { UIManager } from './UIManager';
import { CarManager } from './CarManager';
import { MapManager } from './MapManager';
import { CarAudio } from './CarAudio';
import { SaveManager } from './SaveManager';

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    @property(Node)
    public uiManagerNode: Node = null; // UIManager所在节点

    @property(Node)
    public carManagerNode: Node = null; // CarManager所在节点

    @property(Node)
    public mapManagerNode: Node = null; // MapManager所在节点

    @property(Node)
    public audioManagerNode: Node = null; // AudioManager所在节点

    private uiManager: UIManager = null;
    private carManager: CarManager = null;
    private mapManager: MapManager = null;
    private saveManager: SaveManager = null;
    private currentLevel: number = 1; // 当前关卡
    private isLoadingSave: boolean = false; // 是否正在加载存档

    async start() {
        // 获取各管理器引用
        this.initManagers();

        // 初始化存档管理器
        this.initSaveManager();

        // 初始化时只显示主菜单
        this.uiManager?.showMainMenuOnly();
    }

    // 初始化各管理器引用
    private initManagers() {
        if (this.uiManagerNode) {
            this.uiManager = this.uiManagerNode.getComponent(UIManager);
            if (!this.uiManager) {
                console.error('Cannot find UIManager component on uiManagerNode');
            }
        } else {
            console.error('uiManagerNode is not assigned in GameManager');
        }

        if (this.carManagerNode) {
            this.carManager = this.carManagerNode.getComponent(CarManager);
            if (!this.carManager) {
                console.error('Cannot find CarManager component on carManagerNode');
            }
        } else {
            console.error('carManagerNode is not assigned in GameManager');
        }

        if (this.mapManagerNode) {
            this.mapManager = this.mapManagerNode.getComponent(MapManager);
            if (!this.mapManager) {
                console.error('Cannot find MapManager component on mapManagerNode');
            }
        } else {
            console.error('mapManagerNode is not assigned in GameManager');
        }

        // 设置CarManager的UIManager引用
        if (this.carManager && this.uiManager) {
            this.carManager.uiManager = this.uiManager;
            console.log('CarManager的UIManager引用已设置');
        } else {
            console.error('无法设置CarManager的UIManager引用：carManager或uiManager为null');
        }
    }

    // 初始化存档管理器
    private initSaveManager() {
        this.saveManager = SaveManager.getInstance();
        if (!this.saveManager) {
            console.error('SaveManager初始化失败');
        } else {
            console.log('SaveManager初始化成功');
        }
    }

    // 设置当前关卡
    public setCurrentLevel(level: number): void {
        // 使用SaveManager验证关卡（支持10关循环）
        const validLevel = this.saveManager?.validateLevel ? 
            this.saveManager.validateLevel(level) : 
            Math.max(1, Math.min(level, 10));
            
        this.currentLevel = validLevel;
        console.log(`Current level set to: ${validLevel}`);

        // 更新关卡文本（显示为10关系统）
        const maxLevel = this.saveManager?.getMaxLevel() || 10;
        this.uiManager?.updateLevelLabel(validLevel, maxLevel);

        // 当关卡改变时，重新创建地图
        this.mapManager?.setCurrentLevel(validLevel);

        // 初始化汽车
        this.carManager?.initCars(validLevel);
    }



    // 主菜单按钮回调函数
    public async onMainMenuToLevelClick(): Promise<void> {
        if (this.isLoadingSave) {
            console.log('正在加载存档，请稍候...');
            return;
        }

        this.isLoadingSave = true;
        try {
            // 从存档读取当前关卡
            const savedLevel = await this.saveManager?.loadCurrentLevel() || 1;
            console.log(`从存档读取到关卡: ${savedLevel}`);
            
            // 设置当前关卡
            this.setCurrentLevel(savedLevel);
            this.uiManager?.showLevelOnly();
        } catch (error) {
            console.error('读取存档失败，使用默认关卡:', error);
            this.setCurrentLevel(1);
            this.uiManager?.showLevelOnly();
        } finally {
            this.isLoadingSave = false;
        }
    }

    // 主菜单打开设置界面，不关闭主菜单
    public onMainMenuToSettingClick(): void {
        // 将主菜单设置按钮事件绑定到UIManager的对应方法
        this.uiManager.onMainMenuToSettingClick();
    }

    // 关卡界面按钮回调函数
    public onLevelToLevelClearClick(): void {
        this.onLevelClear();
    }

    // 关卡界面打开设置界面，不关闭关卡界面
    public onLevelToSettingClick(): void {
        // 将关卡界面设置按钮事件绑定到UIManager的对应方法
        this.uiManager?.onLevelToSettingClick();
    }

    // 通关界面按钮回调函数
    public async onLevelClearToLevelClick(): Promise<void> {
        // 获取下一关（支持10关循环）
        const nextLevel = this.saveManager?.getNextLevel(this.currentLevel) || 1;
        
        // 检查是否完成了所有10关
        const isAllCompleted = this.saveManager?.isAllLevelsCompleted(this.currentLevel) || false;
        
        if (isAllCompleted) {
            console.log('恭喜！已完成所有10关，重新开始第一关');
            // 显示全通关界面
            this.uiManager?.showLevelAllClearOnly();
        }
        
        // 设置下一关卡
        this.setCurrentLevel(nextLevel);
        
        // 保存进度
        await this.saveCurrentProgress();
        
        this.uiManager?.showLevelOnly();
    }

    // 设置界面按钮回调函数
    public onSettingToConfirmClick(): void {
        // 将设置界面确认按钮事件绑定到UIManager的对应方法
        this.uiManager?.onSettingToConfirmClick();
    }

    public onSettingSoundToggle(): void {
        if (this.audioManagerNode) {
            this.audioManagerNode.getComponent(CarAudio).onClickAudio();
        }
    }

    public onSettingClose(): void {
        // 将设置界面关闭按钮事件绑定到UIManager的对应方法
        this.uiManager?.onSettingClose();
    }

    // 二次确认界面按钮回调函数
    public onConfirmToMainMenuClick(): void {
        // 将二次确认界面返回主菜单按钮事件绑定到UIManager的对应方法
        this.uiManager?.onConfirmToMainMenuClick();
    }

    public onConfirmCancelClick(): void {
        // 将二次确认界面取消按钮事件绑定到UIManager的对应方法
        this.uiManager?.onConfirmCancelClick();
    }

    // 关卡完成时调用
    public async onLevelClear(): Promise<void> {
        // 保存当前进度
        await this.saveCurrentProgress();
        
        // 检查是否完成了所有10关
        const isAllCompleted = this.saveManager?.isAllLevelsCompleted(this.currentLevel) || false;
        
        if (isAllCompleted) {
            console.log('恭喜！已完成所有10关');
            // 显示全通关界面
            this.uiManager?.showLevelAllClearOnly();
        } else {
            // 显示通关界面
            this.uiManager?.showLevelClearOnly();
        }
    }

    // 保存当前进度
    private async saveCurrentProgress(): Promise<void> {
        if (!this.saveManager) {
            console.warn('SaveManager未初始化，无法保存进度');
            return;
        }

        try {
            const success = await this.saveManager.saveCurrentLevel(this.currentLevel);
            if (success) {
                console.log(`进度已保存: 关卡 ${this.currentLevel}`);
            } else {
                console.warn('进度保存失败');
            }
        } catch (error) {
            console.error('保存进度时发生错误:', error);
        }
    }

    // 获取当前关卡
    public getCurrentLevel(): number {
        return this.currentLevel;
    }

    // 清除存档数据（调试用）
    public async clearSaveData(): Promise<void> {
        if (this.saveManager) {
            await this.saveManager.clearSaveData();
            console.log('存档数据已清除');
        }
    }

    update(deltaTime: number) {
        // 可以在这里添加需要每帧更新的逻辑
    }
}