import React from 'react';
import { PadData, EnvelopeData } from '../types';
import { Fader } from './Fader';
import { Activity } from 'lucide-react';

interface SamplerEditorProps {
  pad: PadData | undefined;
  onEnvelopeChange: (id: number, envelope: Partial<EnvelopeData>) => void;
}

export const SamplerEditor: React.FC<SamplerEditorProps> = ({ pad, onEnvelopeChange }) => {
  
  if (!pad) {
      return (
          <div className="h-full w-full flex items-center justify-center text-gray-400/50 font-bold uppercase tracking-widest text-xs">
              Select a Pad
          </div>
      );
  }

  const { envelope } = pad;
  const hasSample = !!pad.buffer;

  // Visualizer Helpers - Increased height for better visibility
  const height = 120; 
  
  // Create envelope path
  const aW = Math.min(80, envelope.attack * 50 + 5); 
  const dW = Math.min(80, envelope.decay * 50 + 5);
  const sW = 60;
  const rW = Math.min(80, envelope.release * 20 + 5); 
  
  const startY = height;
  const peakY = 5; 
  const susY = height - (envelope.sustain * (height - 5));
  const endY = height;

  const p1 = `0,${startY}`;
  const p2 = `${aW},${peakY}`;
  const p3 = `${aW + dW},${susY}`;
  const p4 = `${aW + dW + sW},${susY}`;
  const p5 = `${aW + dW + sW + rW},${endY}`;

  const pathD = `M ${p1} L ${p2} L ${p3} L ${p4} L ${p5}`;

  return (
    <div className="flex flex-col h-full w-full p-4 gap-6 animate-in fade-in duration-300">
        
        {/* Header Area */}
        <div className="flex justify-between items-center border-b border-gray-300/10 pb-3 shrink-0">
            <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-orange-500 text-[9px] font-bold text-white uppercase shadow-lg shadow-orange-500/20">
                    P{pad.id + 1}
                </span>
                <span className="text-xs font-bold text-text-main uppercase truncate max-w-[120px] tracking-wide">{pad.name}</span>
            </div>
            
            {!hasSample && (
                 <span className="text-[8px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1 opacity-70">
                    Empty Slot
                 </span>
            )}
        </div>

        {/* Envelope Visualizer */}
        <div className="w-full h-32 bg-[#1a1a1a] shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)] rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-center shrink-0">
             {/* Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px]"></div>

            <svg width="100%" height="100%" viewBox={`0 0 300 ${height}`} preserveAspectRatio="none" className="p-0 relative z-10">
                <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{stopColor:'rgb(249, 115, 22)', stopOpacity:0.8}} />
                        <stop offset="100%" style={{stopColor:'rgb(249, 115, 22)', stopOpacity:0.05}} />
                    </linearGradient>
                </defs>
                <path d={pathD} stroke="#f97316" strokeWidth="2.5" fill="url(#grad1)" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_4px_rgba(249,115,22,0.5)]" />
            </svg>
        </div>

        {/* Controls - Faders expand to fill remaining space */}
        <div className="flex-1 grid grid-cols-5 gap-4 items-stretch justify-center min-h-0 pb-2">
            <Fader 
                label="ATTACK" 
                value={envelope.attack} 
                min={0} max={2.0} 
                onChange={(v) => onEnvelopeChange(pad.id, { attack: v })}
                formatValue={(v) => v.toFixed(2) + 's'}
            />
            <Fader 
                label="DECAY" 
                value={envelope.decay} 
                min={0} max={2.0} 
                onChange={(v) => onEnvelopeChange(pad.id, { decay: v })}
                formatValue={(v) => v.toFixed(2) + 's'}
            />
            <Fader 
                label="SUSTAIN" 
                value={envelope.sustain} 
                min={0} max={1.0} 
                onChange={(v) => onEnvelopeChange(pad.id, { sustain: v })}
                formatValue={(v) => (v * 100).toFixed(0) + '%'}
            />
            <Fader 
                label="RELEASE" 
                value={envelope.release} 
                min={0} max={5.0} 
                onChange={(v) => onEnvelopeChange(pad.id, { release: v })}
                formatValue={(v) => v.toFixed(2) + 's'}
            />
            <Fader 
                label="TAIL" 
                value={envelope.tail} 
                min={0} max={0.5} 
                onChange={(v) => onEnvelopeChange(pad.id, { tail: v })}
                formatValue={(v) => (v * 1000).toFixed(0) + 'ms'}
            />
        </div>
    </div>
  );
};