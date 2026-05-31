import React from 'react';
import { 
  Layers, 
  Users, 
  ShoppingBag, 
  AlertTriangle, 
  TrendingUp, 
  ChevronRight, 
  Plus 
} from 'lucide-react';
import PageHeader from '../components/PageHeader';

export default function Dashboard({
  products,
  customers,
  orders,
  lowStockProductsCount,
  onNavigateTo,
  setShowOrderModal,
  setShowProductModal,
  setShowCustomerModal
}) {
  // Convert inline mapping function to a named function (definition > 5 lines)
  const renderHistogramBar = (prod) => {
    const maxQty = Math.max(...products.map(p => p.quantity_in_stock), 1);
    const pct = Math.max((prod.quantity_in_stock / maxQty) * 100, 4);
    return (
      <div key={prod.id} className="flex flex-col items-center flex-1 group">
        <span className="font-mono text-[9px] text-[var(--accent)] opacity-0 group-hover:opacity-100 mb-1 transition-opacity duration-150 select-none">
          {prod.quantity_in_stock}
        </span>
        <div 
          className="w-full bg-[#3b1d4a] group-hover:bg-[var(--accent)] cursor-pointer rounded-t"
          style={{ height: `${pct * 1.5}px`, transition: 'all 200ms ease' }}
        ></div>
        <span className="font-mono text-[8px] tracking-wider uppercase truncate w-full text-center mt-2 text-[#9ca3af] group-hover:text-white">
          {prod.sku}
        </span>
      </div>
    );
  };

  return (
    <div className="editorial-container">
      {/* Elegant HUD Sub-Header */}
      <PageHeader 
        tag="// Operational Control Center" 
        title="System Overview" 
        subTitle="Database feeds loaded. Operations system report: nominal." 
      />

      {/* Standard B2B Elevated Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 select-none">
        
        <div className="enterprise-card enterprise-card-hover group">
          <div className="flex justify-between items-start mb-4">
            <span className="font-mono text-[9px] tracking-widest uppercase text-[#9ca3af]">[01] SKU Catalog</span>
            <Layers size={16} className="text-[var(--accent)]" />
          </div>
          <div className="font-display font-bold text-4xl leading-none text-white">{products.length}</div>
          <div className="font-mono text-[8px] tracking-wider uppercase mt-4 text-[#555770]">Database Datasets</div>
        </div>

        <div className="enterprise-card enterprise-card-hover group">
          <div className="flex justify-between items-start mb-4">
            <span className="font-mono text-[9px] tracking-widest uppercase text-[#9ca3af]">[02] Customer Nodes</span>
            <Users size={16} className="text-[var(--accent)]" />
          </div>
          <div className="font-display font-bold text-4xl leading-none text-white">{customers.length}</div>
          <div className="font-mono text-[8px] tracking-wider uppercase mt-4 text-[#555770]">Active Profiles</div>
        </div>

        <div className="enterprise-card enterprise-card-hover group">
          <div className="flex justify-between items-start mb-4">
            <span className="font-mono text-[9px] tracking-widest uppercase text-[#9ca3af]">[03] Sales Matrix</span>
            <ShoppingBag size={16} className="text-[var(--accent)]" />
          </div>
          <div className="font-display font-bold text-4xl leading-none text-white">{orders.length}</div>
          <div className="font-mono text-[8px] tracking-wider uppercase mt-4 text-[#555770]">Completed Logs</div>
        </div>

        <div className="enterprise-card border-[#3a1b2e] bg-[#120d18] group">
          <div className="flex justify-between items-start mb-4">
            <span className="font-mono text-[9px] tracking-widest uppercase text-[#9ca3af]">[04] Stock Warnings</span>
            <AlertTriangle size={16} className="text-[var(--warning)]" />
          </div>
          <div className="font-display font-bold text-4xl leading-none text-white">{lowStockProductsCount}</div>
          <div className="font-mono text-[8px] tracking-wider uppercase mt-4 text-[#555770]">SKUs Under Limit</div>
        </div>

      </section>

      {/* Layout strategy Grid trace section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Clean corporate metric velocity chart */}
        <div className="lg:col-span-8 enterprise-card relative overflow-hidden">
          <h3 className="font-display font-semibold text-base uppercase mb-6 tracking-wider flex items-center justify-between text-white">
            <span>Inventory Distribution Matrix</span>
            <TrendingUp size={16} className="text-[var(--accent)]" />
          </h3>
          
          {/* Clean histogram */}
          <div className="h-64 flex items-end justify-between gap-4 border-b border-[#2a2d3a] pt-8 px-4">
            {products.slice(0, 8).map(renderHistogramBar)}
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <p className="font-mono text-[8px] text-[#555770] uppercase">
              Histogram showing inventory quantities per product SKU code.
            </p>
            <button onClick={() => onNavigateTo('/products')} className="btn-ghost">
              View Catalog  <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* B2B actions panel */}
        <div className="lg:col-span-4 enterprise-card flex flex-col justify-between">
          <div>
            <h3 className="font-display font-semibold text-base uppercase mb-6 tracking-wider text-white">Console Operations</h3>
            <p className="font-body text-xs text-[#9ca3af] mb-6">
              Trigger database registrations and order transactional runs:
            </p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { onNavigateTo('/orders'); setShowOrderModal(true); }}
                className="btn-primary w-full justify-between"
              >
                <span>New Order Transaction</span>
                <Plus size={14} />
              </button>
              
              <button 
                onClick={() => { onNavigateTo('/products'); setShowProductModal(true); }}
                className="btn-secondary w-full justify-between"
              >
                <span>Add Product SKU</span>
                <Plus size={14} />
              </button>
 
              <button 
                onClick={() => { onNavigateTo('/customers'); setShowCustomerModal(true); }}
                className="btn-ghost w-full justify-between hover:text-white"
              >
                <span>Register Client Profile</span>
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#2a2d3a]">
            <span className="font-mono text-[9px] uppercase text-[#555770] block mb-1">Operational State</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[var(--success)] rounded-full select-none"></span>
              <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-[var(--success)]">Nominal Datalink</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
