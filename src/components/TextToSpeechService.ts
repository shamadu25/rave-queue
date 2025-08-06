export class TextToSpeechService {
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;
  private isInitialized = false;

  constructor() {
    this.synth = window.speechSynthesis;
    this.initializeVoice();
  }

  private async initializeVoice(): Promise<void> {
    return new Promise((resolve) => {
      const setVoice = () => {
        const voices = this.synth.getVoices();
        
        // Prefer female English voices
        const femaleVoices = voices.filter(voice => 
          voice.lang.startsWith('en') && 
          (voice.name.toLowerCase().includes('female') ||
           voice.name.toLowerCase().includes('woman') ||
           voice.name.toLowerCase().includes('samantha') ||
           voice.name.toLowerCase().includes('victoria') ||
           voice.name.toLowerCase().includes('karen') ||
           voice.name.toLowerCase().includes('moira') ||
           voice.name.toLowerCase().includes('alice'))
        );

        // Fallback to any English voice if no female voice found
        this.voice = femaleVoices[0] || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
        this.isInitialized = true;
        resolve();
      };

      if (this.synth.getVoices().length > 0) {
        setVoice();
      } else {
        this.synth.addEventListener('voiceschanged', setVoice, { once: true });
      }
    });
  }

  async speak(text: string, options: {
    rate?: number;
    pitch?: number;
    volume?: number;
    repeatCount?: number;
  } = {}): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeVoice();
    }

    const {
      rate = 0.9, // Slightly slower for clarity
      pitch = 1.0,
      volume = 1.0,
      repeatCount = 1
    } = options;

    return new Promise((resolve, reject) => {
      let currentRepeat = 0;

      const speakOnce = () => {
        // Cancel any ongoing speech
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.voice;
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        utterance.onend = () => {
          currentRepeat++;
          if (currentRepeat < repeatCount) {
            // Add a small pause between repetitions
            setTimeout(() => speakOnce(), 500);
          } else {
            resolve();
          }
        };

        utterance.onerror = (error) => {
          console.error('Speech synthesis error:', error);
          reject(error);
        };

        this.synth.speak(utterance);
      };

      speakOnce();
    });
  }

  stop(): void {
    this.synth.cancel();
  }

  // Method to announce token serving
  async announceToken(token: string, counter: string | number, department?: string): Promise<void> {
    const counterText = typeof counter === 'number' ? `Counter ${counter}` : counter;
    const departmentText = department ? ` in ${department}` : '';
    
    const announcement = `Now serving token ${token}. Please proceed to ${counterText}${departmentText}.`;
    
    console.log('🔊 Announcing:', announcement);
    
    try {
      await this.speak(announcement, {
        rate: 0.8, // Slower for clarity
        repeatCount: 2 // Repeat twice for clarity
      });
    } catch (error) {
      console.error('Failed to announce token:', error);
    }
  }

  // Method to play a chime sound before announcement
  playChime(): Promise<void> {
    return new Promise((resolve) => {
      // Create a simple chime using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a pleasant two-tone chime
      const playTone = (frequency: number, duration: number, delay: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + delay);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + duration);
        
        oscillator.start(audioContext.currentTime + delay);
        oscillator.stop(audioContext.currentTime + delay + duration);
      };

      // Play a pleasant two-tone chime (C and G notes)
      playTone(523.25, 0.3, 0); // C note
      playTone(783.99, 0.4, 0.2); // G note
      
      // Resolve after chime completes
      setTimeout(resolve, 800);
    });
  }

  // Combined method to play chime then announce
  async chimeAndAnnounce(token: string, counter: string | number, department?: string): Promise<void> {
    try {
      await this.playChime();
      await this.announceToken(token, counter, department);
    } catch (error) {
      console.error('Failed to play chime and announce:', error);
    }
  }
}