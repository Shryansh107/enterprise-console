import React, { useState, useEffect, useRef } from 'react';

export default function VirtualizedTableBody({ 
  items, 
  colSpan, 
  renderRow, 
  emptyPlaceholder,
  pageSize = 30
}) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const observerTargetRef = useRef(null);

  // Reset visible items count when items list changes (e.g. when filters are applied or tab changes)
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items, pageSize]);

  useEffect(() => {
    const target = observerTargetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Trigger adding more items when the user scrolls to the bottom
          setVisibleCount((prev) => Math.min(items.length, prev + pageSize));
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px' // Load next page slightly before reaching the bottom for smooth scrolling
      }
    );

    observer.observe(target);
    return () => {
      observer.unobserve(target);
    };
  }, [items.length, visibleCount, pageSize]);

  if (items.length === 0) {
    return (
      <tbody className="divide-y divide-[#2a2d3a]">
        {emptyPlaceholder}
      </tbody>
    );
  }

  const visibleItems = items.slice(0, visibleCount);

  return (
    <tbody className="divide-y divide-[#2a2d3a] text-[#f3f4f6]">
      {visibleItems.map(renderRow)}
      
      {/* Target element at the end of the list to trigger loading more items */}
      {visibleCount < items.length && (
        <tr ref={observerTargetRef} className="border-none hover:bg-transparent">
          <td colSpan={colSpan} style={{ padding: 0, height: '4px' }} className="border-none opacity-0 select-none pointer-events-none" />
        </tr>
      )}
    </tbody>
  );
}
