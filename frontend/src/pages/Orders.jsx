import React from 'react';
import { Plus, Eye, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import FilterPopover from '../components/FilterPopover';
import VirtualizedTableBody from '../components/VirtualizedTableBody';
import { formatCurrency, formatDateTime, padOrderId } from '../utils/formatters';

export default function Orders({
  orders,
  loading,
  appliedFilters,
  stagedFilters,
  setStagedFilters,
  activeFilterDropdown,
  setActiveFilterDropdown,
  handleApplyFilter,
  handleClearFilter,
  handleClearAllFilters,
  setShowOrderModal,
  setSelectedOrder,
  setDeleteConfirm,
  loadingMore,
  hasMore,
  onLoadMore
}) {
  // Named function for order row rendering (definition > 5 lines)
  const renderOrderRow = (o) => (
    <tr key={o.id} className="hover:bg-[#171924]/30 transition-colors duration-150">
      <td className="py-4 px-6 text-[var(--accent)] font-bold font-mono">
        #TRX-{padOrderId(o.id)}
        <span className="block font-normal text-[8px] text-[#9ca3af]">
          {formatDateTime(o.created_at)}
        </span>
      </td>
      <td className="py-4 px-6">
        <span className="font-semibold block text-white">{o.customer?.full_name || 'Dieter Rams'}</span>
        <span className="text-[8px] text-[#9ca3af] block font-mono">
          {o.customer?.email}
        </span>
      </td>
      <td className="py-4 px-6 text-right font-bold font-mono text-white">
        {formatCurrency(o.total_amount)}
      </td>
      <td className="py-4 px-6">
        <div className="flex gap-2 justify-center">
          <button 
            onClick={() => setSelectedOrder(o)} 
            className="p-2 border border-[#2a2d3a] text-[#9ca3af] hover:border-white hover:text-white rounded transition-all"
            title="View Order Details"
          >
            <Eye size={12} />
          </button>
          <button 
            onClick={() => setDeleteConfirm({ show: true, type: 'order', id: o.id })} 
            className="p-2 border border-[#2a2d3a] text-[#9ca3af] hover:border-[#ef4444] hover:text-[#ef4444] rounded transition-all"
            title="Cancel/Rollback Order"
          >
            <X size={12} />
          </button>
        </div>
      </td>
    </tr>
  );

  const hasAppliedFilters = Object.keys(appliedFilters.orders).length > 0;

  return (
    <div className="editorial-container">
      {/* Header */}
      <PageHeader tag="[Transaction Module]" title="Transaction Ledger" />

      {/* CTA bar */}
      <div className="flex justify-between items-center mb-6 pl-6 pr-2">
        <div className="text-xs font-mono text-[#9ca3af] flex items-center gap-2">
          <span>Showing {orders.length} transaction logs settled in database.</span>
          {hasAppliedFilters && (
            <button 
              onClick={() => handleClearAllFilters('orders')}
              className="px-2 py-0.5 border border-[#ef4444]/30 hover:border-[#ef4444] text-[#ef4444] bg-[#ef4444]/10 rounded text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer hover:bg-[#ef4444]/20"
            >
              Clear All Filters ×
            </button>
          )}
        </div>
        <button 
          onClick={() => setShowOrderModal(true)} 
          className="btn-primary font-mono text-xs uppercase tracking-wider"
        >
          <Plus size={14} /> Compile Transaction
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Order Transaction listing - Stretched Full Width */}
        <div className="lg:col-span-12">
          
          {/* Table */}
          <div className="border border-[#2a2d3a] bg-[#12131a] rounded-lg overflow-visible relative">
            {loading && (
              <div className="absolute inset-0 bg-[#0b0b12]/50 backdrop-blur-sm z-[40] flex items-center justify-center rounded-lg animate-none">
                <div className="flex flex-col items-center gap-2 bg-[#12131a] border border-[#2a2d3a] p-4 rounded-lg shadow-2xl">
                  <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#9ca3af]">// Syncing Transactions</span>
                </div>
              </div>
            )}
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#171924] text-[#9ca3af] uppercase tracking-wider border-b border-[#2a2d3a]">
                  
                  {/* Transaction ID Column Header with Filter Popover */}
                  <th className="py-4 px-6 font-semibold font-mono relative select-none">
                    <FilterPopover
                      isOpen={activeFilterDropdown.table === 'orders' && activeFilterDropdown.column === 'txn_id'}
                      onToggle={() => setActiveFilterDropdown({
                        table: 'orders',
                        column: activeFilterDropdown.column === 'txn_id' ? '' : 'txn_id'
                      })}
                      onClose={() => setActiveFilterDropdown({ table: '', column: '' })}
                      onClear={() => handleClearFilter('orders', 'txn_id', ['txn_id'])}
                      onApply={() => handleApplyFilter('orders', 'txn_id', { txn_id: stagedFilters.txn_id })}
                      isActive={!!appliedFilters.orders.txn_id}
                      columnTitle="TXN_ID"
                      filterLabel="Filter by TXN_ID"
                      title="Filter by Transaction ID"
                    >
                      <input 
                        type="text" 
                        placeholder="e.g. 0001"
                        className="input-field font-mono"
                        value={stagedFilters.txn_id || ''}
                        onChange={(e) => setStagedFilters({ ...stagedFilters, txn_id: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleApplyFilter('orders', 'txn_id', { txn_id: stagedFilters.txn_id });
                        }}
                      />
                    </FilterPopover>
                  </th>

                  {/* Client Decoder Column Header with Filter Popover */}
                  <th className="py-4 px-6 font-semibold relative select-none">
                    <FilterPopover
                      isOpen={activeFilterDropdown.table === 'orders' && activeFilterDropdown.column === 'customer'}
                      onToggle={() => setActiveFilterDropdown({
                        table: 'orders',
                        column: activeFilterDropdown.column === 'customer' ? '' : 'customer'
                      })}
                      onClose={() => setActiveFilterDropdown({ table: '', column: '' })}
                      onClear={() => handleClearFilter('orders', 'customer', ['customer_name'])}
                      onApply={() => handleApplyFilter('orders', 'customer', { customer_name: stagedFilters.customer_name })}
                      isActive={!!appliedFilters.orders.customer_name}
                      columnTitle="CLIENT DECODER"
                      filterLabel="Filter by Client Name"
                      title="Filter by Client"
                    >
                      <input 
                        type="text" 
                        placeholder="e.g. Charlotte"
                        className="input-field"
                        value={stagedFilters.customer_name || ''}
                        onChange={(e) => setStagedFilters({ ...stagedFilters, customer_name: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleApplyFilter('orders', 'customer', { customer_name: stagedFilters.customer_name });
                        }}
                      />
                    </FilterPopover>
                  </th>

                  {/* Value Sum Column Header with Filter Popover */}
                  <th className="py-4 px-6 font-semibold text-right relative select-none">
                    <FilterPopover
                      isOpen={activeFilterDropdown.table === 'orders' && activeFilterDropdown.column === 'amount'}
                      onToggle={() => setActiveFilterDropdown({
                        table: 'orders',
                        column: activeFilterDropdown.column === 'amount' ? '' : 'amount'
                      })}
                      onClose={() => setActiveFilterDropdown({ table: '', column: '' })}
                      onClear={() => handleClearFilter('orders', 'amount', ['min_amount', 'max_amount'])}
                      onApply={() => handleApplyFilter('orders', 'amount', { min_amount: stagedFilters.min_amount, max_amount: stagedFilters.max_amount })}
                      isActive={!!(appliedFilters.orders.min_amount || appliedFilters.orders.max_amount)}
                      columnTitle="VAL_SUM"
                      filterLabel="Value Range"
                      title="Filter by Value"
                      positionClass="top-12 right-6"
                      className="flex items-center gap-2 justify-end"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="form-label mb-1">Min Value ($)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            placeholder="0.00"
                            className="input-field font-mono text-xs"
                            value={stagedFilters.min_amount || ''}
                            onChange={(e) => setStagedFilters({ ...stagedFilters, min_amount: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="form-label mb-1">Max Value ($)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            placeholder="5000.00"
                            className="input-field font-mono text-xs"
                            value={stagedFilters.max_amount || ''}
                            onChange={(e) => setStagedFilters({ ...stagedFilters, max_amount: e.target.value })}
                          />
                        </div>
                      </div>
                    </FilterPopover>
                  </th>
                  <th className="py-4 px-6 font-semibold text-center select-none">COMMAND</th>
                </tr>
              </thead>
              <VirtualizedTableBody
                items={orders}
                rowHeight={64}
                colSpan={4}
                emptyPlaceholder={
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-[#9ca3af] uppercase tracking-widest font-mono">
                      No transaction blocks logged to database.
                    </td>
                  </tr>
                }
                renderRow={renderOrderRow}
                loadingMore={loadingMore}
                hasMore={hasMore}
                onLoadMore={() => onLoadMore(orders.length)}
              />
            </table>
          </div>

        </div>

      </div>

    </div>
  );
}
