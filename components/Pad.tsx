import React, { useRef } from 'react';
import { PadData } from '../types';

interface PadProps {
  data: PadData;
  onTrigger: (id: number) => void;
  onLoadSample: (id: number, file: File) => void;
  onAssignLibrarySample: (padId: number, sampleId: string) => void;
  learnMode: boolean;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onContextMenu: (e: React.MouseEvent, type: 'pad', id: number) => void;
}

export const Pad: React.FC<PadProps> = React.memo(({ 
  data, 
  onTrigger, 
  onLoadSample,
  onAssignLibrarySample,
  learnMode,
  isSelected,
  onSelect,
  onContextMenu
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (learnMode) {
        onSelect(data.id);
        return;
    }
    if (e.button === 0) { // Left Click
        onTrigger(data.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!learnMode) {
        onContextMenu(e, 'pad', data.id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onLoadSample(data.id, e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (learnMode) return;

    // Check for internal library drag first
    const sampleId = e.dataTransfer.getData('application/x-sonisto-sample-id');
    if (sampleId) {
        onAssignLibrarySample(data.id, sampleId);
        return;
    }

    // Fallback to OS file drop
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        if(e.dataTransfer.files[0].type.startsWith('audio/')) {
            onLoadSample(data.id, e.dataTransfer.files[0]);
        }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const isLoaded = !!data.sampleUrl;
  
  // Styles
  // Using group/pad to scope hover effects specifically to this element, avoiding conflicts with parent groups
  const baseStyle = "relative w-full aspect-square rounded-lg transition-all duration-75 select-none group/pad touch-manipulation overflow-visible";
  
  // Normal State: Soft out shadow, slight convex
  const idleStyle = "bg-main shadow-soft-out hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-soft-in";
  
  // Triggered State: Deep orange glow, inset shadow
  const triggeredStyle = "bg-orange-500/10 shadow-[inset_4px_4px_10px_rgba(0,0,0,0.5),0_0_20px_var(--accent)] border border-orange-500/50 translate-y-[1px]";
  
  const learnActive = "ring-2 ring-orange-500 ring-offset-2 ring-offset-main shadow-soft-in";
  const learnIdle = "opacity-40 grayscale shadow-soft-out cursor-alias";

  let activeClass = "";
  if (learnMode) {
      activeClass = isSelected ? learnActive : learnIdle;
  } else {
      activeClass = data.isTriggered ? triggeredStyle : idleStyle;
  }

  return (
    <div className="w-full relative z-0 hover:z-[100] shrink-0">
        <div 
            className={`${baseStyle} ${activeClass} cursor-pointer`}
            onMouseDown={handleMouseDown}
            onContextMenu={handleContextMenu}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden"
                accept="audio/*" 
                onChange={handleFileChange} 
            />

            {/* Texture overlay for rubber feel */}
            {!data.isTriggered && (
                <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none"></div>
            )}
            
            {/* Subtle Gradient Shine */}
            {!data.isTriggered && !learnMode && (
               <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
            )}

            {/* Center LED / Label Container */}
            <div className="relative z-10 w-full h-full flex items-center justify-center">
                {/* Main Label */}
                <div className={`font-mono text-xs md:text-sm font-bold tracking-tight transition-colors duration-75 ${data.isTriggered ? 'text-orange-500 scale-105' : 'text-text-light'}`}>
                    {data.name.length > 8 ? 'SAMPLE' : (data.name.startsWith('Pad') ? `PAD ${data.id + 1}` : data.name)}
                </div>

                {/* Sub Label Area - Absolute to prevent layout shift */}
                <div className="absolute bottom-3 w-full flex justify-center pointer-events-none">
                    {!isLoaded && !learnMode && (
                        <div className="text-[8px] text-text-light opacity-50 font-sans tracking-wider uppercase">Empty</div>
                    )}
                    
                    {learnMode && (
                        <span className="text-[9px] font-mono text-orange-500 font-bold bg-orange-100/90 dark:bg-orange-900/50 px-1.5 py-0.5 rounded backdrop-blur-sm shadow-sm border border-orange-500/30">
                            {data.triggerType === 'note' ? `N:${data.note}` : `CC:${data.cc}`}
                        </span>
                    )}
                </div>
            </div>

            {/* Corner LED Indicator (Active only) */}
            {data.isTriggered && (
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_2px_rgba(249,115,22,0.8)] animate-pulse"></div>
            )}

            {/* HOVER TOOLTIP */}
            {!learnMode && (
                <div className="
                    absolute bottom-[115%] left-1/2 -translate-x-1/2
                    flex flex-col items-center
                    opacity-0 group-hover/pad:opacity-100 
                    translate-y-2 group-hover/pad:translate-y-0
                    scale-95 group-hover/pad:scale-100
                    transition-all duration-200 ease-out delay-75 group-hover/pad:delay-500
                    pointer-events-none z-[100]
                ">
                    <div className="
                        relative
                        bg-main
                        p-3 rounded-xl
                        shadow-plate border border-white/20
                        flex flex-col items-center gap-1.5
                        min-w-[120px]
                    ">
                         {/* Header: Pad ID + Note */}
                         <div className="flex items-center justify-center gap-2 w-full border-b border-text-light/10 pb-1.5">
                            <span className="text-[9px] font-black text-text-light tracking-[0.2em] uppercase">
                                PAD {data.id + 1}
                            </span>
                            <div className="h-2 w-[1px] bg-text-light/20"></div>
                            <span className="text-[8px] font-mono font-bold text-orange-500">
                                {data.triggerType === 'note' ? `N:${data.note}` : `CC:${data.cc}`}
                            </span>
                         </div>

                         {/* Content: Sample Name */}
                         <div className="text-[10px] font-bold text-text-main truncate max-w-[140px] text-center leading-tight">
                             {data.sampleUrl ? data.name : <span className="text-text-light italic font-normal">No Sample</span>}
                         </div>
                         
                         {/* Footer: Velocity & Status */}
                         <div className="flex items-center gap-2 text-[8px] font-mono text-text-light uppercase tracking-tight">
                             <div className="flex items-center gap-1">
                                 <div className={`w-1 h-1 rounded-full ${data.sampleUrl ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                 <span>{data.sampleUrl ? 'RDY' : 'EMPTY'}</span>
                             </div>
                             <span className="text-gray-500">|</span>
                             <span>{data.velocityMode === 'dynamic' ? 'V:DYN' : `V:${data.velocityMode}`}</span>
                         </div>

                         {/* Decorative Triangle */}
                         <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-main border-b border-r border-white/20 transform rotate-45"></div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
}, (prev, next) => {
    return prev.data === next.data && 
           prev.isSelected === next.isSelected && 
           prev.learnMode === next.learnMode;
});