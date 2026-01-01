
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { PadData, KnobData, LibrarySample, EnvelopeData } from '../types';
import { INITIAL_PADS, INITIAL_KNOBS, INITIAL_CHANNEL_DATA, KNOB_DEFAULTS } from '../constants';
import { useAudio } from './useAudio';

export const useInstrument = (audio: ReturnType<typeof useAudio>) => {
  // --- State ---
  const [pads, setPads] = useState<PadData[]>(INITIAL_PADS);
  const [knobs, setKnobs] = useState<KnobData[]>(INITIAL_KNOBS);
  const [library, setLibrary] = useState<LibrarySample[]>([]);
  const [selectedChannel, setSelectedChannel] = useState(0);
  const [selectedBank, setSelectedBank] = useState<'A' | 'B'>('A');
  const [selectedPadId, setSelectedPadId] = useState<number>(0); // New: Track which pad is selected for editing

  // Delay State
  const [delayTimeVal, setDelayTimeVal] = useState(40); // 0-127
  const [delaySnap, setDelaySnap] = useState(true);

  // Reverb State
  const [reverbSizeVal, setReverbSizeVal] = useState(64); // 0-127

  // --- Refs for Performance/Access ---
  // These are exposed to the MidiProcessor to avoid closure staleness in event listeners
  const channelDataRef = useRef<number[][]>(INITIAL_CHANNEL_DATA);
  const knobsRef = useRef(INITIAL_KNOBS);
  const padsRef = useRef(INITIAL_PADS);
  const selectedChannelRef = useRef(0);
  const selectedBankRef = useRef<'A' | 'B'>('A');

  // Sync Refs
  useEffect(() => { knobsRef.current = knobs; }, [knobs]);
  useEffect(() => { padsRef.current = pads; }, [pads]);
  useEffect(() => { selectedChannelRef.current = selectedChannel; }, [selectedChannel]);
  useEffect(() => { selectedBankRef.current = selectedBank; }, [selectedBank]);

  // --- Audio Synchronization ---
  useEffect(() => {
      if (audio.isReady) {
          channelDataRef.current.forEach((channelVals, chIdx) => {
              channelVals.forEach((val, knobIdx) => {
                  audio.updateKnobParam(chIdx, knobIdx, val);
              });
          });
      }
  }, [audio.isReady, audio.updateKnobParam]);

  // Sync Delay Effect
  useEffect(() => {
    if (!audio.isReady) return;
    
    let seconds = 0.5;
    const v = delayTimeVal;
    
    if (delaySnap) {
        // Base 120BPM = 0.5s per beat
        const divisions = [0.0625, 0.125, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0];
        const index = Math.min(7, Math.floor(v / 16));
        seconds = divisions[index];
    } else {
        // Linear: 1ms to 2000ms
         seconds = 0.001 + (v / 127) * 1.999;
    }
    
    audio.updateGlobalDelayTime(seconds);
  }, [delayTimeVal, delaySnap, audio.isReady, audio.updateGlobalDelayTime]);

  // Sync Reverb Effect
  useEffect(() => {
    if (!audio.isReady) return;
    
    // Debouncing could be added here if performance issues arise with Convolver generation
    const timer = setTimeout(() => {
        audio.updateReverbSize(reverbSizeVal);
    }, 50);

    return () => clearTimeout(timer);
  }, [reverbSizeVal, audio.isReady, audio.updateReverbSize]);


  // --- Actions ---

  // 1. SELECT CHANNEL: Updates knobs for the Mixer view.
  // DECOUPLED: Does NOT change the selected Pad.
  const selectChannel = useCallback((channelIdx: number) => {
      setSelectedChannel(channelIdx);
      
      // Update Knobs for Mixer
      const newValues = channelDataRef.current[channelIdx];
      setKnobs(prev => prev.map((k, i) => ({ ...k, value: newValues[i] })));
  }, []);

  // 2. SELECT BANK: Updates Bank for the Pad Grid view.
  // DECOUPLED: Does NOT change the selected Pad or Channel.
  const selectBank = useCallback((bank: 'A' | 'B') => {
      setSelectedBank(bank);
      // We must update the ref manually here because state update is async 
      // and we need the new bank for calculations immediately if chained
      selectedBankRef.current = bank; 
  }, []);

  // 3. SELECT PAD: Updates Pad ID only
  const selectPad = useCallback((padId: number) => {
      setSelectedPadId(padId);
      // NOTE: Removed automatic channel/bank switching here.
      // Clicking a pad should not hijack the mixer controls from the currently selected channel.
  }, []);

  const updateKnob = useCallback((id: number, value: number) => {
    const currentChannel = selectedChannelRef.current;

    // Optimistically update refs for immediate audio response
    channelDataRef.current[currentChannel][id] = value;
    audio.updateKnobParam(currentChannel, id, value);

    // Update UI
    setKnobs(prev => {
        const current = prev.find(k => k.id === id);
        if (current && current.value === value) return prev;
        return prev.map(k => k.id === id ? { ...k, value } : k);
    });
  }, [audio]);

  const updatePadEnvelope = useCallback((padId: number, envelope: Partial<EnvelopeData>) => {
      setPads(prev => prev.map(p => p.id === padId ? { 
          ...p, 
          envelope: { ...p.envelope, ...envelope } 
      } : p));
  }, []);

  const triggerPad = useCallback((id: number, velocity: number = 127) => {
    const channelId = id % 8; 
    const pad = padsRef.current.find(p => p.id === id);

    if (pad) {
        let finalVelocity = velocity;
        switch (pad.velocityMode) {
            case 'max': finalVelocity = 127; break;
            case 'mid': finalVelocity = 64; break;
            case 'min': finalVelocity = 40; break; 
            case 'dynamic': default: finalVelocity = velocity; break;
        }

        if (pad.buffer) {
            audio.playSample(pad.buffer, channelId, finalVelocity, pad.envelope);
        }
        
        // Trigger Animation
        setPads(prev => prev.map(p => p.id === id ? { ...p, isTriggered: true } : p));
        setTimeout(() => {
            setPads(prev => prev.map(p => p.id === id ? { ...p, isTriggered: false } : p));
        }, 100);
    }
  }, [audio]);

  const loadSampleToPad = useCallback(async (id: number, file: File) => {
    try {
        const buffer = await audio.loadSample(file);
        setPads(prev => prev.map(p => p.id === id ? { 
            ...p, 
            buffer: buffer, 
            name: file.name, 
            sampleUrl: 'loaded' 
        } : p));
    } catch (e) {
        console.error("Failed to load sample", e);
        // User notification could go here
    }
  }, [audio]);

  const importToLibrary = useCallback(async (files: FileList) => {
     if (!audio.isReady) audio.initAudio();
     
     const newSamples: LibrarySample[] = [];
     for (let i = 0; i < files.length; i++) {
         const file = files[i];
         try {
             const buffer = await audio.loadSample(file);
             newSamples.push({
                 id: crypto.randomUUID(),
                 name: file.name,
                 date: Date.now(),
                 buffer: buffer
             });
         } catch(e) {
             console.error(`Failed to load ${file.name}`, e);
         }
     }
     setLibrary(prev => [...prev, ...newSamples]);
  }, [audio]);

  const assignSampleToPad = useCallback((padId: number, sampleId: string) => {
      // Use functional state update to access latest library if needed, 
      // but here we depend on 'library' in deps.
      const sample = library.find(s => s.id === sampleId);
      if (sample) {
          setPads(prev => prev.map(p => p.id === padId ? {
              ...p,
              buffer: sample.buffer,
              name: sample.name,
              sampleUrl: 'library'
          } : p));
      }
  }, [library]);

  const handleContextAction = useCallback((action: string, payload: any) => {
      switch(action) {
          case 'forgetMidi':
              setPads(prev => prev.map(p => p.id === payload.id ? { ...p, note: -1, cc: undefined, triggerType: 'note' } : p));
              break;
          case 'removeSample':
              setPads(prev => prev.map(p => p.id === payload.id ? { ...p, buffer: null, sampleUrl: null, name: `Pad ${p.id + 1}` } : p));
              break;
          case 'setVelocityMode':
              setPads(prev => prev.map(p => p.id === payload.id ? { ...p, velocityMode: payload.mode } : p));
              break;
          case 'resetKnob':
              const def = KNOB_DEFAULTS.find((_, i) => i === payload.id);
              if (def) updateKnob(payload.id, def.val);
              break;
          case 'forgetMidiKnob':
              setKnobs(prev => prev.map(k => k.id === payload.id ? { ...k, cc: -1 } : k));
              break;
          case 'castToPad':
              assignSampleToPad(payload.padId, payload.sampleId);
              break;
          case 'removeLibrarySample':
              setLibrary(prev => prev.filter(s => s.id !== payload.id));
              break;
      }
  }, [updateKnob, assignSampleToPad]);

  // Wrap the return object in useMemo so it is stable across renders unless data changes.
  return useMemo(() => ({
    pads, setPads,
    knobs, setKnobs,
    library,
    selectedChannel,
    selectedBank, 
    selectedPadId, 
    delayTimeVal, setDelayTimeVal,
    delaySnap, setDelaySnap,
    reverbSizeVal, setReverbSizeVal,
    
    selectChannel,
    selectBank,
    selectPad,
    
    updateKnob,
    updatePadEnvelope,
    triggerPad,
    loadSampleToPad,
    importToLibrary,
    assignSampleToPad,
    handleContextAction,
    
    // Stable Refs for Event Processors
    refs: {
        pads: padsRef,
        knobs: knobsRef,
        selectedChannel: selectedChannelRef,
        selectedBank: selectedBankRef
    }
  }), [
    pads, knobs, library, selectedChannel, selectedBank, selectedPadId, delayTimeVal, delaySnap, reverbSizeVal,
    selectChannel, selectBank, selectPad, updateKnob, updatePadEnvelope, triggerPad, loadSampleToPad, importToLibrary, assignSampleToPad, handleContextAction
  ]);
};
