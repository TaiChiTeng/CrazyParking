import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

// 存档数据接口
interface SaveData {
    currentLevel: number;  // 当前关卡
    timestamp: number;     // 存档时间戳
    version: string;       // 存档版本
}

@ccclass('SaveManager')
export class SaveManager extends Component {
    private static instance: SaveManager = null;
    private readonly SAVE_KEY = 'crazy_parking_save';  // 云存储键名
    private readonly SAVE_VERSION = '1.0.0';           // 存档版本
    private readonly MAX_LEVEL = 10;                   // 最大关卡数
    private isCloudAvailable: boolean = false;         // 云存储是否可用
    private cloudCheckTimeout: number = 3000;          // 云存储检查超时时间(毫秒)
    
    // 单例模式
    public static getInstance(): SaveManager {
        if (!SaveManager.instance) {
            SaveManager.instance = new SaveManager();
        }
        return SaveManager.instance;
    }

    onLoad() {
        SaveManager.instance = this;
    }

    /**
     * 初始化SaveManager，检查云存储可用性
     */
    public async init(): Promise<void> {
        console.log('初始化SaveManager...');
        this.isCloudAvailable = await this.checkCloudAvailability();
        console.log(`云存储可用性: ${this.isCloudAvailable ? '可用' : '不可用，将使用本地存储'}`);
    }

    /**
     * 检查云存储是否可用
     */
    private async checkCloudAvailability(): Promise<boolean> {
        try {
            // 检查微信环境
            if (typeof wx === 'undefined' || !wx.cloud) {
                console.log('非微信小游戏环境，使用本地存储');
                return false;
            }

            // 尝试调用云函数检查可用性
            return new Promise<boolean>((resolve) => {
                const timer = setTimeout(() => {
                    console.log('云存储检查超时，使用本地存储');
                    resolve(false);
                }, this.cloudCheckTimeout);

                wx.cloud.callFunction({
                    name: 'loadGameData',
                    data: { key: 'test_connection' },
                    success: () => {
                        clearTimeout(timer);
                        console.log('云存储连接正常');
                        resolve(true);
                    },
                    fail: (err) => {
                        clearTimeout(timer);
                        console.log('云存储连接失败:', err.errMsg || err);
                        resolve(false);
                    }
                });
            });
        } catch (error) {
            console.error('检查云存储可用性时出错:', error);
            return false;
        }
    }

    /**
     * 保存当前关卡到云存储
     * @param level 当前关卡
     */
    public async saveCurrentLevel(level: number): Promise<boolean> {
        try {
            // 确保关卡在有效范围内
            const validLevel = this.validateLevel(level);
            
            const saveData: SaveData = {
                currentLevel: validLevel,
                timestamp: Date.now(),
                version: this.SAVE_VERSION
            };

            console.log(`准备保存关卡数据: ${validLevel}`);

            // 优先使用云存储（如果可用）
            if (this.isCloudAvailable) {
                console.log('使用云存储保存数据');
                return await this.saveToWxCloud(saveData);
            } else {
                console.log('使用本地存储保存数据');
                return this.saveToLocal(saveData);
            }
        } catch (error) {
            console.error('保存关卡失败:', error);
            // 容错：尝试本地存储
            try {
                const saveData: SaveData = {
                    currentLevel: this.validateLevel(level),
                    timestamp: Date.now(),
                    version: this.SAVE_VERSION
                };
                return this.saveToLocal(saveData);
            } catch (localError) {
                console.error('本地存储也失败:', localError);
                return false;
            }
        }
    }

    /**
     * 从云存储读取当前关卡
     * @returns 当前关卡，如果没有存档则返回1
     */
    public async loadCurrentLevel(): Promise<number> {
        try {
            console.log('开始读取存档数据...');

            // 优先使用云存储（如果可用）
            if (this.isCloudAvailable) {
                console.log('尝试从云存储读取数据');
                return await this.loadFromWxCloud();
            } else {
                console.log('从本地存储读取数据');
                return this.loadFromLocal();
            }
        } catch (error) {
            console.error('读取存档失败:', error);
            // 容错：尝试本地存储
            try {
                return this.loadFromLocal();
            } catch (localError) {
                console.error('本地存储读取也失败:', localError);
                return 1; // 默认返回第一关
            }
        }
    }

    /**
     * 保存到微信云存储
     */
    private async saveToWxCloud(saveData: SaveData): Promise<boolean> {
        return new Promise((resolve) => {
            // 设置超时机制
            const timer = setTimeout(() => {
                console.log('云存储保存超时，降级到本地存储');
                this.isCloudAvailable = false; // 标记云存储不可用
                const localResult = this.saveToLocal(saveData);
                resolve(localResult);
            }, this.cloudCheckTimeout);

            try {
                wx.cloud.callFunction({
                    name: 'saveGameData',
                    data: {
                        key: this.SAVE_KEY,
                        data: saveData
                    },
                    success: (res) => {
                        clearTimeout(timer);
                        console.log('云存储保存成功:', res);
                        // 同时保存到本地作为备份
                        this.saveToLocal(saveData);
                        resolve(true);
                    },
                    fail: (err) => {
                        clearTimeout(timer);
                        console.error('云存储保存失败:', err);
                        // 标记云存储不可用并降级到本地存储
                        this.isCloudAvailable = false;
                        const localResult = this.saveToLocal(saveData);
                        resolve(localResult);
                    }
                });
            } catch (error) {
                clearTimeout(timer);
                console.error('调用云函数时出错:', error);
                this.isCloudAvailable = false;
                const localResult = this.saveToLocal(saveData);
                resolve(localResult);
            }
        });
    }

    /**
     * 从微信云存储读取
     */
    private async loadFromWxCloud(): Promise<number> {
        return new Promise((resolve) => {
            // 设置超时机制
            const timer = setTimeout(() => {
                console.log('云存储读取超时，降级到本地存储');
                this.isCloudAvailable = false; // 标记云存储不可用
                const localLevel = this.loadFromLocal();
                resolve(localLevel);
            }, this.cloudCheckTimeout);

            try {
                wx.cloud.callFunction({
                    name: 'loadGameData',
                    data: {
                        key: this.SAVE_KEY
                    },
                    success: (res) => {
                        clearTimeout(timer);
                        console.log('云存储读取成功:', res);
                        if (res.result && res.result.data) {
                            const saveData = res.result.data as SaveData;
                            if (this.validateSaveData(saveData)) {
                                const level = this.validateLevel(saveData.currentLevel);
                                console.log(`从云存储读取到关卡: ${level}`);
                                // 同步到本地存储作为备份
                                this.saveToLocal(saveData);
                                resolve(level);
                                return;
                            }
                        }
                        // 云存储没有数据，尝试本地存储
                        console.log('云存储无有效数据，尝试本地存储');
                        const localLevel = this.loadFromLocal();
                        resolve(localLevel);
                    },
                    fail: (err) => {
                        clearTimeout(timer);
                        console.error('云存储读取失败:', err);
                        // 标记云存储不可用并降级到本地存储
                        this.isCloudAvailable = false;
                        const localLevel = this.loadFromLocal();
                        resolve(localLevel);
                    }
                });
            } catch (error) {
                clearTimeout(timer);
                console.error('调用云函数时出错:', error);
                this.isCloudAvailable = false;
                const localLevel = this.loadFromLocal();
                resolve(localLevel);
            }
        });
    }

    /**
     * 保存到本地存储
     */
    private saveToLocal(saveData: SaveData): boolean {
        try {
            const dataStr = JSON.stringify(saveData);
            if (typeof wx !== 'undefined' && wx.setStorageSync) {
                wx.setStorageSync(this.SAVE_KEY, dataStr);
            } else if (typeof localStorage !== 'undefined') {
                localStorage.setItem(this.SAVE_KEY, dataStr);
            } else {
                console.warn('本地存储不可用');
                return false;
            }
            console.log(`本地存储保存成功: 关卡 ${saveData.currentLevel}`);
            return true;
        } catch (error) {
            console.error('本地存储保存失败:', error);
            return false;
        }
    }

    /**
     * 从本地存储读取
     */
    private loadFromLocal(): number {
        try {
            let dataStr: string = '';
            
            if (typeof wx !== 'undefined' && wx.getStorageSync) {
                dataStr = wx.getStorageSync(this.SAVE_KEY) || '';
            } else if (typeof localStorage !== 'undefined') {
                dataStr = localStorage.getItem(this.SAVE_KEY) || '';
            }

            if (dataStr) {
                const saveData = JSON.parse(dataStr) as SaveData;
                if (this.validateSaveData(saveData)) {
                    const level = this.validateLevel(saveData.currentLevel);
                    console.log(`从本地存储读取到关卡: ${level}`);
                    return level;
                }
            }
        } catch (error) {
            console.error('本地存储读取失败:', error);
        }
        
        console.log('没有找到有效存档，返回第一关');
        return 1;
    }

    /**
     * 验证存档数据
     */
    private validateSaveData(saveData: any): saveData is SaveData {
        return saveData &&
               typeof saveData.currentLevel === 'number' &&
               typeof saveData.timestamp === 'number' &&
               typeof saveData.version === 'string';
    }

    /**
     * 验证并修正关卡数值
     * 支持10关循环：超过10关时重置为1
     */
    public validateLevel(level: number): number {
        if (!Number.isInteger(level) || level < 1) {
            return 1;
        }
        
        // 10关循环逻辑
        if (level > this.MAX_LEVEL) {
            return ((level - 1) % this.MAX_LEVEL) + 1;
        }
        
        return level;
    }

    /**
     * 清除存档数据
     */
    public async clearSaveData(): Promise<boolean> {
        try {
            // 清除本地存储
            const localCleared = this.clearLocalData();
            
            // 如果云存储可用，也清除云存储
            if (this.isCloudAvailable && typeof wx !== 'undefined' && wx.cloud) {
                return new Promise((resolve) => {
                    // 设置超时机制
                    const timer = setTimeout(() => {
                        console.log('云存储清除超时，但本地已清除');
                        resolve(localCleared);
                    }, this.cloudCheckTimeout);

                    try {
                        wx.cloud.callFunction({
                            name: 'clearGameData',
                            data: {
                                key: this.SAVE_KEY
                            },
                            success: (res) => {
                                clearTimeout(timer);
                                console.log('云存储清除成功:', res);
                                resolve(true);
                            },
                            fail: (err) => {
                                clearTimeout(timer);
                                console.error('云存储清除失败:', err);
                                // 即使云存储清除失败，本地已清除，仍返回成功
                                resolve(localCleared);
                            }
                        });
                    } catch (error) {
                        clearTimeout(timer);
                        console.error('调用清除云函数时出错:', error);
                        resolve(localCleared);
                    }
                });
            }
            
            return localCleared;
        } catch (error) {
            console.error('清除存档数据时出错:', error);
            return false;
        }
    }

    /**
     * 清除本地存储数据
     */
    private clearLocalData(): boolean {
        try {
            if (typeof wx !== 'undefined' && wx.removeStorageSync) {
                wx.removeStorageSync(this.SAVE_KEY);
            } else if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(this.SAVE_KEY);
            } else {
                console.warn('本地存储不可用');
                return false;
            }
            console.log('本地存档数据已清除');
            return true;
        } catch (error) {
            console.error('清除本地存档失败:', error);
            return false;
        }
    }

    /**
     * 获取下一关卡（支持10关循环）
     */
    public getNextLevel(currentLevel: number): number {
        return this.validateLevel(currentLevel + 1);
    }

    /**
     * 检查是否完成了所有关卡
     */
    public isAllLevelsCompleted(currentLevel: number): boolean {
        return currentLevel >= this.MAX_LEVEL;
    }

    /**
     * 获取最大关卡数
     */
    public getMaxLevel(): number {
        return this.MAX_LEVEL;
    }
}