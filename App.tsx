import React, { useState, useEffect } from 'react';
import { Controller } from './components/Controller';
import { useAudio } from './hooks/useAudio';
import { useInstrument } from './hooks/useInstrument';
import { useMidiProcessor } from './hooks/useMidiProcessor';
import { Power, Info } from 'lucide-react';
import { ThemeToggle } from './components/ThemeToggle';
import { ContextMenu } from './components/ContextMenu';
import { InfoModal } from './components/InfoModal';

const App: React.FC = () => {
  // --- Composition Layer ---
  
  // 1. Audio Engine
  const audio = useAudio();
  
  // 2. Instrument Logic (State & Actions)
  const instrument = useInstrument(audio);
  
  // 3. Input Processing (MIDI & Keyboard)
  const instrumentMidi = useMidiProcessor(instrument);

  // --- UI State ---
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    type: 'pad' | 'knob' | 'library';
    targetId: number | string;
  } | null>(null);

  // Theme Toggle Effect
  useEffect(() => {
     if (isDarkMode) {
         document.documentElement.setAttribute('data-theme', 'dark');
     } else {
         document.documentElement.removeAttribute('data-theme');
     }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  // Context Menu Handler
  const openContextMenu = (e: React.MouseEvent, type: 'pad' | 'knob' | 'library', id: number | string) => {
      e.preventDefault();
      setContextMenu({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          type,
          targetId: id
      });
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative bg-main text-text-main" onClick={() => {}}>
      
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(var(--text-light)_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none transition-opacity duration-300"></div>

      {/* Initial Start Screen */}
      {!audio.isReady && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-main/90 backdrop-blur-sm transition-all" onClick={audio.initAudio}>
            <div className="relative group cursor-pointer">
                <div className="relative bg-main p-12 rounded-[3rem] shadow-plate text-center border border-white/10">
                    <div className="w-20 h-20 rounded-full bg-main shadow-soft-out flex items-center justify-center mx-auto mb-8 text-text-light group-hover:scale-105 group-hover:text-orange-500 transition-all duration-300">
                        <Power className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-text-main tracking-[0.2em] mb-2 uppercase">System Off</h2>
                    <p className="text-text-light font-mono text-xs uppercase tracking-widest">Tap to Power On</p>
                </div>
            </div>
        </div>
      )}

      {/* Main UI */}
      <div className="w-full max-w-[1250px] flex flex-col items-center gap-4 relative z-10">
        
         {/* Top Info Bar */}
         <div className="w-full flex justify-between items-center px-4">
             <div className="flex gap-4 items-center">
                 <div className="text-[10px] font-bold text-text-light tracking-widest uppercase writing-mode-vertical">
                    v0.3.4 PROTOTYPE
                 </div>
                 <div className={`
                    flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded bg-main shadow-soft-in
                    ${instrumentMidi.inputs.length > 0 ? 'text-green-600' : 'text-red-400'}
                    max-w-[250px]
                 `}>
                     <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${instrumentMidi.inputs.length > 0 ? 'bg-green-500' : 'bg-red-500'} shadow-led-glow`}></div>
                     <span className="truncate">
                        {instrumentMidi.inputs.length > 0 
                            ? (instrumentMidi.inputs[0].name || 'Unknown Device') + (instrumentMidi.inputs.length > 1 ? ` +${instrumentMidi.inputs.length - 1}` : '')
                            : 'NO DEVICE'}
                     </span>
                 </div>
             </div>

             <div className="flex items-center gap-4">
                {/* MIDI Debug Monitor */}
                <div className="font-mono text-[9px] h-8 flex items-center gap-4 text-text-light bg-main px-4 rounded shadow-soft-in border border-white/10 min-w-[300px] justify-between">
                    {instrumentMidi.midiDebug ? (
                        <>
                            <div className="flex gap-2">
                                <span className="font-bold text-text-main">{instrumentMidi.midiDebug.type}</span>
                                <span>CH:{instrumentMidi.midiDebug.cmd & 0x0F}</span>
                                <span>D1:{instrumentMidi.midiDebug.data1}</span>
                                <span>D2:{instrumentMidi.midiDebug.data2}</span>
                            </div>
                            <span className={instrumentMidi.midiDebug.action.includes('MAPPED') ? 'text-green-600 font-bold' : 'text-orange-500 font-bold'}>
                                {instrumentMidi.midiDebug.action}
                            </span>
                        </>
                    ) : (
                        <span className="opacity-40">WAITING FOR SIGNAL...</span>
                    )}
                </div>

                <button 
                  onClick={() => setShowInfo(true)}
                  className="w-10 h-10 rounded-full bg-main shadow-soft-out hover:shadow-soft-in hover:text-orange-500 text-text-light flex items-center justify-center transition-all border border-white/5 active:scale-95"
                  title="About"
                >
                  <Info size={18} />
                </button>

                <ThemeToggle isDark={isDarkMode} toggle={toggleTheme} />
             </div>
         </div>

         <Controller 
            // Data
            pads={instrument.pads} 
            knobs={instrument.knobs} 
            librarySamples={instrument.library}
            selectedChannel={instrument.selectedChannel}
            selectedBank={instrument.selectedBank}
            delayTimeVal={instrument.delayTimeVal}
            delaySnap={instrument.delaySnap}
            reverbSizeVal={instrument.reverbSizeVal}
            selectedPadId={instrument.selectedPadId}
            analyserNode={audio.analyserNode}

            // Actions
            onKnobChange={instrument.updateKnob} 
            onPadTrigger={(id) => instrument.triggerPad(id, 127)}
            onLoadSample={instrument.loadSampleToPad}
            onAssignLibrarySample={instrument.assignSampleToPad}
            onLibraryImport={instrument.importToLibrary}
            onLibraryPreview={audio.previewBuffer}
            onSelectChannel={instrument.selectChannel}
            onSelectBank={instrument.selectBank} 
            onDelayTimeChange={instrument.setDelayTimeVal}
            onToggleDelaySnap={() => instrument.setDelaySnap(s => !s)}
            onReverbSizeChange={instrument.setReverbSizeVal}
            onSelectPadId={instrument.selectPad} 
            onUpdateEnvelope={instrument.updatePadEnvelope}
            
            // Interaction / Learning
            learnMode={instrumentMidi.learnMode}
            onToggleLearn={() => {
                instrumentMidi.setLearnMode(!instrumentMidi.learnMode);
                instrumentMidi.setLearnTarget(null);
            }}
            learnTarget={instrumentMidi.learnTarget}
            onSetLearnTarget={instrumentMidi.setLearnTarget}
            
            // Context Menu
            onContextMenu={openContextMenu}
         />
         
         <div className="flex gap-8 text-[9px] text-text-light font-mono tracking-widest uppercase opacity-30">
             <span>Design: Sonisto Audio</span>
             <span>DSP: Loaded</span>
             <span>Ref: WIR-002</span>
         </div>
      </div>
      
      {/* Global Context Menu */}
      {contextMenu && (
          <ContextMenu 
            {...contextMenu} 
            onClose={() => setContextMenu(null)}
            onAction={instrument.handleContextAction}
            data={contextMenu.type === 'pad' ? instrument.pads.find(p => p.id === contextMenu.targetId) : undefined}
            selectedBank={instrument.selectedBank}
          />
      )}

      {/* Info Modal */}
      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
    </div>
  );
};

export default App;