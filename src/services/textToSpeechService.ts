// Text-to-Speech Service for Queue Announcements
import React from 'react';
import { useSystemSettings } from '@/hooks/useSystemSettings';

export interface TTSConfig {
  enabled: boolean;
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
  language: string;
}

class TextToSpeechService {
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private config: TTSConfig;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.config = {
      enabled: true,
      voice: 'default',
      rate: 1.0,
      pitch: 1.0,
      volume: 0.8,
      language: 'en-UK'
    };
    
    this.loadVoices();
    
    // Load voices when they become available
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices() {
    this.voices = this.synthesis.getVoices();
  }

  public updateConfig(newConfig: Partial<TTSConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  public speak(text: string, priority: 'high' | 'normal' = 'normal') {
    if (!this.config.enabled || !text.trim()) return;

    // Cancel current speech if high priority
    if (priority === 'high') {
      this.synthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice settings
    utterance.rate = this.config.rate;
    utterance.pitch = this.config.pitch;
    utterance.volume = this.config.volume;
    utterance.lang = this.config.language;

    // Set specific voice if configured
    if (this.config.voice !== 'default' && this.voices.length > 0) {
      const selectedVoice = this.voices.find(voice => 
        voice.name === this.config.voice || 
        voice.lang.startsWith(this.config.language)
      );
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    this.synthesis.speak(utterance);
  }

  public announceToken(token: string, department: string, counter?: string, hospitalName?: string, template?: string) {
    let message: string;
    
    if (template) {
      // Use custom template with variable substitution
      message = template
        .replace(/{number}/g, token)
        .replace(/{department}/g, department)
        .replace(/{hospitalName}/g, hospitalName || 'Hospital')
        .replace(/{room}/g, counter || '');
    } else {
      // Fallback to default template
      const counterText = counter ? ` at ${counter}` : '';
      const hospitalText = hospitalName ? ` at ${hospitalName}` : '';
      message = `Token ${token}, please proceed to ${department}${counterText}${hospitalText}`;
    }
    
    this.speak(message, 'high');
  }

  public async announceWithChime(token: string, department: string, counter?: string, hospitalName?: string, template?: string, enableChime: boolean = true) {
    if (enableChime) {
      await this.playChime();
      // Small delay before announcement
      setTimeout(() => {
        this.announceToken(token, department, counter, hospitalName, template);
      }, 500);
    } else {
      this.announceToken(token, department, counter, hospitalName, template);
    }
  }

  public async playChime(volume: number = 0.6): Promise<void> {
    return new Promise<void>((resolve) => {
      try {
        const audioContext = new AudioContext();
        const duration = 0.3;
        
        // Create two-tone chime
        const createTone = (frequency: number, startTime: number, duration: number) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(frequency, startTime);
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          
          oscillator.start(startTime);
          oscillator.stop(startTime + duration);
          
          return oscillator;
        };

        // Play two-tone chime: high-low
        const now = audioContext.currentTime;
        createTone(800, now, duration);
        createTone(600, now + duration * 0.7, duration);
        
        setTimeout(resolve, (duration * 2) * 1000);
      } catch (error) {
        console.error('Failed to play chime:', error);
        resolve();
      }
    });
  }

  public announceTransfer(token: string, fromDept: string, toDept: string, hospitalName?: string) {
    const hospitalText = hospitalName ? ` at ${hospitalName}` : '';
    const message = `Token ${token}, please move from ${fromDept} to ${toDept}${hospitalText}`;
    
    this.speak(message, 'high');
  }

  public stop() {
    this.synthesis.cancel();
  }

  public pause() {
    this.synthesis.pause();
  }

  public resume() {
    this.synthesis.resume();
  }

  public testVoice(text: string = 'This is a test announcement for the queue management system') {
    this.speak(text, 'high');
  }
}

// Create singleton instance
export const ttsService = new TextToSpeechService();

// React hook for TTS functionality
export const useTextToSpeech = () => {
  const { settings } = useSystemSettings();

  // Update TTS config when settings change
  React.useEffect(() => {
    if (settings) {
      const enableVoice = settings.enable_voice_announcements;
      ttsService.updateConfig({
        enabled: enableVoice === true || String(enableVoice) === 'true',
        rate: parseFloat(String(settings.voice_rate || 1.0)),
        pitch: parseFloat(String(settings.voice_pitch || 1.0)),
        volume: parseFloat(String(settings.voice_volume || 0.8)),
        voice: String(settings.voice_name || 'default'),
        language: String(settings.voice_language || 'en-UK')
      });
    }
  }, [settings]);

  const enableVoice = settings?.enable_voice_announcements;
  const isEnabled = enableVoice === true || String(enableVoice) === 'true';

  return {
    speak: (text: string, priority?: 'high' | 'normal') => ttsService.speak(text, priority),
    announceToken: (token: string, department: string, counter?: string, template?: string) => 
      ttsService.announceToken(token, department, counter, settings?.clinic_name, template),
    announceWithChime: (token: string, department: string, counter?: string, template?: string) =>
      ttsService.announceWithChime(
        token, 
        department, 
        counter, 
        settings?.clinic_name, 
        template, 
        settings?.enable_announcement_chime === true || String(settings?.enable_announcement_chime) === 'true'
      ),
    announceTransfer: (token: string, fromDept: string, toDept: string) =>
      ttsService.announceTransfer(token, fromDept, toDept, settings?.clinic_name),
    playChime: (volume?: number) => ttsService.playChime(volume || parseFloat(String(settings?.chime_volume || 0.6))),
    stop: () => ttsService.stop(),
    pause: () => ttsService.pause(),
    resume: () => ttsService.resume(),
    testVoice: (text?: string) => ttsService.testVoice(text),
    getVoices: () => ttsService.getAvailableVoices(),
    isEnabled
  };
};
