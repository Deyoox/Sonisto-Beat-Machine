import { useState, useCallback, useEffect, useRef } from 'react';
import { useMidi } from './useMidi';
import { useInstrument } from './useInstrument';
import { KEYBOARD_MAP } from '../constants';

export const useMidiProcessor = (instrument: ReturnType<typeof useInstrument>) => {
  const [learnMode, setLearnMode] = useState(false);
  const [learnTarget, setLearnTarget] = useState<{ type: 'pad' | 'knob', id: number } | null>(null);
  
  const [midiDebug, setMidiDebug] = useState<{
    cmd: number; 
    data1: number; 
    data2: number; 
    raw: string;
    type: string;
    action: string;
    timestamp: number;
  } | null>(null);

  // Destructure stable functions and refs from instrument to use in effects
  const { 
      refs, 
      setPads, 
      setKnobs, 
      triggerPad, 
      updateKnob, 
      selectChannel 
  } = instrument;

  // Refs for learn state to avoid stale closures without re-binding listeners
  const learnStateRef = useRef({ mode: learnMode, target: learnTarget });
  useEffect(() => { learnStateRef.current = { mode: learnMode, target: learnTarget }; }, [learnMode, learnTarget]);

  const onMidiMessage = useCallback((command: number, data1: number, data2: number) => {
    const status = command & 0xF0;
    const isNoteOn = (status === 0x90 && data2 > 0);
    const isCC = (status === 0xB0);

    let type = "UNKNOWN";
    let action = "IGNORED";

    const { mode, target } = learnStateRef.current;
    
    // --- MIDI LEARN LOGIC ---
    if (mode && target) {
        if (isNoteOn && target.type === 'pad') {
            setPads(prev => prev.map(p => p.id === target.id ? { ...p, note: data1, triggerType: 'note', cc: undefined } : p));
            setLearnTarget(null);
            action = `MAPPED PAD ${target.id + 1}`;
        } else if (isCC) {
            if (target.type === 'pad') {
                setPads(prev => prev.map(p => p.id === target.id ? { ...p, cc: data1, triggerType: 'cc', note: -1 } : p));
                setLearnTarget(null);
                action = `MAPPED PAD ${target.id + 1}`;
            } else if (target.type === 'knob') {
                setKnobs(prev => prev.map(k => k.id === target.id ? { ...k, cc: data1 } : k));
                setLearnTarget(null);
                action = `MAPPED KNOB ${target.id + 1}`;
            }
        }
        if (action !== "IGNORED") {
            setMidiDebug({ cmd: command, data1, data2, raw: `[${command},${data1}]`, type: isNoteOn ? "NOTE" : "CC", action, timestamp: Date.now() });
            return; 
        }
    }

    let padTriggered = false;
    // Use refs to check current mapping without re-rendering this callback
    const currentPads = refs.pads.current;
    const currentKnobs = refs.knobs.current;
    const currentChannel = refs.selectedChannel.current;
    
    // --- PLAY MODE LOGIC ---
    if (isNoteOn) {
        type = "NOTE";
        const pad = currentPads.find(p => p.triggerType === 'note' && p.note === data1);
        if (pad) {
            action = `TRIG PAD ${pad.id + 1}`;
            triggerPad(pad.id, data2);
            padTriggered = true;
        }
    } else if (isCC) {
        type = "CC";
        
        // Check if CC is mapped to trigger a pad
        const pad = currentPads.find(p => p.triggerType === 'cc' && p.cc === data1);
        if (pad && data2 > 64) { 
             action = `TRIG PAD ${pad.id + 1}`;
             triggerPad(pad.id, 127); 
             padTriggered = true;
        }
        
        if (!padTriggered) {
             // Check knobs
             const knob = currentKnobs.find(k => k.cc === data1);
             if (knob) {
                 action = `CH${currentChannel + 1} FX: ${knob.label}`;
                 updateKnob(knob.id, data2);
             }
        }
    }

    setMidiDebug({
        cmd: command,
        data1,
        data2,
        raw: `[${command}, ${data1}, ${data2}]`,
        type,
        action,
        timestamp: Date.now()
    });

  }, [refs, setPads, setKnobs, triggerPad, updateKnob]);

  const { inputs } = useMidi(onMidiMessage);

  // Keyboard Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Prevent key repeating (holding down key) from re-triggering samples too fast if not desired,
        // and check learnMode from ref to avoid dependency issue if we wanted to use effect deps,
        // but here we check state.
        if (e.repeat || learnStateRef.current.mode) return; 
        
        const key = e.key.toLowerCase();
        
        // Keyboard Shortcuts for Channel Selection (1-8)
        const intKey = parseInt(key);
        if (!isNaN(intKey) && intKey >= 1 && intKey <= 8) {
            selectChannel(intKey - 1);
            return;
        }

        // Map keys relative to current Bank
        if (KEYBOARD_MAP[key] !== undefined) {
            const offset = refs.selectedBank.current === 'A' ? 0 : 8;
            triggerPad(KEYBOARD_MAP[key] + offset, 127);
        }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectChannel, triggerPad, refs]); // Depend only on stable functions and refs

  return {
    inputs,
    learnMode,
    setLearnMode,
    learnTarget,
    setLearnTarget,
    midiDebug
  };
};