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
      language: 'en-US'
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

  public announceToken(token: string, department: string, counter?: string, hospitalName?: string) {
    const counterText = counter ? ` at ${counter}` : '';
    const hospitalText = hospitalName ? ` at ${hospitalName}` : '';
    const message = `Token ${token}, please proceed to ${department}${counterText}${hospitalText}`;
    
    this.speak(message, 'high');
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
        language: String(settings.voice_language || 'en-US')
      });
    }
  }, [settings]);

  const enableVoice = settings?.enable_voice_announcements;
  const isEnabled = enableVoice === true || String(enableVoice) === 'true';

  return {
    speak: (text: string, priority?: 'high' | 'normal') => ttsService.speak(text, priority),
    announceToken: (token: string, department: string, counter?: string) => 
      ttsService.announceToken(token, department, counter, settings?.clinic_name),
    announceTransfer: (token: string, fromDept: string, toDept: string) =>
      ttsService.announceTransfer(token, fromDept, toDept, settings?.clinic_name),
    stop: () => ttsService.stop(),
    pause: () => ttsService.pause(),
    resume: () => ttsService.resume(),
    testVoice: (text?: string) => ttsService.testVoice(text),
    getVoices: () => ttsService.getAvailableVoices(),
    isEnabled
  };
};