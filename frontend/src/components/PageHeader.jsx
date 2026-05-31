import React from 'react';

export default function PageHeader({ tag, title, subTitle, className = '' }) {
  return (
    <div className={`pl-6 ${subTitle ? 'mb-10 select-none relative' : 'mb-8'} ${className}`}>
      <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)] block mb-1">
        {tag}
      </span>
      <h2 className="font-display font-bold text-2xl md:text-3xl uppercase tracking-wider text-white mt-1">
        {title}
      </h2>
      {subTitle ? (
        <div className="flex items-center justify-between border-b border-[#2a2d3a] pb-4 mt-4">
          <span className="font-mono text-xs text-[#9ca3af]">
            {subTitle}
          </span>
        </div>
      ) : (
        <div className="h-[1px] bg-[#2a2d3a] mt-4"></div>
      )}
    </div>
  );
}
