import { _decorator, AudioClip, AudioSource, Component, Button, Sprite, sys } from 'cc';

import { AudioMgr } from './AudioMgr';
import { SaveManager } from './SaveManager';
const { ccclass, property } = _decorator;

@ccclass("CarSound")
export class CarSound {
    @property(AudioClip)
    clip : AudioClip = null;
}

@ccclass("CarMusic")
export class CarMusic {
    @property(AudioClip)
    clip : AudioClip = null;
}


@ccclass('CarAudio')
export class CarAudio extends Component {

    @property([CarMusic])
    bgMusics : CarMusic[] = [];

    @property([CarSound])
    carSounds : CarSound[] = [];

    @property(Button)
    public btnAudio: Button = null;

    audioConfig = {isAudioOn: true}

    currMusic: CarMusic = null;
    currSound: CarSound = null;

    musicAudioSource: AudioSource = null;

    resumeMusic(force: boolean) {
        if (!this.audioConfig.isAudioOn) {
            return;
        }
        if (force) {
            let time = this.musicAudioSource.currentTime;
            this.musicAudioSource.play();
            this.musicAudioSource.currentTime = time;
        }
        else if (!this.musicAudioSource.playing) {
            this.musicAudioSource.play();
        }
    }

    loopMusic() {
        console.log("[CarAudio] loopMusic 开始播放背景音乐");
        console.log("[CarAudio] 音频开关状态:", this.audioConfig.isAudioOn);
        console.log("[CarAudio] bgMusics数组长度:", this.bgMusics.length);
        
        if (this.bgMusics.length === 0) {
            console.log("[CarAudio] 错误：bgMusics数组为空，无法播放背景音乐");
            return;
        }
        
        // let music = this.bgMusics[Math.floor(Math.random() * this.bgMusics.length)];
        let music = this.bgMusics[0];
        console.log("[CarAudio] 选择的音乐:", music);
        console.log("[CarAudio] 音乐clip:", music.clip);
        
        if (!music.clip) {
            console.log("[CarAudio] 错误：音乐clip为空");
            return;
        }
        
        this.musicAudioSource.clip = music.clip;
        this.musicAudioSource.volume = 0.4 * (this.audioConfig.isAudioOn ? 1.0 : 0.0);
        console.log("[CarAudio] 设置音量:", this.musicAudioSource.volume);
        this.musicAudioSource.play();
        console.log("[CarAudio] 调用play()方法完成");
        this.currMusic = music;
        this.scheduleOnce(()=>{
            this.loopMusic();
        }, music.clip.getDuration())
    }

    playCarSound() {
        console.log("[CarAudio] playCarSound 开始播放音效");
        console.log("[CarAudio] 音频开关状态:", this.audioConfig.isAudioOn);
        console.log("[CarAudio] carSounds数组长度:", this.carSounds.length);
        
        if (!this.audioConfig.isAudioOn) {
            console.log("[CarAudio] 音频已关闭，不播放音效");
            return;
        }
        
        if (this.carSounds.length === 0) {
            console.log("[CarAudio] 错误：carSounds数组为空，无法播放音效");
            return;
        }
        
        // let sound = this.carSounds[Math.floor(Math.random() * this.carSounds.length)];
        let sound = this.carSounds[0];
        console.log("[CarAudio] 选择的音效:", sound);
        console.log("[CarAudio] 音效clip:", sound.clip);
        
        if (!sound.clip) {
            console.log("[CarAudio] 错误：音效clip为空");
            return;
        }
        
        console.log("[CarAudio] AudioMgr实例:", AudioMgr.inst);
        AudioMgr.inst.playOneShot(sound.clip, 1.0);
        console.log("[CarAudio] 音效播放调用完成");
    }

    async loadConfig() {
        console.log("[CarAudio] loadConfig 开始加载音频配置");
        try {
            const saveManager = SaveManager.getInstance();
            const gameData = await saveManager.loadGameData();
            this.audioConfig.isAudioOn = gameData.isAudioOn;
            console.log("[CarAudio] 从SaveManager读取到音频配置:", this.audioConfig);
        } catch (error) {
            console.error("[CarAudio] 加载音频配置失败，使用默认值:", error);
            this.audioConfig.isAudioOn = true;
        }
    }

    async saveConfig() {
        try {
            const saveManager = SaveManager.getInstance();
            await saveManager.saveAudioState(this.audioConfig.isAudioOn);
            console.log("[CarAudio] 音频配置已保存到SaveManager");
        } catch (error) {
            console.error("[CarAudio] 保存音频配置失败:", error);
        }
    }

    onClickAudio() {
        console.log("[CarAudio] onClickAudio 切换音频开关");
        console.log("[CarAudio] 切换前状态:", this.audioConfig.isAudioOn);
        this.audioConfig.isAudioOn = !this.audioConfig.isAudioOn;
        console.log("[CarAudio] 切换后状态:", this.audioConfig.isAudioOn);
        
        if(this.audioConfig.isAudioOn){
            console.log("[CarAudio] 声音已开启");
        } else{
            console.log("[CarAudio] 声音已关闭");
        }

        // 获取按钮的Sprite组件
        const btnSprite = this.btnAudio.node.getComponent(Sprite);
        if (!btnSprite) {
            console.warn('[UISetting] 音频按钮未找到Sprite组件');
            return;
        }

        this.updateAudioButtonState();

        // 异步保存配置
        this.saveConfig().catch(error => {
            console.error("[CarAudio] 保存音频配置时出错:", error);
        });
        
        // 处理音频开关状态变化
        if (this.musicAudioSource) {
            if (this.audioConfig.isAudioOn) {
                // 声音开启时，检查背景音乐是否正在播放
                if (!this.musicAudioSource.playing) {
                    console.log("[CarAudio] 声音开启且背景音乐未播放，开始播放背景音乐");
                    this.loopMusic();
                } else {
                    // 如果已经在播放，只需要恢复音量
                    this.musicAudioSource.volume = 0.4;
                    console.log("[CarAudio] 声音开启，恢复背景音乐音量:", this.musicAudioSource.volume);
                }
            } else {
                // 声音关闭时，将音量设为0但不停止播放
                this.musicAudioSource.volume = 0.0;
                console.log("[CarAudio] 声音关闭，设置背景音乐音量为0");
            }
        } else {
            console.log("[CarAudio] 警告：musicAudioSource为空");
        }
    }

    updateAudioButtonState() {
        // 获取按钮的Sprite组件
        const btnSprite = this.btnAudio.node.getComponent(Sprite);
        if (!btnSprite) {
            console.warn('[UISetting] 音频按钮未找到Sprite组件');
            return;
        }

        // 根据音频开关状态设置按钮灰度
        if (this.audioConfig.isAudioOn) {
            btnSprite.grayscale = false;
            console.log('[UISetting] 音频已开启，取消按钮灰度');
        } else {
            btnSprite.grayscale = true;
            console.log('[UISetting] 音频已关闭，设置按钮灰度');
        }
    }

    async start() {
        console.log("[CarAudio] start 开始初始化音频管理器");
        console.log("[CarAudio] bgMusics数组:", this.bgMusics);
        console.log("[CarAudio] carSounds数组:", this.carSounds);
        
        this.musicAudioSource = this.node.addComponent(AudioSource);
        console.log("[CarAudio] 创建AudioSource组件:", this.musicAudioSource);
        
        // 异步加载配置
        await this.loadConfig();
        console.log("[CarAudio] 配置加载完成，检查音频开关状态，确认是否开始播放背景音乐");
        
        // 更新按钮状态
        this.updateAudioButtonState();
        
        // 根据音频开关状态决定是否播放背景音乐
        if(this.audioConfig.isAudioOn){
            this.loopMusic();
        }
    }

}


