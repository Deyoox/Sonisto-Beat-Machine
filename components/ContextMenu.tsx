import React, { useEffect, useRef, useState } from 'react';
import { Trash2, RotateCcw, Zap, Music, Link2Off, ArrowRight, Settings2 } from 'lucide-react';
import { VelocityMode } from '../types';

interface ContextMenuProps {
  x: number;
  y: number;
  type: 'pad' | 'knob' | 'library';
  targetId: number | string;
  onClose: () => void;
  onAction: (action: string, payload?: any) => void;
  data?: any; // To pass current state like velocity mode
  selectedBank?: 'A' | 'B';
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, type, targetId, onClose, onAction, data, selectedBank = 'A' }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showCastSubmenu, setShowCastSubmenu] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Adjust position if it goes offscreen
  const style = {
    top: Math.min(y, window.innerHeight - 300),
    left: Math.min(x, window.innerWidth - 250),
  };

  const MenuItem = ({ icon: Icon, label, onClick, danger = false, hasSubmenu = false }: any) => (
    <div 
        onClick={(e) => {
            if (!hasSubmenu) {
                onClick();
                onClose();
            }
        }}
        onMouseEnter={() => hasSubmenu && setShowCastSubmenu(true)}
        className={`
            flex items-center justify-between px-4 py-3 cursor-pointer
            transition-colors duration-150 group relative
            ${danger ? 'hover:bg-red-50 text-red-500' : 'hover:bg-black/5 text-text-main'}
        `}
    >
      <div className="flex items-center gap-3">
         {Icon && <Icon size={14} className={danger ? 'text-red-500' : 'text-gray-400 group-hover:text-orange-500'} />}
         <span className="text-xs font-bold tracking-wide">{label}</span>
      </div>
      {hasSubmenu && <ArrowRight size={12} className="text-gray-400" />}
    </div>
  );

  const VelocityOption = ({ mode, label, current }: { mode: VelocityMode, label: string, current: VelocityMode }) => (
      <div 
        onClick={() => {
            onAction('setVelocityMode', { id: targetId, mode });
            onClose();
        }}
        className={`
            px-8 py-2 text-[10px] font-mono cursor-pointer flex items-center gap-2
            hover:bg-black/5
            ${current === mode ? 'text-orange-500 font-bold' : 'text-gray-500'}
        `}
      >
          <div className={`w-1.5 h-1.5 rounded-full ${current === mode ? 'bg-orange-500' : 'bg-transparent border border-gray-300'}`}></div>
          {label}
      </div>
  );

  // Layout order to match physical controller: 
  // Top Row: 5, 6, 7, 8 (Indices 4, 5, 6, 7)
  // Bottom Row: 1, 2, 3, 4 (Indices 0, 1, 2, 3)
  // Adjust for active bank
  const baseOrder = [4, 5, 6, 7, 0, 1, 2, 3];
  const offset = selectedBank === 'B' ? 8 : 0;
  const padCastOrder = baseOrder.map(id => id + offset);

  return (
    <div 
        ref={menuRef}
        style={style}
        className="fixed z-[100] min-w-[220px] bg-main rounded-xl shadow-plate border border-white/40 overflow-visible flex flex-col py-1 animate-in fade-in zoom-in-95 duration-100"
    >
        {type === 'pad' && (
            <>
                <div className="px-4 py-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200/10 mb-1">
                    Pad Options
                </div>
                
                <div className="relative">
                    <MenuItem icon={Zap} label="Velocity Mode" hasSubmenu onClick={() => {}} />
                    {/* Velocity Settings (Inline for simplicity, or could be submenu) */}
                    <div className="bg-black/5 py-1 border-y border-white/20">
                         <VelocityOption mode="dynamic" label="Dynamic (Default)" current={data?.velocityMode} />
                         <VelocityOption mode="max" label="Fixed Max (127)" current={data?.velocityMode} />
                         <VelocityOption mode="mid" label="Fixed Mid (64)" current={data?.velocityMode} />
                         <VelocityOption mode="min" label="Fixed Min (1)" current={data?.velocityMode} />
                    </div>
                </div>

                <MenuItem 
                    icon={Link2Off} 
                    label="Forget MIDI Map" 
                    onClick={() => onAction('forgetMidi', { id: targetId })} 
                />
                <MenuItem 
                    icon={Trash2} 
                    label="Remove Sample" 
                    danger 
                    onClick={() => onAction('removeSample', { id: targetId })} 
                />
            </>
        )}

        {type === 'knob' && (
            <>
                <div className="px-4 py-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200/10 mb-1">
                    Knob Options
                </div>
                <MenuItem 
                    icon={RotateCcw} 
                    label="Reset Value" 
                    onClick={() => onAction('resetKnob', { id: targetId })} 
                />
                <MenuItem 
                    icon={Link2Off} 
                    label="Forget MIDI Map" 
                    onClick={() => onAction('forgetMidiKnob', { id: targetId })} 
                />
            </>
        )}

        {type === 'library' && (
            <>
                <div className="px-4 py-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200/10 mb-1">
                    Sample Options
                </div>
                <div 
                    className="relative"
                    onMouseEnter={() => setShowCastSubmenu(true)}
                    onMouseLeave={() => setShowCastSubmenu(false)}
                >
                    <MenuItem icon={Music} label="Cast to Pad..." hasSubmenu onClick={() => {}} />
                    
                    {showCastSubmenu && (
                        <div className="absolute left-[95%] top-0 w-48 bg-main rounded-xl shadow-plate border border-white/40 overflow-hidden p-2 grid grid-cols-4 gap-2 z-50">
                             {padCastOrder.map((padId) => (
                                 <button
                                    key={padId}
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent bubbling causing issues
                                        onAction('castToPad', { sampleId: targetId, padId: padId });
                                        onClose();
                                    }}
                                    className="aspect-square rounded bg-main shadow-soft-out hover:shadow-soft-in flex items-center justify-center text-xs font-bold text-gray-500 hover:text-orange-500 transition-all border border-white/20 hover:scale-105 active:scale-95"
                                 >
                                    {padId + 1}
                                 </button>
                             ))}
                        </div>
                    )}
                </div>

                <MenuItem 
                    icon={Trash2} 
                    label="Remove from Library" 
                    danger 
                    onClick={() => onAction('removeLibrarySample', { id: targetId })} 
                />
            </>
        )}
    </div>
  );
};