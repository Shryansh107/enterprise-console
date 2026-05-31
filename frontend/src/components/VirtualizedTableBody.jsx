import React, { useEffect, useRef } from 'react';

export default function VirtualizedTableBody({ 
  items, 
  colSpan, 
  renderRow, 
  emptyPlaceholder,
  loadingMore = false,
  hasMore = false,
  onLoadMore
}) {
  const observerTargetRef = useRef(null);

  useEffect(() => {
    const target = observerTargetRef.current;
    if (!target || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '150px' // Load next chunk before reaching the absolute bottom for a smooth flow
      }
    );

    observer.observe(target);
    return () => {
      observer.unobserve(target);
    };
  }, [hasMore, loadingMore, onLoadMore, items.length]);

  if (items.length === 0 && !loadingMore) {
    return (
      <tbody className="divide-y divide-[#2a2d3a]">
        {emptyPlaceholder}
      </tbody>
    );
  }

  return (
    <tbody className="divide-y divide-[#2a2d3a] text-[#f3f4f6]">
      {items.map(renderRow)}
      
      {/* Loader at the end of last item when new entries are being fetched */}
      {loadingMore && (
        <tr className="border-none hover:bg-transparent">
          <td colSpan={colSpan} className="py-6 text-center border-none select-none">
            <div className="flex items-center justify-center gap-3">
              <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#9ca3af]">// Loading more records from server</span>
            </div>
          </td>
        </tr>
      )}

      {/* Target element at the end of the list to trigger loading more items */}
      {hasMore && !loadingMore && (
        <tr ref={observerTargetRef} className="border-none hover:bg-transparent">
          <td colSpan={colSpan} style={{ padding: 0, height: '8px' }} className="border-none opacity-0 select-none pointer-events-none" />
        </tr>
      )}
    </tbody>
  );
}
