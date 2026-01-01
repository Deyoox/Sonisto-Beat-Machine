
import { useState, useRef, useCallback } from 'react';
import { EnvelopeData } from '../types';

// Knob Index Mapping (Per Channel):
// 0: VOL (Channel Volume)
// 1: PAN (Channel Panner)
// 2: PITCH (Playback Rate)
// 3: DRV (Distortion)
// 4: REV (Reverb Send)
// 5: DLY (Delay Send)
// 6: CUT (Filter Freq)
// 7: RES (Filter Q)

interface ChannelStrip {
  input: GainNode;
  filter: BiquadFilterNode;
  drive: WaveShaperNode;
  panner: StereoPannerNode;
  volume: GainNode;
  revSend: GainNode;
  dlySend: GainNode;
  pitchVal: number; // Store pitch norm (0-1) for this channel
}

// Simple cache for distortion curves to avoid GC thrashing
const distortionCache = new Map<number, Float32Array>();

export const useAudio = () => {
  const ctxRef = useRef<AudioContext | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Audio Graph Refs
  const channelsRef = useRef<ChannelStrip[]>([]);
  const masterGainRef = useRef<GainNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const convolverRef = useRef<ConvolverNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  
  const initAudio = useCallback(() => {
    if (ctxRef.current) return;

    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    ctxRef.current = ctx;

    // --- Global Nodes ---
    const master = ctx.createGain();
    const compressor = ctx.createDynamicsCompressor();
    
    // Analyzer for Visualizer
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.8;
    analyserNodeRef.current = analyser;

    // Global FX Returns
    const convolver = ctx.createConvolver();
    convolverRef.current = convolver;

    const delay = ctx.createDelay(4.0); // Allow longer delays
    delayNodeRef.current = delay;

    const delayFeedback = ctx.createGain();

    // --- Global Config ---
    master.gain.value = 0.9; // Fixed Master Volume
    compressor.threshold.value = -12;
    compressor.ratio.value = 4;

    // Delay Settings
    delay.delayTime.value = 0.33;
    delayFeedback.gain.value = 0.4;
    delay.connect(delayFeedback);
    delayFeedback.connect(delay);
    
    // Reverb Settings
    // Create impulse response asynchronously if possible, but here we do it sync
    convolver.buffer = impulseResponse(2.0, 2.0, false, ctx);

    // Global Routing: Returns -> Master -> Analyser -> Compressor -> Out
    delay.connect(master);
    convolver.connect(master);
    master.connect(analyser);
    analyser.connect(compressor);
    compressor.connect(ctx.destination);

    // --- Create 8 Channel Strips ---
    const channels: ChannelStrip[] = [];
    
    for (let i = 0; i < 8; i++) {
        // Nodes
        const input = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        const drive = ctx.createWaveShaper();
        const panner = ctx.createStereoPanner();
        const volume = ctx.createGain();
        const revSend = ctx.createGain();
        const dlySend = ctx.createGain();

        // Defaults
        filter.type = 'lowpass';
        filter.frequency.value = 20000;
        filter.Q.value = 0;
        drive.curve = getDistortionCurve(0, ctx.sampleRate);
        drive.oversample = '4x';
        volume.gain.value = 0.8;
        revSend.gain.value = 0;
        dlySend.gain.value = 0;

        // Routing: Input -> Filter -> Drive -> Panner -> Volume -> Master
        input.connect(filter);
        filter.connect(drive);
        drive.connect(panner);
        panner.connect(volume);
        volume.connect(master);

        // Sends: Input -> SendNode -> GlobalEffect
        input.connect(revSend);
        revSend.connect(convolver);
        
        input.connect(dlySend);
        dlySend.connect(delay);

        channels.push({
            input,
            filter,
            drive,
            panner,
            volume,
            revSend,
            dlySend,
            pitchVal: 0.5 // Default center pitch
        });
    }

    channelsRef.current = channels;
    masterGainRef.current = master;

    setIsReady(true);
    ctx.resume().catch(e => console.error("Audio resume failed", e));
  }, []);

  const updateKnobParam = useCallback((channelIdx: number, knobIdx: number, value: number) => {
    if (!ctxRef.current || !channelsRef.current[channelIdx]) return;
    
    const now = ctxRef.current.currentTime;
    const norm = value / 127; // 0.0 to 1.0
    const channel = channelsRef.current[channelIdx];

    switch (knobIdx) {
        case 0: // VOL (Channel Volume)
            // Exponential volume curve
            channel.volume.gain.setTargetAtTime(norm * norm * 1.2, now, 0.02);
            break;
        case 1: // PAN
            const pan = (norm * 2) - 1; // -1 to 1
            channel.panner.pan.setTargetAtTime(pan, now, 0.02);
            break;
        case 2: // PITCH
            channel.pitchVal = norm;
            break;
        case 3: // DRV
            // Use cached curve generation
            channel.drive.curve = getDistortionCurve(norm * 400, ctxRef.current.sampleRate);
            break;
        case 4: // REV
            channel.revSend.gain.setTargetAtTime(norm * 1.5, now, 0.02);
            break;
        case 5: // DLY
            channel.dlySend.gain.setTargetAtTime(norm * 0.8, now, 0.02);
            break;
        case 6: // CUT
            // Exponential mapping: 0 -> 20Hz, 1 -> 20kHz
            const freq = 20 * Math.pow(1000, norm);
            const safeFreq = Math.max(20, Math.min(20000, freq));
            channel.filter.frequency.setTargetAtTime(safeFreq, now, 0.02);
            break;
        case 7: // RES
            const q = norm * 20;
            channel.filter.Q.setTargetAtTime(q, now, 0.02);
            break;
    }
  }, []);

  const updateGlobalDelayTime = useCallback((time: number) => {
      if (delayNodeRef.current && ctxRef.current) {
          delayNodeRef.current.delayTime.setTargetAtTime(time, ctxRef.current.currentTime, 0.1);
      }
  }, []);

  const updateReverbSize = useCallback((value: number) => {
    if (!ctxRef.current || !convolverRef.current) return;
    // Map 0-127 to Duration (0.1s to 5.0s) and Decay
    const norm = value / 127;
    const duration = 0.1 + (norm * 4.9);
    const decay = 2.0 + (norm * 3.0);
    
    // Note: Generating impulse response in real-time on JS thread can be heavy.
    // In production, use AudioWorklet or pre-calculated buffers.
    const buffer = impulseResponse(duration, decay, false, ctxRef.current);
    convolverRef.current.buffer = buffer;
  }, []);

  const loadSample = useCallback(async (file: File): Promise<AudioBuffer> => {
    if (!ctxRef.current) initAudio();
    if (!ctxRef.current) throw new Error("Audio Context could not be initialized.");
    
    const arrayBuffer = await file.arrayBuffer();
    return await ctxRef.current.decodeAudioData(arrayBuffer);
  }, [initAudio]);

  const playSample = useCallback((buffer: AudioBuffer | null, padId: number, velocity: number = 127, envelope?: EnvelopeData) => {
    if (!ctxRef.current || !buffer) return;
    
    const channel = channelsRef.current[padId];
    if (!channel) return;

    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume().catch(() => {});
    }

    const source = ctxRef.current.createBufferSource();
    source.buffer = buffer;

    // Apply Pitch per channel
    const normPitch = channel.pitchVal;
    let rate = 1.0;
    if (normPitch < 0.5) {
        rate = 0.5 + normPitch; 
    } else {
        rate = 1.0 + (normPitch - 0.5) * 2;
    }
    source.playbackRate.value = rate;

    // Envelope & Velocity Gain
    const envGain = ctxRef.current.createGain();
    
    const now = ctxRef.current.currentTime;
    const velFactor = velocity / 127;
    
    // Initialize Gain at 0
    envGain.gain.setValueAtTime(0, now);

    if (envelope) {
        const { attack, decay, sustain, tail } = envelope;
        
        // 1. Attack Phase
        const attackEnd = now + Math.max(0.005, attack); // Minimum 5ms attack to avoid pop
        envGain.gain.linearRampToValueAtTime(velFactor, attackEnd);
        
        // 2. Decay -> Sustain Phase
        const decayEnd = attackEnd + Math.max(0.005, decay);
        // Ensure sustain is not 0 for exponential ramp, use 0.001 as floor
        const susLevel = Math.max(0.001, velFactor * sustain);
        envGain.gain.exponentialRampToValueAtTime(susLevel, decayEnd);

        // 3. Tail / Release Phase (End of sample cleanup)
        // Adjust for playback rate changes on the duration
        const duration = buffer.duration / rate;
        const stopTime = now + duration;
        
        // Ensure tail doesn't start before decay ends
        const tailDuration = Math.max(0.01, tail); // Min tail
        const tailStart = Math.max(decayEnd, stopTime - tailDuration);
        
        // Hold sustain level until tail starts
        envGain.gain.setValueAtTime(susLevel, tailStart);
        // Fade to 0
        envGain.gain.linearRampToValueAtTime(0, stopTime);
    } else {
        // Basic Envelope (No clicks)
        envGain.gain.setValueAtTime(0, now);
        envGain.gain.linearRampToValueAtTime(velFactor, now + 0.005);
        envGain.gain.setValueAtTime(velFactor, now + (buffer.duration / rate) - 0.01);
        envGain.gain.linearRampToValueAtTime(0, now + (buffer.duration / rate));
    }

    // Connect Source -> Envelope -> Channel Input
    source.connect(envGain);
    envGain.connect(channel.input);

    source.start(0);
  }, []);

  const previewBuffer = useCallback((buffer: AudioBuffer) => {
    if (!ctxRef.current) return;
    
    const source = ctxRef.current.createBufferSource();
    source.buffer = buffer;
    
    const gain = ctxRef.current.createGain();
    gain.gain.value = 0.6; 
    
    source.connect(gain);
    if (masterGainRef.current) {
        gain.connect(masterGainRef.current);
    } else {
        gain.connect(ctxRef.current.destination);
    }
    
    source.start(0);
  }, []);

  return {
    initAudio,
    loadSample,
    playSample,
    previewBuffer,
    updateKnobParam,
    updateGlobalDelayTime,
    updateReverbSize,
    isReady,
    analyserNode: analyserNodeRef.current
  };
};

// --- Audio Utilities ---

function getDistortionCurve(amount: number, sampleRate: number) {
    // Round amount to nearest integer to increase cache hit rate
    const key = Math.round(amount);
    if (distortionCache.has(key)) {
        return distortionCache.get(key)!;
    }
    const curve = makeDistortionCurve(amount, sampleRate);
    distortionCache.set(key, curve);
    return curve;
}

function makeDistortionCurve(amount: number, sampleRate: number) {
  const k = amount;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  
  if (k === 0) {
      for (let i = 0; i < n_samples; ++i) {
        curve[i] = (i * 2) / n_samples - 1;
      }
      return curve;
  }

  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

function impulseResponse(duration: number, decay: number, reverse: boolean, ctx: AudioContext) {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const n = reverse ? length - i : i;
    left[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
    right[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
  }
  return impulse;
}
