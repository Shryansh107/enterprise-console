import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ 
  isOpen, 
  onClose, 
  tag, 
  title, 
  subTitle, 
  size = 'md', 
  borderClass = 'border-[#2a2d3a]', 
  children 
}) {
  if (!isOpen) return null;
  const sizeClass = size === 'lg' ? 'max-w-2xl' : 'max-w-md';
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className={`bg-[#12131a] border ${borderClass} w-full ${sizeClass} p-8 relative rounded-lg shadow-2xl`} style={{ transition: 'all 150ms ease' }}>
        
        {/* Abort X Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 border border-[#2a2d3a] text-[#9ca3af] hover:border-white hover:text-white rounded transition-colors"
        >
          <X size={16} />
        </button>

        <div className="mb-6 select-none">
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">{tag}</span>
          <h3 className="font-display font-bold text-xl uppercase tracking-wider text-white mt-1">
            {title}
          </h3>
          <p className="font-mono text-[9px] text-[#9ca3af] mt-1">
            {subTitle}
          </p>
        </div>

        <div className="h-[1px] bg-[#2a2d3a] my-4"></div>
        {children}
      </div>
    </div>
  );
}
