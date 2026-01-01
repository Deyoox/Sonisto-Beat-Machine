import React, { useRef } from 'react';
import { LibrarySample } from '../types';
import { Upload, Music, Play, CircleHelp, Shield, Database } from 'lucide-react';

interface SampleLibraryProps {
  samples: LibrarySample[];
  onImport: (files: FileList) => void;
  onPreview: (buffer: AudioBuffer) => void;
  onContextMenu: (e: React.MouseEvent, type: 'library', id: string) => void;
}

export const SampleLibrary: React.FC<SampleLibraryProps> = ({ samples, onImport, onPreview, onContextMenu }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragStart = (e: React.DragEvent, sample: LibrarySample) => {
    e.dataTransfer.setData('application/x-sonisto-sample-id', sample.id);
    e.dataTransfer.effectAllowed = 'copy';
    
    // Create a drag image
    const dragEl = document.createElement('div');
    dragEl.textContent = sample.name;
    dragEl.style.background = '#ff6b00';
    dragEl.style.color = 'white';
    dragEl.style.padding = '5px 10px';
    dragEl.style.borderRadius = '4px';
    dragEl.style.position = 'absolute';
    dragEl.style.top = '-1000px';
    document.body.appendChild(dragEl);
    e.dataTransfer.setDragImage(dragEl, 0, 0);
    setTimeout(() => document.body.removeChild(dragEl), 0);
  };

  const Screw = ({ className }: { className?: string }) => (
    <div className={`w-3 h-3 rounded-full bg-main shadow-[inset_1px_1px_2px_var(--shadow-dark),inset_-1px_-1px_2px_var(--shadow-light)] flex items-center justify-center border border-gray-500/30 opacity-60 ${className}`}>
        <div className="w-1.5 h-[1px] bg-text-light/50 rotate-45 transform"></div>
        <div className="absolute w-1.5 h-[1px] bg-text-light/50 -rotate-45 transform"></div>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-main rounded-2xl border border-white/20 shadow-soft-out overflow-visible p-6 relative transition-all duration-300">
      
      <Screw className="absolute top-3 left-3 opacity-30 scale-75" />
      <Screw className="absolute top-3 right-3 opacity-30 scale-75" />
      <Screw className="absolute bottom-3 left-3 opacity-30 scale-75" />
      <Screw className="absolute bottom-3 right-3 opacity-30 scale-75" />

      {/* Screen Header */}
      <div className="flex justify-between items-center mb-6 shrink-0 pl-2 pr-2">
          <div className="flex items-center gap-2">
            <Database size={14} className="text-text-light" />
            <span className="text-[10px] font-bold text-text-light tracking-[0.25em] uppercase">Storage</span>
          </div>
          <div className="text-[9px] font-mono text-text-light opacity-60">{samples.length} ITEMS</div>
      </div>

      {/* Import Button & Privacy Disclaimer */}
      <div className="flex gap-2 mb-4 shrink-0 px-1">
        <button 
            onClick={() => fileInputRef.current?.click()}
            className="
                group flex-1 flex items-center justify-center gap-2 py-3 rounded-lg
                bg-main shadow-soft-out hover:shadow-soft-in
                text-xs font-bold text-text-light hover:text-text-main uppercase tracking-wide
                transition-all duration-200 active:scale-95 border border-white/10
            "
        >
            <Upload size={14} className="group-hover:text-orange-500 transition-colors" />
            <span>Import</span>
        </button>

        {/* Disclaimer Tab */}
        <div className="relative group/tooltip">
            <div className="
                h-full aspect-square rounded-lg
                bg-main shadow-soft-out hover:shadow-soft-in
                flex items-center justify-center
                text-text-light hover:text-orange-500
                transition-all duration-200 cursor-help border border-white/10
            ">
                <CircleHelp size={16} />
            </div>
            
            {/* Tooltip Content */}
            <div className="
                absolute top-full left-0 mt-3 w-72 p-4 z-50
                bg-main rounded-xl shadow-plate border border-white/10
                opacity-0 group-hover/tooltip:opacity-100 pointer-events-none
                transition-all duration-300
                translate-y-2 group-hover/tooltip:translate-y-0
            ">
                <h4 className="text-xs font-black text-text-main uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Shield size={12} className="text-green-500" />
                    Local Processing Only
                </h4>
                <p className="text-xs text-text-light leading-relaxed font-sans text-left tracking-normal">
                    Your audio files are processed entirely within your browser using the WebAudio API. No data is ever uploaded to the cloud or external servers.
                </p>
                {/* Arrow */}
                <div className="absolute -top-1.5 left-4 w-3 h-3 bg-main border-t border-l border-white/10 transform rotate-45"></div>
            </div>
        </div>
      </div>

      <input 
        type="file" 
        multiple 
        ref={fileInputRef} 
        className="hidden" 
        accept="audio/*"
        onChange={(e) => e.target.files && onImport(e.target.files)}
      />

      {/* File List Container (Inner Recess) */}
      <div className="flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar min-h-0 bg-main shadow-soft-in rounded-xl border border-black/5 p-3">
        {samples.length === 0 ? (
            <div className="h-full min-h-[100px] flex flex-col items-center justify-center text-text-light opacity-30 border-2 border-dashed border-gray-500/20 rounded-lg">
                <Music size={24} className="mb-2" />
                <span className="text-[10px] uppercase font-bold text-center px-4">Empty Slot</span>
            </div>
        ) : (
            <div className="flex flex-col gap-3 pb-2">
                {samples.map((sample) => (
                    <div 
                        key={sample.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, sample)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            onContextMenu(e, 'library', sample.id);
                        }}
                        className="
                            group relative flex items-center justify-between p-2.5 rounded-lg
                            bg-main shadow-soft-out border border-white/5
                            cursor-grab active:cursor-grabbing hover:translate-x-1
                            transition-all duration-200
                        "
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="min-w-[20px] h-[20px] rounded bg-gray-500/10 flex items-center justify-center text-text-light group-hover:text-orange-500 transition-colors">
                                <Music size={10} />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-[9px] font-bold text-text-main truncate w-[100px]">{sample.name}</span>
                                <span className="text-[7px] font-mono text-text-light">{Math.round(sample.buffer.duration * 100) / 100}s</span>
                            </div>
                        </div>
                        
                        <button 
                            onClick={(e) => { e.stopPropagation(); onPreview(sample.buffer); }}
                            className="w-6 h-6 rounded-full bg-main shadow-soft-out hover:shadow-soft-in hover:text-orange-500 text-text-light transition-all shrink-0 flex items-center justify-center"
                            title="Preview"
                        >
                            <Play size={8} fill="currentColor" />
                        </button>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Footer / Status */}
      <div className="mt-4 pt-0 flex justify-between items-center text-[7px] text-text-light font-mono shrink-0 uppercase tracking-wider opacity-60 px-2">
         <span>Memory: {(samples.reduce((acc, s) => acc + s.buffer.length, 0) / 1024 / 1024).toFixed(1)}MB</span>
         <span>Read/Write</span>
      </div>
    </div>
  );
};