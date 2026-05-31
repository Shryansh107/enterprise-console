import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import FilterPopover from '../components/FilterPopover';
import VirtualizedTableBody from '../components/VirtualizedTableBody';
import { formatDate } from '../utils/formatters';

export default function Customers({
  customers,
  loading,
  appliedFilters,
  stagedFilters,
  setStagedFilters,
  activeFilterDropdown,
  setActiveFilterDropdown,
  handleApplyFilter,
  handleClearFilter,
  handleClearAllFilters,
  setShowCustomerModal,
  setDeleteConfirm,
  loadingMore,
  hasMore,
  onLoadMore
}) {
  // Named function for customer row rendering (definition > 5 lines)
  const renderCustomerRow = (c) => (
    <tr key={c.id} className="hover:bg-[#171924]/30 transition-colors duration-150">
      <td className="py-4 px-6">
        <span className="font-semibold block text-white">{c.full_name}</span>
        <span className="text-[8px] text-[#9ca3af] block font-mono">
          STAGE DATE: {formatDate(c.created_at)}
        </span>
      </td>
      <td className="py-4 px-6 font-semibold text-[var(--accent)] font-mono">{c.email}</td>
      <td className="py-4 px-6 text-[#f3f4f6] font-mono">{c.phone_number || '—'}</td>
      <td className="py-4 px-6 text-center">
        <button 
          onClick={() => setDeleteConfirm({ show: true, type: 'customer', id: c.id })} 
          className="p-2 border border-[#2a2d3a] text-[#9ca3af] hover:border-[#ef4444] hover:text-[#ef4444] rounded transition-all"
          title="Delete Customer Profile"
        >
          <Trash2 size={12} />
        </button>
      </td>
    </tr>
  );

  const hasAppliedFilters = Object.keys(appliedFilters.customers).length > 0;

  return (
    <div className="editorial-container">
      {/* Header */}
      <PageHeader tag="[Client Module]" title="Client Database" />

      {/* CTA bar */}
      <div className="flex justify-between items-center mb-6 pl-6 pr-2">
        <div className="text-xs font-mono text-[#9ca3af] flex items-center gap-2">
          <span>Showing {customers.length} registered client profiles.</span>
          {hasAppliedFilters && (
            <button 
              onClick={() => handleClearAllFilters('customers')}
              className="px-2 py-0.5 border border-[#ef4444]/30 hover:border-[#ef4444] text-[#ef4444] bg-[#ef4444]/10 rounded text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer hover:bg-[#ef4444]/20"
            >
              Clear All Filters ×
            </button>
          )}
        </div>
        <button 
          onClick={() => setShowCustomerModal(true)} 
          className="btn-primary font-mono text-xs uppercase tracking-wider"
        >
          <Plus size={14} /> Register Client Node
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Customer table - Stretched Full Width */}
        <div className="lg:col-span-12">
          
          {/* Table */}
          <div className="border border-[#2a2d3a] bg-[#12131a] rounded-lg overflow-visible relative">
            {loading && (
              <div className="absolute inset-0 bg-[#0b0b12]/50 backdrop-blur-sm z-[40] flex items-center justify-center rounded-lg animate-none">
                <div className="flex flex-col items-center gap-2 bg-[#12131a] border border-[#2a2d3a] p-4 rounded-lg shadow-2xl">
                  <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#9ca3af]">// Syncing Customer Nodes</span>
                </div>
              </div>
            )}
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#171924] text-[#9ca3af] uppercase tracking-wider border-b border-[#2a2d3a]">
                  
                  {/* Name Column Header with Filter Popover */}
                  <th className="py-4 px-6 font-semibold relative select-none">
                    <FilterPopover
                      isOpen={activeFilterDropdown.table === 'customers' && activeFilterDropdown.column === 'name'}
                      onToggle={() => setActiveFilterDropdown({
                        table: 'customers',
                        column: activeFilterDropdown.column === 'name' ? '' : 'name'
                      })}
                      onClose={() => setActiveFilterDropdown({ table: '', column: '' })}
                      onClear={() => handleClearFilter('customers', 'name', ['name'])}
                      onApply={() => handleApplyFilter('customers', 'name', { name: stagedFilters.name })}
                      isActive={!!appliedFilters.customers.name}
                      columnTitle="CLIENT NAME"
                      filterLabel="Filter by Client Name"
                      title="Filter by Name"
                    >
                      <input 
                        type="text" 
                        placeholder="e.g. Charlotte Perriand"
                        className="input-field"
                        value={stagedFilters.name || ''}
                        onChange={(e) => setStagedFilters({ ...stagedFilters, name: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleApplyFilter('customers', 'name', { name: stagedFilters.name });
                        }}
                      />
                    </FilterPopover>
                  </th>

                  {/* Email Column Header with Filter Popover */}
                  <th className="py-4 px-6 font-semibold relative select-none">
                    <FilterPopover
                      isOpen={activeFilterDropdown.table === 'customers' && activeFilterDropdown.column === 'email'}
                      onToggle={() => setActiveFilterDropdown({
                        table: 'customers',
                        column: activeFilterDropdown.column === 'email' ? '' : 'email'
                      })}
                      onClose={() => setActiveFilterDropdown({ table: '', column: '' })}
                      onClear={() => handleClearFilter('customers', 'email', ['email'])}
                      onApply={() => handleApplyFilter('customers', 'email', { email: stagedFilters.email })}
                      isActive={!!appliedFilters.customers.email}
                      columnTitle="COMMS_EMAIL"
                      filterLabel="Filter by Email"
                      title="Filter by Email"
                    >
                      <input 
                        type="text" 
                        placeholder="e.g. charlotte@cassina"
                        className="input-field"
                        value={stagedFilters.email || ''}
                        onChange={(e) => setStagedFilters({ ...stagedFilters, email: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleApplyFilter('customers', 'email', { email: stagedFilters.email });
                        }}
                      />
                    </FilterPopover>
                  </th>

                  {/* Phone Column Header with Filter Popover */}
                  <th className="py-4 px-6 font-semibold relative select-none">
                    <FilterPopover
                      isOpen={activeFilterDropdown.table === 'customers' && activeFilterDropdown.column === 'phone'}
                      onToggle={() => setActiveFilterDropdown({
                        table: 'customers',
                        column: activeFilterDropdown.column === 'phone' ? '' : 'phone'
                      })}
                      onClose={() => setActiveFilterDropdown({ table: '', column: '' })}
                      onClear={() => handleClearFilter('customers', 'phone', ['phone'])}
                      onApply={() => handleApplyFilter('customers', 'phone', { phone: stagedFilters.phone })}
                      isActive={!!appliedFilters.customers.phone}
                      columnTitle="COMMS_PHONE"
                      filterLabel="Filter by Phone"
                      title="Filter by Phone"
                    >
                      <input 
                        type="text" 
                        placeholder="e.g. +33 6"
                        className="input-field font-mono"
                        value={stagedFilters.phone || ''}
                        onChange={(e) => setStagedFilters({ ...stagedFilters, phone: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleApplyFilter('customers', 'phone', { phone: stagedFilters.phone });
                        }}
                      />
                    </FilterPopover>
                  </th>
                  <th className="py-4 px-6 font-semibold text-center select-none">DELETE</th>
                </tr>
              </thead>
              <VirtualizedTableBody
                items={customers}
                rowHeight={64}
                colSpan={4}
                emptyPlaceholder={
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-[#9ca3af] uppercase tracking-widest font-mono">
                      No registered client records returned.
                    </td>
                  </tr>
                }
                renderRow={renderCustomerRow}
                loadingMore={loadingMore}
                hasMore={hasMore}
                onLoadMore={() => onLoadMore(customers.length)}
              />
            </table>
          </div>

        </div>

      </div>

    </div>
  );
}
