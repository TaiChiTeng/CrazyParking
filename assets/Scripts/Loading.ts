import { _decorator, AssetManager, assetManager, Component, director, ProgressBar, sys } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Loading')
export class Loading extends Component {

    @property(ProgressBar)
    loadingProgress : ProgressBar = null;

    @property
    loadTime: number = 1.0;

    async start() {
        this.loadingProgress.progress = 0.0;
        
        // 先加载分包
        assetManager.loadBundle("CoCoPark", async (err, bundle : AssetManager.Bundle) => {
            if (err) {
                console.error('加载CoCoPark分包失败:', err);
                return;
            }
            
            this.loadingProgress.progress = 0.5;
            
            // 分包加载完成后，初始化存档管理器
            await this.initSaveManager();
            
            this.loadingProgress.progress = 1.0;
            
            // 最后加载游戏场景
            bundle.loadScene("ParkingGame", (err, scene) => {
                if (err) {
                    console.error('加载ParkingGame场景失败:', err);
                    return;
                }
                director.runScene(scene);
            });
        });
        if (sys.platform == "WECHAT_GAME") {
            wx.showShareMenu({menus: ['shareAppMessage', 'shareTimeline']});
            wx.onShareAppMessage(function () {
                return {
                    title: "一起玩吧！"
                };
            });
            wx.onShareTimeline(function () {
                return {
                    title: "一起玩吧！"
                };
            });
        }
    }

    /**
     * 初始化存档管理器
     */
    private async initSaveManager(): Promise<void> {
        try {
            console.log('Loading: 开始初始化存档管理器...');
            
            // 动态导入分包中的SaveManager
            const { SaveManager } = await import('../CoCoPark/GameScripts/SaveManager');
            
            const saveManager = SaveManager.getInstance();
            if (saveManager) {
                // 初始化存档管理器，检查云存储可用性
                await saveManager.init();
                console.log('Loading: 存档管理器初始化完成');
            } else {
                console.warn('Loading: SaveManager获取失败');
            }
        } catch (error) {
            console.error('Loading: 存档管理器初始化失败:', error);
            // 即使初始化失败也继续游戏，使用默认设置
        }
    }

    update(deltaTime: number) {
        this.loadingProgress.progress = Math.min(1, this.loadingProgress.progress + deltaTime / this.loadTime);
    }
}