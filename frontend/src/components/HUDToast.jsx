import React from 'react';
import { X } from 'lucide-react';

export default function HUDToast({ message, show, onClose }) {
  if (!show) return null;
  return (
    <div 
      className="fixed bottom-8 right-8 z-[1000] border border-[#2a2d3a] bg-[#12131a] text-[#fff] px-6 py-4 flex items-center justify-between gap-4 max-w-sm cursor-pointer shadow-lg rounded-lg animate-fade-in"
      style={{ transition: 'all 150ms ease' }}
      onClick={onClose}
    >
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs uppercase tracking-wider font-bold text-[var(--accent)] select-none">
          [INFO]
        </span>
        <span className="text-xs font-semibold leading-tight">{message}</span>
      </div>
      <X size={14} className="text-[#9ca3af] hover:text-[#fff] shrink-0" />
    </div>
  );
}
