import React from 'react';
import { X, Globe, Github, Twitter, ShieldAlert } from 'lucide-react';

interface InfoModalProps {
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/10 backdrop-blur-[4px] p-4 transition-all" onClick={onClose}>
      <div 
        className="w-full max-w-sm md:max-w-md bg-main rounded-[2rem] shadow-plate border border-white/60 p-8 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-main shadow-soft-out text-gray-400 hover:text-red-500 hover:shadow-soft-in active:scale-95 transition-all border border-white/20 z-10"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center mt-2">
            {/* Logo / Icon */}
            <div className="w-20 h-20 rounded-[1.5rem] bg-main shadow-soft-out flex items-center justify-center mb-6 border border-white/40">
                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 shadow-inner flex items-center justify-center">
                    <span className="font-black text-2xl text-white tracking-tighter">S</span>
                 </div>
            </div>
            
            <h2 className="text-2xl font-black text-text-main tracking-tight mb-1">SONISTO</h2>
            <span className="text-[10px] font-bold text-gray-400 tracking-[0.3em] uppercase mb-8">Pro Control Surface</span>

            <div className="w-full bg-main shadow-soft-in rounded-xl p-6 mb-6 border border-white/20">
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Developed By</div>
                <div className="text-xl font-bold text-text-main tracking-tight mb-2">Matthew Robert Wesney</div>
                <div className="inline-block px-3 py-1 rounded-full bg-orange-100/50 border border-orange-200/50">
                    <div className="text-[10px] font-mono text-orange-500 font-bold tracking-widest">v0.3.4 PROTOTYPE</div>
                </div>
            </div>

            {/* Disclaimer Section */}
            <div className="w-full bg-red-500/5 border border-red-500/10 rounded-xl p-4 mb-8 text-left relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <ShieldAlert size={48} className="text-red-500" />
                </div>
                <h3 className="text-[9px] font-black text-red-500/80 uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
                    <ShieldAlert size={12} /> Usage Restrictions
                </h3>
                <p className="text-[9px] text-text-light/90 leading-relaxed font-sans text-justify relative z-10 font-medium">
                    This software is the intellectual property of the developer and is provided <span className="text-text-main font-bold">strictly for educational and practical use</span> on this web platform. 
                </p>
                <div className="my-2 h-[1px] bg-red-500/10 w-full"></div>
                <p className="text-[9px] text-text-light/90 leading-relaxed font-sans text-justify relative z-10 font-medium">
                    <span className="text-red-500 font-bold">PROHIBITED ACTIONS:</span> You may NOT clone, copy, extract source code, repurpose UI design assets, redistribute, modify files, remove credits, or utilize any portion of this application for monetization or commercial gain. This work represents significant personal effort—please respect the developer's rights and do not duplicate or profit from this project.
                </p>
            </div>

            <div className="flex justify-center gap-4 w-full">
                <SocialLink href="https://matt-wesney.github.io/website/" icon={Globe} label="Web" />
                <SocialLink href="https://github.com/dovvnloading" icon={Github} label="Github" />
                <SocialLink href="https://x.com/D3VAUX" icon={Twitter} label="X / Tw" />
            </div>
            
            <div className="mt-8 text-[9px] text-gray-400 font-mono">
                &copy; {new Date().getFullYear()} Matthew Robert Wesney. All Rights Reserved.
            </div>
        </div>
      </div>
    </div>
  );
};

const SocialLink = ({ href, icon: Icon, label }: any) => (
    <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-2 group min-w-[70px]"
    >
        <div className="w-12 h-12 rounded-2xl bg-main shadow-soft-out group-hover:shadow-soft-in flex items-center justify-center text-gray-400 group-hover:text-orange-500 group-hover:-translate-y-1 group-active:translate-y-0 transition-all duration-300 border border-white/40">
            <Icon size={20} />
        </div>
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-gray-600 transition-colors">{label}</span>
    </a>
);
