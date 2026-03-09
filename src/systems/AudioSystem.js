/**
 * 音效系统 - AudioSystem (ES5兼容版)
 * 使用Web Audio API生成简单音效
 */

function AudioSystem(game) {
    this.game = game;
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.5;
    
    this.init();
}

AudioSystem.prototype.init = function() {
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        console.log('🔊 AudioSystem 初始化成功');
    } catch (e) {
        console.log('⚠️ Web Audio API 不支持');
        this.enabled = false;
    }
};

// 播放攻击音效
AudioSystem.prototype.playAttack = function() {
    if (!this.enabled || !this.ctx) return;
    
    var osc = this.ctx.createOscillator();
    var gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.15);
};

// 播放移动音效
AudioSystem.prototype.playMove = function() {
    if (!this.enabled || !this.ctx) return;
    
    var osc = this.ctx.createOscillator();
    var gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(500, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(this.volume * 0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.1);
};

// 播放卡牌使用音效
AudioSystem.prototype.playCard = function() {
    if (!this.enabled || !this.ctx) return;
    
    var osc = this.ctx.createOscillator();
    var gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(this.volume * 0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.1);
};

// 播放格挡音效
AudioSystem.prototype.playBlock = function() {
    if (!this.enabled || !this.ctx) return;
    
    var osc = this.ctx.createOscillator();
    var gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(this.volume * 0.6, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.2);
};

// 播放胜利音效
AudioSystem.prototype.playVictory = function() {
    if (!this.enabled || !this.ctx) return;
    
    var notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    for (var i = 0; i < notes.length; i++) {
        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.value = notes[i];
        
        var startTime = this.ctx.currentTime + i * 0.15;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(this.volume, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
        
        osc.start(startTime);
        osc.stop(startTime + 0.4);
    }
};

// 播放失败音效
AudioSystem.prototype.playDefeat = function() {
    if (!this.enabled || !this.ctx) return;
    
    var notes = [392.00, 349.23, 311.13, 293.66]; // G4, F4, Eb4, D4
    
    for (var i = 0; i < notes.length; i++) {
        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.value = notes[i];
        
        var startTime = this.ctx.currentTime + i * 0.2;
        gain.gain.setValueAtTime(this.volume * 0.8, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        
        osc.start(startTime);
        osc.stop(startTime + 0.3);
    }
};

// 播放选择音效
AudioSystem.prototype.playSelect = function() {
    if (!this.enabled || !this.ctx) return;
    
    var osc = this.ctx.createOscillator();
    var gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(this.volume * 0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.05);
};

// 切换静音
AudioSystem.prototype.toggleMute = function() {
    this.enabled = !this.enabled;
    return this.enabled;
};

// 设置音量
AudioSystem.prototype.setVolume = function(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
};

console.log('✅ AudioSystem.js (ES5) 加载完成');
