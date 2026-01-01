
export type VelocityMode = 'dynamic' | 'max' | 'mid' | 'min';

export interface EnvelopeData {
  attack: number; // 0 to 2s
  decay: number; // 0 to 2s
  sustain: number; // 0.0 to 1.0 (Level)
  release: number; // 0 to 5s (Fade out duration)
  tail: number; // 0 to 0.5s (De-click / Hard clip fix)
}

export interface PadData {
  id: number;
  note: number; // MIDI note number
  cc?: number; // Optional MIDI CC number for triggering
  triggerType: 'note' | 'cc'; // How this pad is triggered
  color: string;
  name: string;
  isTriggered: boolean;
  sampleUrl: string | null;
  buffer: AudioBuffer | null;
  velocityMode: VelocityMode;
  envelope: EnvelopeData;
}

export interface KnobData {
  id: number;
  cc: number; // MIDI Control Change number
  value: number; // 0-127
  label: string;
}

export interface LibrarySample {
  id: string;
  name: string;
  date: number;
  buffer: AudioBuffer;
}

export type MIDIMessage = {
  command: number;
  note: number;
  velocity: number;
};
