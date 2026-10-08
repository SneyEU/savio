/**
 * Ports de la voix (phase 2). Déclarés dès maintenant pour stabiliser l'architecture ;
 * les adaptateurs (whisper.cpp, Piper, voix Windows) viendront ensuite.
 */
import type { Locality } from '../ai/types';

export interface Transcript {
  text: string;
  language: string;
  /** Segments horodatés, utiles pour la prononciation et les sous-titres. */
  segments: { startMs: number; endMs: number; text: string; confidence?: number }[];
}

export interface SpeechToText {
  readonly id: string;
  readonly locality: Locality;
  transcribe(audio: Float32Array, sampleRate: number, language?: string): Promise<Transcript>;
}

export type VoiceStyle = 'calm' | 'energetic' | 'professional' | 'warm' | 'teaching';

export interface SpeakOptions {
  language: string;
  voiceId?: string;
  /** 0.5 (lent) → 2 (rapide). */
  rate?: number;
  style?: VoiceStyle;
  signal?: AbortSignal;
}

export interface TextToSpeech {
  readonly id: string;
  readonly locality: Locality;
  listVoices(language?: string): Promise<{ id: string; label: string; language: string }[]>;
  /** Résout quand la lecture est terminée ; s'interrompt si `signal` est annulé (barge-in). */
  speak(text: string, options: SpeakOptions): Promise<void>;
}

export interface VoiceActivityDetector {
  /** Retourne true si la trame contient de la parole. */
  isSpeech(frame: Float32Array, sampleRate: number): boolean;
}
