import React, { useState } from 'react';
import { PadData, KnobData, LibrarySample, EnvelopeData } from '../types';
import { Knob } from './Knob';
import { Pad } from './Pad';
import { SampleLibrary } from './SampleLibrary';
import { SamplerEditor } from './SamplerEditor';
import { Visualizer } from './Visualizer';
import { Radio, Clock, Sliders, Disc, Grid3x3, Settings2 } from 'lucide-react';

interface ControllerProps {
  pads: PadData[];
  knobs: KnobData[];
  librarySamples: LibrarySample[];
  onKnobChange: (id: number, value: number) => void;
  onPadTrigger: (id: number) => void;
  onLoadSample: (id: number, file: File) => void;
  onAssignLibrarySample: (padId: number, sampleId: string) => void;
  onLibraryImport: (files: FileList) => void;
  onLibraryPreview: (buffer: AudioBuffer) => void;
  learnMode: boolean;
  onToggleLearn: () => void;
  learnTarget: { type: 'pad' | 'knob', id: number } | null;
  onSetLearnTarget: (target: { type: 'pad' | 'knob', id: number } | null) => void;
  selectedChannel: number;
  onSelectChannel: (channel: number) => void;
  onContextMenu: (e: React.MouseEvent, type: 'pad' | 'knob' | 'library', id: number | string) => void;
  selectedBank: 'A' | 'B';
  onSelectBank: (bank: 'A' | 'B') => void;
  delayTimeVal: number;
  onDelayTimeChange: (val: number) => void;
  delaySnap: boolean;
  onToggleDelaySnap: () => void;
  reverbSizeVal: number;
  onReverbSizeChange: (val: number) => void;
  selectedPadId: number;
  onSelectPadId: (id: number) => void;
  onUpdateEnvelope: (padId: number, envelope: Partial<EnvelopeData>) => void;
  analyserNode: AnalyserNode | null;
}

export const Controller: React.FC<ControllerProps> = React.memo(({ 
  pads, 
  knobs, 
  librarySamples,
  onKnobChange, 
  onPadTrigger, 
  onLoadSample,
  onAssignLibrarySample,
  onLibraryImport,
  onLibraryPreview,
  learnMode,
  onToggleLearn,
  learnTarget,
  onSetLearnTarget,
  selectedChannel,
  onSelectChannel,
  onContextMenu,
  selectedBank,
  onSelectBank,
  delayTimeVal,
  onDelayTimeChange,
  delaySnap,
  onToggleDelaySnap,
  reverbSizeVal,
  onReverbSizeChange,
  selectedPadId,
  onSelectPadId,
  onUpdateEnvelope,
  analyserNode
}) => {
  
  const [activeTab, setActiveTab] = useState<'MIXER' | 'SAMPLER'>('MIXER');

  // Filter pads based on active bank (8 pads per bank)
  const bankOffset = selectedBank === 'A' ? 0 : 8;
  const activePads = pads.slice(bankOffset, bankOffset + 8);

  const topRow = activePads.slice(4, 8);
  const bottomRow = activePads.slice(0, 4);

  // Time Divisions for Visual Display
  const getTimeDisplay = (val: number, isSnap: boolean) => {
      if (isSnap) {
          const divisions = ['1/32', '1/16', '1/8', '1/4', '3/8', '1/2', '3/4', '1/1'];
          const idx = Math.min(7, Math.floor(val / 16));
          return divisions[idx];
      }
      const ms = 1 + (val / 127) * 1999;
      return `${Math.round(ms)}ms`;
  };

  const getSizeDisplay = (val: number) => {
      const sec = 0.1 + (val / 127) * 4.9;
      return `${sec.toFixed(1)}s`;
  }

  const Screw = ({ className }: { className?: string }) => (
    <div className={`w-3 h-3 rounded-full bg-main shadow-[inset_1px_1px_2px_var(--shadow-dark),inset_-1px_-1px_2px_var(--shadow-light)] flex items-center justify-center border border-gray-500/30 opacity-60 ${className}`}>
        <div className="w-1.5 h-[1px] bg-text-light/50 rotate-45 transform"></div>
        <div className="absolute w-1.5 h-[1px] bg-text-light/50 -rotate-45 transform"></div>
    </div>
  );

  return (
    <div className="relative flex flex-col items-center justify-center w-full p-2">
      
      {/* Device Body - Locked Height Globally (Reduced Size) */}
      <div className="relative w-full max-w-[1250px] bg-main rounded-[24px] p-5 md:p-6 shadow-plate border-t border-white/40 select-none transition-all duration-300 flex flex-col h-[720px] min-h-[720px] max-h-[720px] overflow-hidden">
        
        {/* Physical Screws (Outer Chassis) */}
        <Screw className="absolute top-3 left-3" />
        <Screw className="absolute top-3 right-3" />
        <Screw className="absolute bottom-3 left-3" />
        <Screw className="absolute bottom-3 right-3" />

        {/* Branding & Header & Screen */}
        <div className="flex flex-col xl:flex-row justify-between items-center mb-4 pl-2 pr-2 gap-4 xl:gap-0 shrink-0 w-full relative z-20">
            {/* Left: Branding */}
            <div className="flex items-center gap-3 xl:w-1/3">
                 <div className="w-10 h-10 rounded-lg bg-[#222] shadow-soft-out flex items-center justify-center text-orange-500 border-t border-white/10 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    <span className="font-black text-xl tracking-tighter relative z-10">S</span>
                 </div>
                 <div className="flex flex-col justify-center h-full">
                    <h1 className="text-lg font-bold tracking-tight text-text-main leading-none">SONISTO</h1>
                    <span className="text-[9px] font-bold tracking-[0.3em] text-text-light uppercase">Pro Control Surface</span>
                 </div>
            </div>

            {/* Center: Visualizer (Embedded Screen) */}
            <div className="w-full max-w-[380px] shrink-0 xl:w-1/3 flex justify-center">
                <Visualizer analyser={analyserNode} />
            </div>
            
            {/* Right: Controls */}
            <div className="flex items-center gap-4 xl:w-1/3 justify-end">
               
               {/* VIEW TOGGLE */}
               <div className="flex items-center bg-main rounded-xl p-1 shadow-soft-in border-b border-white/50">
                   <button
                        onClick={() => setActiveTab('MIXER')}
                        className={`
                           flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all
                           ${activeTab === 'MIXER' 
                             ? 'bg-text-main text-main shadow-lg' 
                             : 'text-text-light hover:text-text-main'}
                        `}
                     >
                        <Disc size={12} /> Mixer
                     </button>
                     <button
                        onClick={() => setActiveTab('SAMPLER')}
                        className={`
                           flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all
                           ${activeTab === 'SAMPLER' 
                             ? 'bg-text-main text-main shadow-lg' 
                             : 'text-text-light hover:text-text-main'}
                        `}
                     >
                        <Sliders size={12} /> Sampler
                     </button>
               </div>

               <div className="hidden md:block w-[1px] h-6 bg-text-light/20"></div>

               <button 
                  onClick={onToggleLearn}
                  className={`
                      flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all duration-200 border border-transparent
                      ${learnMode 
                          ? 'text-orange-500 bg-main shadow-soft-in border-orange-500/20' 
                          : 'text-text-light bg-main shadow-soft-out hover:text-text-main hover:-translate-y-0.5 border-white/10'}
                  `}
              >
                  <Radio size={12} className={learnMode ? "animate-pulse" : ""} />
                  {learnMode ? 'MIDI Learn' : 'Map MIDI'}
              </button>
            </div>
        </div>

        {/* Main Interface Area - 3 Column Layout */}
        <div className="flex flex-col xl:flex-row gap-4 relative z-10 px-1 items-stretch flex-1 min-h-0">
            
            {/* 1. LIBRARY MODULE */}
            <div className="xl:w-[250px] xl:min-w-[250px] flex flex-col h-full">
               <SampleLibrary 
                  samples={librarySamples} 
                  onImport={onLibraryImport} 
                  onPreview={onLibraryPreview}
                  onContextMenu={onContextMenu}
               />
            </div>
            
            {/* 2. PADS MODULE (CENTER) */}
            <div className="flex-1 min-w-[460px] bg-main rounded-2xl shadow-soft-out border border-white/20 p-5 flex flex-col relative group z-10">
                 
                 {/* Module Decoration */}
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50"></div>
                 <Screw className="absolute top-2 left-2 opacity-30 scale-75" />
                 <Screw className="absolute top-2 right-2 opacity-30 scale-75" />
                 <Screw className="absolute bottom-2 left-2 opacity-30 scale-75" />
                 <Screw className="absolute bottom-2 right-2 opacity-30 scale-75" />

                 {/* Module Header */}
                 <div className="flex justify-between items-center mb-4 pl-1 pr-1">
                    <div className="flex items-center gap-2 text-text-light">
                        <Grid3x3 size={14} />
                        <span className="text-[9px] font-bold tracking-[0.25em] uppercase">Trigger Matrix</span>
                    </div>
                    {/* Bank Indicators */}
                    <div className="flex gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${selectedBank === 'A' ? 'bg-orange-500 shadow-led-glow' : 'bg-gray-600'}`}></div>
                        <div className={`w-1.5 h-1.5 rounded-full ${selectedBank === 'B' ? 'bg-orange-500 shadow-led-glow' : 'bg-gray-600'}`}></div>
                    </div>
                 </div>

                 <div className="flex-1 flex flex-col items-center justify-center gap-5">
                    {/* Recessed Pad Area - Visible Overflow for Tooltips */}
                    <div className="p-5 bg-main shadow-soft-in rounded-2xl border border-white/5 w-full max-w-[540px] flex flex-col gap-4 overflow-visible z-20">
                        <div className="grid grid-cols-4 gap-4 w-full">
                            {topRow.map((pad) => (
                                <Pad 
                                    key={pad.id} 
                                    data={pad} 
                                    onTrigger={() => {
                                        onPadTrigger(pad.id);
                                        if (activeTab === 'SAMPLER') onSelectPadId(pad.id);
                                    }} 
                                    onLoadSample={onLoadSample}
                                    onAssignLibrarySample={onAssignLibrarySample}
                                    learnMode={learnMode}
                                    isSelected={(learnTarget?.type === 'pad' && learnTarget.id === pad.id) || (activeTab === 'SAMPLER' && selectedPadId === pad.id)}
                                    onSelect={() => {
                                        if (learnMode) onSetLearnTarget({ type: 'pad', id: pad.id });
                                        else onSelectPadId(pad.id);
                                    }}
                                    onContextMenu={onContextMenu}
                                />
                            ))}
                        </div>
                        <div className="grid grid-cols-4 gap-4 w-full">
                            {bottomRow.map((pad) => (
                                <Pad 
                                    key={pad.id} 
                                    data={pad} 
                                    onTrigger={() => {
                                        onPadTrigger(pad.id);
                                        if (activeTab === 'SAMPLER') onSelectPadId(pad.id);
                                    }} 
                                    onLoadSample={onLoadSample}
                                    onAssignLibrarySample={onAssignLibrarySample}
                                    learnMode={learnMode}
                                    isSelected={(learnTarget?.type === 'pad' && learnTarget.id === pad.id) || (activeTab === 'SAMPLER' && selectedPadId === pad.id)}
                                    onSelect={() => {
                                        if (learnMode) onSetLearnTarget({ type: 'pad', id: pad.id });
                                        else onSelectPadId(pad.id);
                                    }}
                                    onContextMenu={onContextMenu}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="w-full max-w-[540px] flex justify-between items-end px-1">
                        {/* Bank Selectors */}
                        <div className="flex gap-2">
                            {['A', 'B'].map((bank) => (
                                <button 
                                    key={bank}
                                    onClick={() => onSelectBank(bank as 'A' | 'B')}
                                    className={`
                                        h-7 px-3 rounded-lg text-[8px] font-bold tracking-widest transition-all duration-200 border 
                                        ${selectedBank === bank 
                                            ? 'bg-main shadow-soft-in text-orange-500 scale-95 border-orange-500/20' 
                                            : 'bg-main shadow-soft-out text-text-light hover:text-text-main hover:-translate-y-0.5 border-transparent'
                                        }
                                    `}
                                >
                                    BANK {bank}
                                </button>
                            ))}
                        </div>

                        {/* Channel Selector */}
                        <div className="flex items-center gap-2 bg-main shadow-soft-in rounded-lg p-1 border border-white/5">
                             <div className="text-[8px] font-bold text-text-light px-1.5">CH</div>
                             <div className="flex gap-0.5">
                                {Array.from({length: 8}, (_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => onSelectChannel(i)}
                                        className={`
                                            w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold font-mono transition-all duration-200
                                            ${selectedChannel === i 
                                                ? 'bg-orange-500 text-white shadow-lg' 
                                                : 'bg-main hover:bg-black/5 text-text-light'
                                            }
                                        `}
                                    >
                                        {i + 1 + bankOffset}
                                    </button>
                                ))}
                             </div>
                        </div>
                    </div>
                 </div>
            </div>

            {/* 3. CONTROLS MODULE (RIGHT) */}
            <div className="w-full xl:w-[340px] xl:min-w-[340px] bg-main rounded-2xl shadow-soft-out border border-white/20 p-5 flex flex-col relative overflow-hidden">
                <Screw className="absolute top-2 left-2 opacity-30 scale-75" />
                <Screw className="absolute top-2 right-2 opacity-30 scale-75" />
                <Screw className="absolute bottom-2 left-2 opacity-30 scale-75" />
                <Screw className="absolute bottom-2 right-2 opacity-30 scale-75" />

                {/* Module Header */}
                <div className="flex justify-between items-center mb-4 pl-1 pr-1 shrink-0">
                    <div className="flex items-center gap-2 text-text-light">
                        <Settings2 size={14} />
                        <span className="text-[9px] font-bold tracking-[0.25em] uppercase">
                            {activeTab === 'MIXER' ? 'Mixer Control' : 'Sampler Engine'}
                        </span>
                    </div>
                </div>
                
                {/* Content Area - Fits exactly in the container */}
                <div className="flex-1 relative flex flex-col">
                    {activeTab === 'MIXER' ? (
                        <div className="flex-1 content-center bg-main shadow-soft-in rounded-xl border border-black/5 mx-auto w-full relative">
                            {/* 2 Vertical Columns of Knobs - Centered and tighter */}
                            <div className="grid grid-cols-[auto_auto] gap-x-8 gap-y-6 p-4 justify-center h-full content-center">
                                {knobs.map((knob) => {
                                    const isRev = knob.label === 'REV'; // Index 4
                                    const isDly = knob.label === 'DLY'; // Index 5
                                    
                                    return (
                                        <div key={knob.id} className="relative flex items-center justify-center">
                                            {/* REV SIDE KNOB (LEFT) */}
                                            {isRev && (
                                                <div className="absolute right-full mr-3 flex flex-col items-center z-10">
                                                    <span className="text-[6px] font-bold text-gray-400 mb-0.5 tracking-wider">SIZE</span>
                                                    <Knob 
                                                        data={{ id: 998, label: '', value: reverbSizeVal, cc: -1 }} 
                                                        onChange={(_, val) => onReverbSizeChange(val)}
                                                        learnMode={false} 
                                                        isSelected={false} 
                                                        onSelect={()=>{}} 
                                                        onContextMenu={(e)=>e.preventDefault()}
                                                        size="small"
                                                    />
                                                </div>
                                            )}

                                            <Knob 
                                                data={knob} 
                                                onChange={onKnobChange} 
                                                learnMode={learnMode}
                                                isSelected={learnTarget?.type === 'knob' && learnTarget.id === knob.id}
                                                onSelect={() => onSetLearnTarget({ type: 'knob', id: knob.id })}
                                                onContextMenu={onContextMenu}
                                                size="normal"
                                            />

                                            {/* DELAY SIDE KNOB (RIGHT) */}
                                            {isDly && (
                                                <div className="absolute left-full ml-3 flex flex-col items-center z-10">
                                                     <span className="text-[6px] font-bold text-gray-400 mb-0.5 tracking-wider">TIME</span>
                                                     <Knob 
                                                        data={{ id: 999, label: '', value: delayTimeVal, cc: -1 }} 
                                                        onChange={(_, val) => onDelayTimeChange(val)}
                                                        learnMode={false} 
                                                        isSelected={false} 
                                                        onSelect={()=>{}} 
                                                        onContextMenu={(e)=>e.preventDefault()}
                                                        size="small"
                                                        valueDisplay={getTimeDisplay(delayTimeVal, delaySnap)}
                                                     />
                                                     {/* Sync Toggle Button */}
                                                     <button 
                                                        onClick={onToggleDelaySnap}
                                                        className={`
                                                            mt-1 text-[7px] font-bold px-1 py-0.5 rounded border transition-all
                                                            ${delaySnap 
                                                                ? 'bg-orange-500 text-white border-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]' 
                                                                : 'bg-transparent text-gray-500 border-gray-400/30 hover:text-gray-300 hover:border-gray-400'}
                                                        `}
                                                     >
                                                        SYNC
                                                     </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full bg-main shadow-soft-in rounded-xl border border-black/5 p-2">
                            <SamplerEditor 
                                pad={pads.find(p => p.id === selectedPadId)} 
                                onEnvelopeChange={onUpdateEnvelope}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
    return prev.pads === next.pads && 
           prev.knobs === next.knobs && 
           prev.selectedChannel === next.selectedChannel &&
           prev.selectedBank === next.selectedBank &&
           prev.selectedPadId === next.selectedPadId &&
           prev.learnMode === next.learnMode &&
           prev.learnTarget === next.learnTarget &&
           prev.activeTab === next.activeTab &&
           prev.delayTimeVal === next.delayTimeVal &&
           prev.delaySnap === next.delaySnap &&
           prev.reverbSizeVal === next.reverbSizeVal &&
           prev.librarySamples === next.librarySamples; 
});