export class TextToSpeechService {
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;
  private isInitialized = false;
  private userInteracted = false;
  private audioContext: AudioContext | null = null;

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

  // Set user interaction flag to allow audio playback
  setUserInteracted(): void {
    this.userInteracted = true;
    console.log('🎤 User interaction detected - audio playback enabled');
  }

  // Check if browser supports speech synthesis
  isSpeechSynthesisSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  async speak(text: string, options: {
    rate?: number;
    pitch?: number;
    volume?: number;
    repeatCount?: number;
    requireUserInteraction?: boolean;
  } = {}): Promise<void> {
    // Check if speech synthesis is supported
    if (!this.isSpeechSynthesisSupported()) {
      console.warn('Speech synthesis not supported in this browser');
      return;
    }

    // Check for user interaction if required
    if (options.requireUserInteraction !== false && !this.userInteracted) {
      console.warn('Speech blocked: User interaction required for audio playback');
      return;
    }

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

        // Brief pause to ensure cancel takes effect
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.voice = this.voice;
          utterance.rate = rate;
          utterance.pitch = pitch;
          utterance.volume = volume;
          
          // Enhanced error handling for browser compatibility
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
            // Don't reject on first error, try to continue
            if (currentRepeat === 0) {
              console.log('Retrying speech synthesis...');
              setTimeout(() => speakOnce(), 100);
            } else {
              reject(error);
            }
          };

          // Ensure speech synthesis is ready
          if (this.synth.speaking) {
            this.synth.cancel();
            setTimeout(() => this.synth.speak(utterance), 100);
          } else {
            this.synth.speak(utterance);
          }
        }, 50);
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
        repeatCount: 2, // Repeat twice for clarity
        requireUserInteraction: true // Require user interaction
      });
    } catch (error) {
      console.error('Failed to announce token:', error);
      // Fallback: try without requirements
      try {
        await this.speak(announcement, {
          rate: 0.8,
          repeatCount: 1,
          requireUserInteraction: false
        });
      } catch (fallbackError) {
        console.error('Fallback announcement also failed:', fallbackError);
      }
    }
  }

  // Method to play a chime sound before announcement
  async playChime(): Promise<void> {
    // Check for user interaction
    if (!this.userInteracted) {
      console.warn('Chime blocked: User interaction required');
      return;
    }

    return new Promise((resolve) => {
      try {
        // Initialize audio context with user interaction
        if (!this.audioContext) {
          this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        // Resume audio context if suspended (Safari requirement)
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
        
        // Create a pleasant two-tone chime
        const playTone = (frequency: number, duration: number, delay: number) => {
          const oscillator = this.audioContext!.createOscillator();
          const gainNode = this.audioContext!.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(this.audioContext!.destination);
          
          oscillator.frequency.setValueAtTime(frequency, this.audioContext!.currentTime + delay);
          gainNode.gain.setValueAtTime(0.2, this.audioContext!.currentTime + delay);
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + delay + duration);
          
          oscillator.start(this.audioContext!.currentTime + delay);
          oscillator.stop(this.audioContext!.currentTime + delay + duration);
        };

        // Play a pleasant two-tone chime (C and G notes)
        playTone(523.25, 0.3, 0); // C note
        playTone(783.99, 0.4, 0.2); // G note
        
        // Resolve after chime completes
        setTimeout(resolve, 800);
      } catch (error) {
        console.error('Chime playback failed:', error);
        resolve(); // Continue even if chime fails
      }
    });
  }

  // Combined method to play chime then announce
  async chimeAndAnnounce(token: string, counter: string | number, department?: string): Promise<void> {
    try {
      // Ensure user has interacted before playing audio
      if (this.userInteracted) {
        await this.playChime();
      }
      await this.announceToken(token, counter, department);
    } catch (error) {
      console.error('Failed to play chime and announce:', error);
    }
  }

  // Method to enable audio after user interaction
  static enableAudioOnUserInteraction(): TextToSpeechService {
    const instance = new TextToSpeechService();
    
    // Add event listeners for user interaction
    const enableAudio = () => {
      instance.setUserInteracted();
      // Remove listeners after first interaction
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    };

    document.addEventListener('click', enableAudio, { once: true });
    document.addEventListener('keydown', enableAudio, { once: true });
    document.addEventListener('touchstart', enableAudio, { once: true });

    return instance;
  }
}