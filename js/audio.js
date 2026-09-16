/**
 * Mighty Fish 專屬音效與語音控制器 (Audio Controller)
 * 整合：Web Audio API (660->880Hz 上行音效、220->150Hz 低沉錯誤音)、Web Speech 完整問句朗讀與教材真人音檔
 */

class FishAudioController {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
    this.voiceAudio = null;
    this.currentQuestion = null;
    this.voiceToken = 0;
    this.voiceTimer = null;

    // 延遲初始化 Web Audio
    this.initAudioContext();
  }

  initAudioContext() {
    if (!this.audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
  }

  /**
   * 解鎖並喚醒 AudioContext（於使用者點擊「開始遊戲」或點擊畫面時呼叫，規避行動瀏覽器限制）
   */
  unlockAudio() {
    this.initAudioContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopVoice();
    }
    return this.isMuted;
  }

  /**
   * 答對音效：明顯的上行音效（660Hz -> 880Hz 雙音和弦升調）
   */
  playCorrectSound() {
    if (this.isMuted) return;
    this.unlockAudio();
    if (!this.audioCtx) return;

    try {
      const t = this.audioCtx.currentTime;

      // 第一音：660Hz (E5)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(660, t);
      gain1.gain.setValueAtTime(0.22, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(t);
      osc1.stop(t + 0.19);

      // 第二音：880Hz (A5) 上行
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, t + 0.12);
      gain2.gain.setValueAtTime(0.25, t + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(t + 0.12);
      osc2.stop(t + 0.43);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  /**
   * 答錯音效：明顯的低沉音效（220Hz -> 150Hz 下行滑音警示）
   */
  playWrongSound() {
    if (this.isMuted) return;
    this.unlockAudio();
    if (!this.audioCtx) return;

    try {
      const t = this.audioCtx.currentTime;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      // 220Hz (A3) 下滑至 150Hz (D3)
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(150, t + 0.35);

      // 低通濾波降低尖銳感，呈現飽滿沉重警告
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, t);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(t);
      osc.stop(t + 0.4);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  /**
   * 水泡破裂音效 (穿過圓環時之水感微音效)
   */
  playBubblePop() {
    if (this.isMuted) return;
    this.unlockAudio();
    if (!this.audioCtx) return;

    try {
      const t = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(1200, t + 0.08);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(t);
      osc.stop(t + 0.11);
    } catch (e) {}
  }

  // 題目文字是唯一來源；不可用答案單字代替完整問句。
  getQuestionSpeechSentence(qData) {
    return (qData?.questionEn || "").replace(/_+/g, "blank").replace(/\s+/g, " ").trim();
  }

  playQuestionAudio(qData, onEnded = null) {
    this.currentQuestion = qData;
    this.speakFullSentence(this.getQuestionSpeechSentence(qData), onEnded);
  }

  speakOptionText(text, onEnded = null) {
    this.speakFullSentence(text, onEnded);
  }

  speakFullSentence(text, onSuccess = null, onError = null) {
    this.stopVoice();
    if (this.isMuted || !text) { onSuccess?.(); return; }
    const clean = text.trim();
    const path = (window.SENTENCES_AUDIO_MAP || {})[clean];
    if (path) {
      this.playAudioFile(path, onSuccess, () => this.speakBrowser(clean, onSuccess, onError));
    } else {
      this.speakBrowser(clean, onSuccess, onError);
    }
  }

  // 音檔缺失時讀出同一句文字，不猜檔名、不改讀答案。
  speakBrowser(text, onEnded, onError) {
    this.stopVoice();
    const token = this.voiceToken;
    const done = () => {
      if (token !== this.voiceToken) return;
      this.stopVoice();
      onEnded?.();
    };
    if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') {
      (onError || onEnded)?.();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find(v => v.lang === 'en-US' && /natural|google|samantha/i.test(v.name))
      || voices.find(v => v.lang === 'en-US') || null;
    utterance.onend = done;
    utterance.onerror = () => {
      if (token !== this.voiceToken) return;
      this.stopVoice();
      (onError || onEnded)?.();
    };
    this.utterance = utterance;
    this.voiceTimer = setTimeout(done, 15000);
    window.speechSynthesis.speak(utterance);
  }

  playAudioFile(audioPath, onEnded = null, onError = null) {
    this.stopVoice();
    if (this.isMuted) { onEnded?.(); return; }
    const token = this.voiceToken;
    const finish = (failed = false) => {
      if (token !== this.voiceToken) return;
      this.stopVoice();
      (failed ? (onError || onEnded) : onEnded)?.();
    };
    try {
      const audio = new Audio(audioPath);
      this.voiceAudio = audio;
      audio.onended = () => finish();
      audio.onerror = () => finish(true);
      this.voiceTimer = setTimeout(() => finish(true), 15000);
      const playing = audio.play();
      if (playing) playing.catch(() => finish(true));
    } catch (error) { finish(true); }
  }

  stopVoice() {
    // 先使舊事件失效，再停止播放器，避免取消事件觸發下一段語音。
    this.voiceToken++;
    clearTimeout(this.voiceTimer);
    this.voiceTimer = null;
    if (this.utterance) {
      this.utterance.onend = this.utterance.onerror = null;
      this.utterance = null;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (this.voiceAudio) {
      const audio = this.voiceAudio;
      this.voiceAudio = null;
      audio.onended = audio.onerror = null;
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
  }
}

const FishSound = new FishAudioController();
