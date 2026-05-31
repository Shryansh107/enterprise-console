import React from 'react';
import { X, Filter } from 'lucide-react';

export default function FilterPopover({
  isOpen,
  onToggle,
  onClose,
  onClear,
  onApply,
  isActive,
  columnTitle,
  filterLabel,
  title,
  positionClass = 'top-12 left-6',
  className = 'flex items-center gap-2',
  children
}) {
  return (
    <div className={className}>
      <span>{columnTitle}</span>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`hover:text-white transition-colors p-1 ${isActive ? 'text-[var(--accent)] font-bold' : 'text-[#555770]'}`}
        title={title}
      >
        <Filter size={12} />
      </button>
      
      {isOpen && (
        <div 
          className={`absolute z-50 w-64 bg-[#12131a] border border-[#2a2d3a] p-4 rounded-md shadow-2xl normal-case font-normal text-xs text-[#f3f4f6] ${positionClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-3 right-3 text-[#9ca3af] hover:text-white"
          >
            <X size={12} />
          </button>
          
          <div className="mb-3">
            <label className="form-label mb-1">{filterLabel}</label>
            {children}
          </div>
          
          <div className="flex gap-2 justify-end mt-4">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="btn-ghost py-1 px-2.5 text-[10px]"
            >
              Clear
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onApply();
              }}
              className="btn-primary py-1 px-3 text-[10px]"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
