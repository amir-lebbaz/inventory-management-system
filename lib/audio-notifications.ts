// نظام التنبيهات الصوتية
export class AudioNotificationSystem {
  private static instance: AudioNotificationSystem
  private audioContext: AudioContext | null = null
  private isEnabled = true

  private constructor() {
    this.initAudioContext()
  }

  public static getInstance(): AudioNotificationSystem {
    if (!AudioNotificationSystem.instance) {
      AudioNotificationSystem.instance = new AudioNotificationSystem()
    }
    return AudioNotificationSystem.instance
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (error) {
      console.warn("Audio context not supported")
    }
  }

  private playTone(frequency: number, duration: number, volume = 0.3) {
    if (!this.audioContext || !this.isEnabled) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.value = frequency
    oscillator.type = "sine"

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + duration)
  }

  public playNewRequestSound() {
    // نغمة للطلب الجديد
    this.playTone(800, 0.2)
    setTimeout(() => this.playTone(1000, 0.2), 250)
  }

  public playUrgentRequestSound() {
    // نغمة للطلب المستعجل
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.playTone(1200, 0.15)
        setTimeout(() => this.playTone(800, 0.15), 200)
      }, i * 500)
    }
  }

  public playMessageSound() {
    // نغمة للرسالة الجديدة
    this.playTone(600, 0.3)
  }

  public playSuccessSound() {
    // نغمة للنجاح
    this.playTone(523, 0.2) // C
    setTimeout(() => this.playTone(659, 0.2), 200) // E
    setTimeout(() => this.playTone(784, 0.3), 400) // G
  }

  public playErrorSound() {
    // نغمة للخطأ
    this.playTone(300, 0.5)
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled
    localStorage.setItem("audio_notifications_enabled", enabled.toString())
  }

  public isAudioEnabled(): boolean {
    const saved = localStorage.getItem("audio_notifications_enabled")
    return saved !== null ? saved === "true" : true
  }
}

export const audioNotifications = AudioNotificationSystem.getInstance()
