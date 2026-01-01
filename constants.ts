
import { PadData, KnobData } from './types';

// Initialize 16 pads (Bank A: 0-7, Bank B: 8-15)
export const INITIAL_PADS: PadData[] = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  note: 36 + i, 
  triggerType: 'note',
  color: 'cyan',
  name: `Pad ${i + 1}`,
  isTriggered: false,
  sampleUrl: null,
  buffer: null,
  velocityMode: 'dynamic',
  envelope: {
    attack: 0,
    decay: 0.1,
    sustain: 1.0,
    release: 0.5,
    tail: 0.05
  }
}));

// Mapped correctly to useAudio hooks (Now per channel)
// 0: VOL, 1: PAN, 2: PITCH, 3: DRV, 4: REV, 5: DLY, 6: CUT, 7: RES
export const KNOB_DEFAULTS = [
    { label: 'VOL', val: 100 },
    { label: 'PAN', val: 64 },
    { label: 'PITCH', val: 64 },
    { label: 'DRV', val: 0 },
    { label: 'REV', val: 0 },
    { label: 'DLY', val: 0 },
    { label: 'CUT', val: 127 },
    { label: 'RES', val: 0 },
];

// Matrix of 8 channels x 8 knobs
export const INITIAL_CHANNEL_DATA = Array.from({ length: 8 }, () => 
    KNOB_DEFAULTS.map(k => k.val)
);

export const INITIAL_KNOBS: KnobData[] = KNOB_DEFAULTS.map((def, i) => ({
  id: i,
  cc: 1 + i, 
  value: def.val, 
  label: def.label,
}));

export const KEYBOARD_MAP: Record<string, number> = {
  'z': 4, 'x': 5, 'c': 6, 'v': 7, 
  'a': 0, 's': 1, 'd': 2, 'f': 3
};
