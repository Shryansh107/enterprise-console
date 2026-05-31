import React from 'react';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import FilterPopover from '../components/FilterPopover';
import VirtualizedTableBody from '../components/VirtualizedTableBody';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export default function Products({
  products,
  loading,
  appliedFilters,
  stagedFilters,
  setStagedFilters,
  activeFilterDropdown,
  setActiveFilterDropdown,
  handleApplyFilter,
  handleClearFilter,
  handleClearAllFilters,
  setShowProductModal,
  setEditProduct,
  setDeleteConfirm,
  LOW_STOCK_THRESHOLD
}) {
  // Named function for product row rendering (satisfying rule 9 - definition > 5 lines)
  const renderProductRow = (p) => {
    const isLowStock = p.quantity_in_stock <= LOW_STOCK_THRESHOLD && p.quantity_in_stock > 0;
    const isOutOfStock = p.quantity_in_stock === 0;

    return (
      <tr key={p.id} className="hover:bg-[#171924]/30 transition-colors duration-150">
        <td className="py-4 px-6 font-bold font-mono text-[var(--accent)]">{p.sku}</td>
        <td className="py-4 px-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{p.name}</span>
            {isLowStock && (
              <span 
                className="px-1 py-0.5 border border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#f59e0b] rounded text-[7.5px] font-mono uppercase tracking-wider font-semibold leading-none align-middle"
                style={{ margin: 0, padding: '1px 3px' }}
              >
                Low Stock
              </span>
            )}
            {isOutOfStock && (
              <span 
                className="px-1 py-0.5 border border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444] rounded text-[7.5px] font-mono uppercase tracking-wider font-semibold leading-none align-middle"
                style={{ margin: 0, padding: '1px 3px' }}
              >
                Depleted
              </span>
            )}
          </div>
          <span className="text-[8px] text-[#9ca3af] block font-mono mt-1">
            LAST PATCHED: {formatDateTime(p.updated_at)}
          </span>
        </td>
        <td className="py-4 px-6 text-right font-semibold font-mono text-white">
          {formatCurrency(p.price)}
        </td>
        <td className="py-4 px-6 text-right">
          <div className="font-mono font-semibold text-white">
            {p.quantity_in_stock}
          </div>
        </td>
        <td className="py-4 px-6">
          <div className="flex gap-2 justify-center">
            <button 
              onClick={() => setEditProduct(p)} 
              className="p-2 border border-[#2a2d3a] text-[#9ca3af] hover:border-white hover:text-white rounded transition-all"
              title="Edit Product"
            >
              <Edit3 size={12} />
            </button>
            <button 
              onClick={() => setDeleteConfirm({ show: true, type: 'product', id: p.id })} 
              className="p-2 border border-[#2a2d3a] text-[#9ca3af] hover:border-[#ef4444] hover:text-[#ef4444] rounded transition-all"
              title="Delete Product"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const hasAppliedFilters = Object.keys(appliedFilters.products).length > 0;

  return (
    <div className="editorial-container">
      {/* Header */}
      <PageHeader tag="[Catalog Console]" title="Product Inventory" />

      {/* CTA bar */}
      <div className="flex justify-between items-center mb-6 pl-6 pr-2">
        <div className="text-xs font-mono text-[#9ca3af] flex items-center gap-2">
          <span>Showing {products.length} product SKUs.</span>
          {hasAppliedFilters && (
            <button 
              onClick={() => handleClearAllFilters('products')}
              className="px-2 py-0.5 border border-[#ef4444]/30 hover:border-[#ef4444] text-[#ef4444] bg-[#ef4444]/10 rounded text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer hover:bg-[#ef4444]/20"
            >
              Clear All Filters ×
            </button>
          )}
        </div>
        <button 
          onClick={() => setShowProductModal(true)} 
          className="btn-primary font-mono text-xs uppercase tracking-wider"
        >
          <Plus size={14} /> Inject SKU Catalog
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Product catalog listing - Stretched Full Width */}
        <div className="lg:col-span-12">
          
          {/* Table */}
          <div className="border border-[#2a2d3a] bg-[#12131a] rounded-lg overflow-visible relative">
            {loading && (
              <div className="absolute inset-0 bg-[#0b0b12]/50 backdrop-blur-sm z-[40] flex items-center justify-center rounded-lg animate-none">
                <div className="flex flex-col items-center gap-2 bg-[#12131a] border border-[#2a2d3a] p-4 rounded-lg shadow-2xl">
                  <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#9ca3af]">// Syncing Inventory</span>
                </div>
              </div>
            )}
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#171924] text-[#9ca3af] uppercase tracking-wider border-b border-[#2a2d3a]">
                  
                  {/* SKU Column Header with Filter Popover */}
                  <th className="py-4 px-6 font-semibold font-mono relative select-none">
                    <FilterPopover
                      isOpen={activeFilterDropdown.table === 'products' && activeFilterDropdown.column === 'sku'}
                      onToggle={() => setActiveFilterDropdown({
                        table: 'products',
                        column: activeFilterDropdown.column === 'sku' ? '' : 'sku'
                      })}
                      onClose={() => setActiveFilterDropdown({ table: '', column: '' })}
                      onClear={() => handleClearFilter('products', 'sku', ['sku'])}
                      onApply={() => handleApplyFilter('products', 'sku', { sku: stagedFilters.sku })}
                      isActive={!!appliedFilters.products.sku}
                      columnTitle="SKU"
                      filterLabel="Filter by SKU"
                      title="Filter by SKU"
                      positionClass="top-12 left-6"
                    >
                      <input 
                        type="text" 
                        placeholder="e.g. LIGHT-003"
                        className="input-field uppercase font-mono"
                        value={stagedFilters.sku || ''}
                        onChange={(e) => setStagedFilters({ ...stagedFilters, sku: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleApplyFilter('products', 'sku', { sku: stagedFilters.sku });
                        }}
                      />
                    </FilterPopover>
                  </th>

                  {/* LABEL Column Header with Filter Popover */}
                  <th className="py-4 px-6 font-semibold relative select-none">
                    <FilterPopover
                      isOpen={activeFilterDropdown.table === 'products' && activeFilterDropdown.column === 'name'}
                      onToggle={() => setActiveFilterDropdown({
                        table: 'products',
                        column: activeFilterDropdown.column === 'name' ? '' : 'name'
                      })}
                      onClose={() => setActiveFilterDropdown({ table: '', column: '' })}
                      onClear={() => {
                        setStagedFilters({ ...stagedFilters, stock_status: '', name: '' });
                        handleClearFilter('products', 'name', ['name', 'min_stock', 'max_stock']);
                      }}
                      onApply={() => {
                        const patch = { name: stagedFilters.name };
                        if (stagedFilters.stock_status === 'low_stock') {
                          patch.max_stock = 5;
                          patch.min_stock = null;
                        } else if (stagedFilters.stock_status === 'depleted') {
                          patch.max_stock = 0;
                          patch.min_stock = null;
                        } else {
                          patch.max_stock = null;
                          patch.min_stock = null;
                        }
                        handleApplyFilter('products', 'name', patch);
                      }}
                      isActive={!!(appliedFilters.products.name || appliedFilters.products.max_stock !== undefined || appliedFilters.products.min_stock !== undefined)}
                      columnTitle="LABEL"
                      filterLabel="Filter by Product Name"
                      title="Filter by Name & Status"
                      positionClass="top-12 left-6"
                    >
                      <>
                        <input 
                          type="text" 
                          placeholder="e.g. StarkDesk"
                          className="input-field mb-3"
                          value={stagedFilters.name || ''}
                          onChange={(e) => setStagedFilters({ ...stagedFilters, name: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const patch = { name: stagedFilters.name };
                              if (stagedFilters.stock_status === 'low_stock') {
                                patch.max_stock = 5;
                                patch.min_stock = null;
                              } else if (stagedFilters.stock_status === 'depleted') {
                                patch.max_stock = 0;
                                patch.min_stock = null;
                              } else {
                                patch.max_stock = null;
                                patch.min_stock = null;
                              }
                              handleApplyFilter('products', 'name', patch);
                            }
                          }}
                        />
                        <div className="mt-3">
                          <label className="form-label mb-1">Stock Status</label>
                          <select 
                            className="input-field bg-[#12131a] text-white focus:outline-none py-1.5"
                            value={stagedFilters.stock_status || ''}
                            onChange={(e) => setStagedFilters({ ...stagedFilters, stock_status: e.target.value })}
                          >
                            <option value="" className="bg-[#12131a]">ALL STOCK LEVELS</option>
                            <option value="low_stock" className="bg-[#12131a]">LOW STOCK ({"<= 5"})</option>
                            <option value="depleted" className="bg-[#12131a]">DEPLETED (0)</option>
                          </select>
                        </div>
                      </>
                    </FilterPopover>
                  </th>

                  {/* UNIT PRICE Column Header with Filter Popover */}
                  <th className="py-4 px-6 font-semibold text-right relative select-none">
                    <FilterPopover
                      isOpen={activeFilterDropdown.table === 'products' && activeFilterDropdown.column === 'price'}
                      onToggle={() => setActiveFilterDropdown({
                        table: 'products',
                        column: activeFilterDropdown.column === 'price' ? '' : 'price'
                      })}
                      onClose={() => setActiveFilterDropdown({ table: '', column: '' })}
                      onClear={() => handleClearFilter('products', 'price', ['min_price', 'max_price'])}
                      onApply={() => handleApplyFilter('products', 'price', { min_price: stagedFilters.min_price, max_price: stagedFilters.max_price })}
                      isActive={!!(appliedFilters.products.min_price || appliedFilters.products.max_price)}
                      columnTitle="UNIT PRICE"
                      filterLabel="Price Range"
                      title="Filter by Price"
                      positionClass="top-12 right-6"
                      className="flex items-center gap-2 justify-end"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="form-label mb-1">Min Price ($)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            placeholder="0.00"
                            className="input-field font-mono text-xs"
                            value={stagedFilters.min_price || ''}
                            onChange={(e) => setStagedFilters({ ...stagedFilters, min_price: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="form-label mb-1">Max Price ($)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            placeholder="1000.00"
                            className="input-field font-mono text-xs"
                            value={stagedFilters.max_price || ''}
                            onChange={(e) => setStagedFilters({ ...stagedFilters, max_price: e.target.value })}
                          />
                        </div>
                      </div>
                    </FilterPopover>
                  </th>

                  {/* QUANTITY Column Header */}
                  <th className="py-4 px-6 font-semibold text-right select-none">
                    QUANTITY
                  </th>
                  <th className="py-4 px-6 font-semibold text-center select-none">COMMAND</th>
                </tr>
              </thead>
              <VirtualizedTableBody
                items={products}
                rowHeight={64}
                colSpan={5}
                emptyPlaceholder={
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-[#9ca3af] uppercase tracking-widest font-mono">
                      No records matching query filters.
                    </td>
                  </tr>
                }
                renderRow={renderProductRow}
              />
            </table>
          </div>

        </div>

      </div>

    </div>
  );
}
