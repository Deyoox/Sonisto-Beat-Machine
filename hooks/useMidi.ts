import { useState, useEffect, useCallback, useRef } from 'react';

type MidiCallback = (command: number, note: number, velocity: number) => void;

export const useMidi = (onMidiMessage: MidiCallback) => {
  // Use 'any' for MIDI types to avoid TS lib issues
  const [midiAccess, setMidiAccess] = useState<any | null>(null);
  const [inputs, setInputs] = useState<any[]>([]);
  
  // Store callback in ref to avoid re-binding listeners on every state change
  const callbackRef = useRef(onMidiMessage);

  useEffect(() => {
    callbackRef.current = onMidiMessage;
  }, [onMidiMessage]);

  const handleMidiMessage = useCallback((event: any) => {
    const { data } = event;
    if (!data || data.length < 3) return;

    const [command, note, velocity] = data;
    // Invoke the latest callback from ref
    if (callbackRef.current) {
      callbackRef.current(command, note, velocity);
    }
  }, []);

  useEffect(() => {
    const nav = navigator as any;
    if (!nav.requestMIDIAccess) {
      console.warn("Web MIDI API not supported in this browser.");
      return;
    }

    nav.requestMIDIAccess().then(
      (access: any) => {
        setMidiAccess(access);
        const inputList = Array.from(access.inputs.values());
        setInputs(inputList);

        access.onstatechange = (e: any) => {
           const updatedInputs = Array.from(access.inputs.values());
           setInputs(updatedInputs);
        };
      },
      (err: any) => console.error("Could not access MIDI devices.", err)
    );
  }, []); // Mount only

  // Bind listeners only when inputs list changes, NOT when callback changes
  useEffect(() => {
    if(!midiAccess) return;
    
    // Clean up old listeners if necessary (though strictly with closure ref it's okay)
    // For simplicity with Web MIDI, we just re-assign. 
    // Since handleMidiMessage is stable (no deps), this effect only runs when inputs/midiAccess change.
    
    const currentInputs = Array.from(midiAccess.inputs.values());
    currentInputs.forEach((input: any) => {
        // Remove existing to be safe, though usually overwriting works
        input.onmidimessage = handleMidiMessage;
    });

    return () => {
      currentInputs.forEach((input: any) => {
        input.onmidimessage = null;
      });
    };
  }, [inputs, midiAccess, handleMidiMessage]);

  return { inputs };
};