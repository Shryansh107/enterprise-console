import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Users, 
  ShoppingBag, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Eye, 
  X, 
  TrendingUp, 
  Menu, 
  ChevronRight, 
  Edit3, 
  Terminal,
  Activity,
  Cpu,
  ShieldAlert
} from 'lucide-react';
import { api } from './services/api';

export default function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Data Lists
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Toast Notification State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Search States
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // Modals & Active Edit/Details Items
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, type: '', id: null });
  const [editProduct, setEditProduct] = useState(null);

  // Forms Input States
  const [productForm, setProductForm] = useState({ name: '', sku: '', price: '', quantity_in_stock: '' });
  const [customerForm, setCustomerForm] = useState({ full_name: '', email: '', phone_number: '' });
  const [orderForm, setOrderForm] = useState({ customer_id: '', items: [] });
  const [newOrderItem, setNewOrderItem] = useState({ product_id: '', quantity: 1 });

  // Low Stock Threshold
  const LOW_STOCK_THRESHOLD = 5;

  // Trigger Toast Notification Helper
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // Fetch initial core data
  const loadData = async () => {
    setLoading(true);
    try {
      const [prodList, custList, ordList] = await Promise.all([
        api.products.list(),
        api.customers.list(),
        api.orders.list()
      ]);
      setProducts(prodList);
      setCustomers(custList);
      setOrders(ordList);
      setError('');
    } catch (err) {
      console.error(err);
      setError('DATALINK OFFLINE: COULD NOT ESTABLISH DB HANDSHAKE.');
      showToast('DB HANDSHAKE FAILED.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Products and Customers based on search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredCustomers = customers.filter(c => 
    c.full_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // Product CRUD
  const handleProductCreate = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.sku || !productForm.price || productForm.quantity_in_stock === '') {
      showToast('INPUT REQUIRED: COMPLETE ALL DATA FIELDS.', 'error');
      return;
    }
    try {
      await api.products.create({
        name: productForm.name,
        sku: productForm.sku,
        price: parseFloat(productForm.price),
        quantity_in_stock: parseInt(productForm.quantity_in_stock)
      });
      showToast(`SKU ${productForm.sku} committed to catalog.`);
      setProductForm({ name: '', sku: '', price: '', quantity_in_stock: '' });
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleProductUpdate = async (e) => {
    e.preventDefault();
    if (!editProduct.name || !editProduct.sku || !editProduct.price || editProduct.quantity_in_stock === '') {
      showToast('INPUT REQUIRED: COMPLETE ALL DATA FIELDS.', 'error');
      return;
    }
    try {
      await api.products.update(editProduct.id, {
        name: editProduct.name,
        sku: editProduct.sku,
        price: parseFloat(editProduct.price),
        quantity_in_stock: parseInt(editProduct.quantity_in_stock)
      });
      showToast(`SKU ${editProduct.sku} compile patch success.`);
      setEditProduct(null);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleProductDelete = async (id) => {
    try {
      await api.products.delete(id);
      showToast('SKU deleted from matrix.');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleteConfirm({ show: false, type: '', id: null });
    }
  };

  // Customer CRUD
  const handleCustomerCreate = async (e) => {
    e.preventDefault();
    if (!customerForm.full_name || !customerForm.email) {
      showToast('INPUT REQUIRED: NAME AND EMAIL ARE MANDATORY.', 'error');
      return;
    }
    try {
      await api.customers.create(customerForm);
      showToast(`Customer profile injected successfully.`);
      setCustomerForm({ full_name: '', email: '', phone_number: '' });
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCustomerDelete = async (id) => {
    try {
      await api.customers.delete(id);
      showToast('Customer record purged.');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleteConfirm({ show: false, type: '', id: null });
    }
  };

  // Order Operations
  const addOrderItem = () => {
    if (!newOrderItem.product_id || newOrderItem.quantity <= 0) {
      showToast('INPUT REQUIRED: SELECT PRODUCT AND SPECIFY QTY.', 'error');
      return;
    }

    const selectedProduct = products.find(p => p.id === parseInt(newOrderItem.product_id));
    if (!selectedProduct) return;

    // Check inventory availability (front-end check)
    if (selectedProduct.quantity_in_stock < newOrderItem.quantity) {
      showToast(`OVERDRAW WARNING: AVAILABLE STOCK IS ${selectedProduct.quantity_in_stock}.`, 'error');
      return;
    }

    // Check if product already exists in item list, update quantity
    const existingIndex = orderForm.items.findIndex(item => item.product_id === selectedProduct.id);
    if (existingIndex > -1) {
      const updatedItems = [...orderForm.items];
      const newQty = updatedItems[existingIndex].quantity + parseInt(newOrderItem.quantity);
      
      if (selectedProduct.quantity_in_stock < newQty) {
        showToast(`OVERDRAW LIMIT: AVAILABLE STOCK IS ${selectedProduct.quantity_in_stock}.`, 'error');
        return;
      }
      
      updatedItems[existingIndex].quantity = newQty;
      setOrderForm({ ...orderForm, items: updatedItems });
    } else {
      setOrderForm({
        ...orderForm,
        items: [...orderForm.items, { 
          product_id: selectedProduct.id, 
          name: selectedProduct.name,
          sku: selectedProduct.sku,
          price: selectedProduct.price,
          quantity: parseInt(newOrderItem.quantity) 
        }]
      });
    }

    // Reset item input
    setNewOrderItem({ product_id: '', quantity: 1 });
  };

  const removeOrderItem = (index) => {
    const updated = [...orderForm.items];
    updated.splice(index, 1);
    setOrderForm({ ...orderForm, items: updated });
  };

  const handleOrderCreate = async (e) => {
    e.preventDefault();
    if (!orderForm.customer_id) {
      showToast('INPUT REQUIRED: SELECT TARGET CLIENT.', 'error');
      return;
    }
    if (orderForm.items.length === 0) {
      showToast('INPUT REQUIRED: AT LEAST ONE SKU REQUIRED.', 'error');
      return;
    }

    try {
      const orderPayload = {
        customer_id: parseInt(orderForm.customer_id),
        items: orderForm.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        }))
      };
      
      await api.orders.create(orderPayload);
      showToast('TRANSACTION SETTLED: STOCK INVENTORY DEDUCTED.');
      
      // Clear order form
      setOrderForm({ customer_id: '', items: [] });
      loadData();
      setCurrentTab('orders'); // navigate to list
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleOrderCancel = async (id) => {
    try {
      await api.orders.delete(id);
      showToast('TRANSACTION ROLLBACK COMPLETE: INVENTORY RETURNED.');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleteConfirm({ show: false, type: '', id: null });
    }
  };

  // Helper Calculations
  const lowStockProductsCount = products.filter(p => p.quantity_in_stock <= LOW_STOCK_THRESHOLD).length;
  const orderTotalLive = orderForm.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const navigateTo = (tab) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e0e0e0] flex flex-col md:flex-row relative">
      
      {/* Decorative neon ambient mesh glows in background */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[var(--accent)] opacity-[0.02] blur-[120px] pointer-events-none select-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--accent-secondary)] opacity-[0.02] blur-[120px] pointer-events-none select-none"></div>

      {/* Dynamic Toast System */}
      {toast.show && (
        <div 
          className="fixed bottom-8 right-8 z-[1000] border-2 border-[var(--accent)] bg-[#0d0d13] text-[#fff] px-6 py-4 flex items-center justify-between gap-4 max-w-sm cursor-pointer shadow-[0_0_15px_rgba(0,255,136,0.3)] cyber-chamfer-sm"
          style={{ transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)' }}
          onClick={() => setToast(prev => ({ ...prev, show: false }))}
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-wider font-bold text-[var(--accent)]">
              [SYSTEM_ALERT]
            </span>
            <span className="font-body text-xs font-bold leading-tight">{toast.message}</span>
          </div>
          <X size={14} className="text-[var(--accent)] opacity-60 hover:opacity-100" />
        </div>
      )}

      {/* Navigation Sidebar (Desktop HUD Console) */}
      <aside className="hidden md:flex flex-col w-72 bg-[#12121a] border-r border-[#2a2a3a] p-8 shrink-0 justify-between select-none relative">
        {/* Subtle glowing panel indicator */}
        <div className="absolute top-0 right-0 h-full w-[2px] bg-gradient-to-b from-[var(--accent)] to-transparent opacity-20"></div>

        <div>
          {/* Logo Brand with Glitch Effect */}
          <div className="mb-12">
            <h1 className="font-display font-black text-3xl tracking-widest uppercase leading-none">
              <span className="cyber-glitch block text-white" data-text="ETHARA">ETHARA</span>
              <span className="block font-mono text-[9px] font-bold tracking-[0.25em] mt-3 text-[var(--accent)]">SYSTEMS CONSOLE</span>
            </h1>
          </div>

          <nav className="flex flex-col gap-3">
            <button 
              onClick={() => navigateTo('dashboard')}
              className={`w-full text-left px-4 py-3 font-mono text-[11px] tracking-wider uppercase flex justify-between items-center transition-all duration-150 border cyber-chamfer-sm ${currentTab === 'dashboard' ? 'bg-transparent border-[var(--accent)] text-[var(--accent)] shadow-[0_0_8px_rgba(0,255,136,0.2)] font-bold' : 'border-transparent hover:border-[#3a3a52] text-[#8c8cbe] hover:text-[#fff]'}`}
            >
              <span>[01] // DASHBOARD</span>
              <Terminal size={12} className={currentTab === 'dashboard' ? 'text-[var(--accent)]' : 'opacity-40'} />
            </button>
            <button 
              onClick={() => navigateTo('products')}
              className={`w-full text-left px-4 py-3 font-mono text-[11px] tracking-wider uppercase flex justify-between items-center transition-all duration-150 border cyber-chamfer-sm ${currentTab === 'products' ? 'bg-transparent border-[var(--accent)] text-[var(--accent)] shadow-[0_0_8px_rgba(0,255,136,0.2)] font-bold' : 'border-transparent hover:border-[#3a3a52] text-[#8c8cbe] hover:text-[#fff]'}`}
            >
              <span>[02] // SKUS ({products.length})</span>
              <Cpu size={12} className={currentTab === 'products' ? 'text-[var(--accent)]' : 'opacity-40'} />
            </button>
            <button 
              onClick={() => navigateTo('customers')}
              className={`w-full text-left px-4 py-3 font-mono text-[11px] tracking-wider uppercase flex justify-between items-center transition-all duration-150 border cyber-chamfer-sm ${currentTab === 'customers' ? 'bg-transparent border-[var(--accent)] text-[var(--accent)] shadow-[0_0_8px_rgba(0,255,136,0.2)] font-bold' : 'border-transparent hover:border-[#3a3a52] text-[#8c8cbe] hover:text-[#fff]'}`}
            >
              <span>[03] // CLIENTS ({customers.length})</span>
              <Users size={12} className={currentTab === 'customers' ? 'text-[var(--accent)]' : 'opacity-40'} />
            </button>
            <button 
              onClick={() => navigateTo('orders')}
              className={`w-full text-left px-4 py-3 font-mono text-[11px] tracking-wider uppercase flex justify-between items-center transition-all duration-150 border cyber-chamfer-sm ${currentTab === 'orders' ? 'bg-transparent border-[var(--accent)] text-[var(--accent)] shadow-[0_0_8px_rgba(0,255,136,0.2)] font-bold' : 'border-transparent hover:border-[#3a3a52] text-[#8c8cbe] hover:text-[#fff]'}`}
            >
              <span>[04] // TRANSACTS ({orders.length})</span>
              <Activity size={12} className={currentTab === 'orders' ? 'text-[var(--accent)]' : 'opacity-40'} />
            </button>
          </nav>
        </div>

        <div>
          <div className="h-[1px] bg-[#2a2a3a] mb-4"></div>
          <p className="font-mono text-[9px] text-[#525280] tracking-widest uppercase">
            HUD_INTERFACE_V2.0<br/>
            STATUS: ACTIVE // GLITCH_ENG
          </p>
        </div>
      </aside>

      {/* Navigation Topbar (Mobile) */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-[#12121a] border-b border-[#2a2a3a] w-full sticky top-0 z-50">
        <h1 className="font-display font-black text-xl tracking-widest uppercase">
          ETHARA <span className="font-mono text-[8px] tracking-wider font-bold text-[var(--accent)] ml-1">IMS</span>
        </h1>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 border border-[#2a2a3a] text-[var(--accent)] bg-[#0a0a0f] hover:bg-[var(--accent)] hover:text-black transition-colors"
        >
          {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-[60px] left-0 w-full h-[calc(100vh-60px)] bg-[#0d0d14] z-40 flex flex-col p-8 justify-between border-b-2 border-[var(--accent)]">
          <nav className="flex flex-col gap-4">
            <button 
              onClick={() => navigateTo('dashboard')}
              className="w-full text-left px-4 py-4 font-mono text-xs tracking-wider uppercase border border-[#2a2a3a] text-[#8c8cbe] hover:text-[var(--accent)] hover:border-[var(--accent)] flex justify-between items-center cyber-chamfer-sm"
            >
              <span>[01] // DASHBOARD</span>
              <ChevronRight size={14} />
            </button>
            <button 
              onClick={() => navigateTo('products')}
              className="w-full text-left px-4 py-4 font-mono text-xs tracking-wider uppercase border border-[#2a2a3a] text-[#8c8cbe] hover:text-[var(--accent)] hover:border-[var(--accent)] flex justify-between items-center cyber-chamfer-sm"
            >
              <span>[02] // PRODUCTS ({products.length})</span>
              <ChevronRight size={14} />
            </button>
            <button 
              onClick={() => navigateTo('customers')}
              className="w-full text-left px-4 py-4 font-mono text-xs tracking-wider uppercase border border-[#2a2a3a] text-[#8c8cbe] hover:text-[var(--accent)] hover:border-[var(--accent)] flex justify-between items-center cyber-chamfer-sm"
            >
              <span>[03] // CUSTOMERS ({customers.length})</span>
              <ChevronRight size={14} />
            </button>
            <button 
              onClick={() => navigateTo('orders')}
              className="w-full text-left px-4 py-4 font-mono text-xs tracking-wider uppercase border border-[#2a2a3a] text-[#8c8cbe] hover:text-[var(--accent)] hover:border-[var(--accent)] flex justify-between items-center cyber-chamfer-sm"
            >
              <span>[04] // ORDERS ({orders.length})</span>
              <ChevronRight size={14} />
            </button>
          </nav>

          <div className="border-t border-[#2a2a3a] pt-4">
            <p className="font-mono text-[8px] text-[#525280] tracking-widest uppercase">
              ETHARA SYSTEM CONSOLE PORTABLE INTERFACE
            </p>
          </div>
        </div>
      )}

      {/* Main View Container */}
      <main className="flex-1 overflow-y-auto w-full relative">
        {loading && (
          <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--accent)] shadow-[0_0_10px_#00ff88] animate-pulse z-[200]"></div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="bg-[#ff3366] text-black px-8 py-3 border-b-2 border-black font-mono text-xs uppercase tracking-wider flex items-center justify-between font-bold">
            <span className="flex items-center gap-2">
              <ShieldAlert size={14} /> {error}
            </span>
            <button 
              onClick={() => { setError(''); loadData(); }} 
              className="px-3 py-1 border border-black hover:bg-black hover:text-[#ff3366] font-black text-[10px]"
            >
              RETRY_HANDSHAKE()
            </button>
          </div>
        )}

        {/* ================= TAB 1: DASHBOARD ================= */}
        {currentTab === 'dashboard' && (
          <div className="editorial-container">
            {/* High-Tech HUD Sub-Header & Blinking typing cursor intro */}
            <div className="mb-16 select-none relative">
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--accent)] block mb-2">// COGNITIVE STATS CONSOLE</span>
              <h2 className="font-display font-black text-5xl md:text-7xl tracking-widest leading-none text-white select-none">
                OVERVIEW
              </h2>
              <div className="flex items-center justify-between border-b border-[#2a2a3a] pb-4 mt-6">
                <span className="font-mono text-xs uppercase tracking-widest text-[#6b7280] cyber-cursor">
                  DATAFEED SYNC STATUS: NOMINAL // TERMINAL ACTIVE
                </span>
                {/* Visual HUD corner decoration */}
                <div className="w-3 h-3 border-t-2 border-r-2 border-[var(--accent)] select-none"></div>
              </div>
            </div>

            {/* Glowing Hologram Metric Grid Panels with Brackets */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16 select-none">
              
              <div className="p-8 hologram-card cyber-chamfer hover:border-[var(--accent)] hover:shadow-[0_0_15px_rgba(0,255,136,0.2)] transition-all duration-300 group">
                <div className="flex justify-between items-start mb-6">
                  <span className="font-mono text-[9px] tracking-widest uppercase text-[#8c8cbe] group-hover:text-[var(--accent)]">[01] SKU CATALOG</span>
                  <Layers size={16} className="text-[var(--accent)]" />
                </div>
                <div className="font-display font-bold text-5xl leading-none text-white group-hover:text-[var(--accent)] transition-colors">{products.length}</div>
                <div className="font-mono text-[8px] tracking-wider uppercase mt-4 text-[#525280]">ACTIVE DATASETS</div>
              </div>

              <div className="p-8 hologram-card cyber-chamfer hover:border-[var(--accent)] hover:shadow-[0_0_15px_rgba(0,255,136,0.2)] transition-all duration-300 group">
                <div className="flex justify-between items-start mb-6">
                  <span className="font-mono text-[9px] tracking-widest uppercase text-[#8c8cbe] group-hover:text-[var(--accent)]">[02] CLIENT NODES</span>
                  <Users size={16} className="text-[var(--accent)]" />
                </div>
                <div className="font-display font-bold text-5xl leading-none text-white group-hover:text-[var(--accent)] transition-colors">{customers.length}</div>
                <div className="font-mono text-[8px] tracking-wider uppercase mt-4 text-[#525280]">REGISTERED ENTITIES</div>
              </div>

              <div className="p-8 hologram-card cyber-chamfer hover:border-[var(--accent)] hover:shadow-[0_0_15px_rgba(0,255,136,0.2)] transition-all duration-300 group">
                <div className="flex justify-between items-start mb-6">
                  <span className="font-mono text-[9px] tracking-widest uppercase text-[#8c8cbe] group-hover:text-[var(--accent)]">[03] SALES MATRIX</span>
                  <ShoppingBag size={16} className="text-[var(--accent)]" />
                </div>
                <div className="font-display font-bold text-5xl leading-none text-white group-hover:text-[var(--accent)] transition-colors">{orders.length}</div>
                <div className="font-mono text-[8px] tracking-wider uppercase mt-4 text-[#525280]">TRANSACTION BLOCKS</div>
              </div>

              <div className="p-8 hologram-card cyber-chamfer hover:border-[var(--accent-secondary)] hover:shadow-[0_0_15px_rgba(255,0,255,0.2)] border-rgba(255,0,255,0.2) transition-all duration-300 group">
                {/* glowing secondary box corner tags */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[var(--accent-secondary)]"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[var(--accent-secondary)]"></div>
                <div className="flex justify-between items-start mb-6">
                  <span className="font-mono text-[9px] tracking-widest uppercase text-[#8c8cbe] group-hover:text-[var(--accent-secondary)]">[04] STOCK CRISES</span>
                  <AlertTriangle size={16} className="text-[var(--accent-secondary)]" />
                </div>
                <div className="font-display font-bold text-5xl leading-none text-white group-hover:text-[var(--accent-secondary)] transition-colors">
                  {lowStockProductsCount}
                </div>
                <div className="font-mono text-[8px] tracking-wider uppercase mt-4 text-[#525280]">SKU DEPLETION WARNINGS</div>
              </div>

            </section>

            {/* Layout strategy Grid trace section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Electric Green matrix Velocity graph */}
              <div className="lg:col-span-8 hologram-card p-8 cyber-chamfer relative overflow-hidden">
                {/* Glowing neon green grids */}
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,255,136,0.01)] to-transparent pointer-events-none"></div>
                <h3 className="font-display font-bold text-lg uppercase mb-6 tracking-wider flex items-center justify-between text-white">
                  <span>METRIC VELOCITY DIAGRAM</span>
                  <TrendingUp size={16} className="text-[var(--accent)]" />
                </h3>
                
                {/* Dynamic neon charts */}
                <div className="h-64 flex items-end justify-between gap-4 border-b border-[#2a2a3a] pt-8 px-4">
                  {products.slice(0, 8).map((prod, i) => {
                    const maxQty = Math.max(...products.map(p => p.quantity_in_stock), 1);
                    const pct = Math.max((prod.quantity_in_stock / maxQty) * 100, 4);
                    return (
                      <div key={prod.id} className="flex flex-col items-center flex-1 group">
                        <span className="font-mono text-[9px] text-[var(--accent)] opacity-0 group-hover:opacity-100 mb-1 transition-opacity duration-150 select-none">
                          {prod.quantity_in_stock}
                        </span>
                        {/* Glow and height transition */}
                        <div 
                          className="w-full bg-[var(--accent)] opacity-70 group-hover:opacity-100 cursor-pointer shadow-[0_0_8px_rgba(0,255,136,0.4)]"
                          style={{ height: `${pct * 1.5}px`, transition: 'all 200ms ease' }}
                        ></div>
                        <span className="font-mono text-[8px] tracking-widest uppercase truncate w-full text-center mt-2 text-[#525280] group-hover:text-white">
                          {prod.sku}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between items-center mt-4">
                  <p className="font-mono text-[8px] text-[#525280] uppercase">
                    NEON HISTOGRAM QUANTIFYING COGNITIVE DATASET VELOCITIES
                  </p>
                  <button onClick={() => navigateTo('products')} className="btn-ghost">
                    EXPAND INVENTORY // <ChevronRight size={12} />
                  </button>
                </div>
              </div>

              {/* Terminal panel quick actions */}
              <div className="lg:col-span-4 hologram-card p-8 flex flex-col justify-between cyber-chamfer">
                <div>
                  <h3 className="font-display font-bold text-lg uppercase mb-6 tracking-wider text-white">SYS_COMMAND_PROMPTS</h3>
                  <p className="font-body text-xs text-[#8c8cbe] mb-6">
                    Launch immediate database injection and transaction executions below:
                  </p>

                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => navigateTo('orders')}
                      className="btn-primary w-full justify-between"
                    >
                      <span>GENERATE ORDER TRANSACTION</span>
                      <Plus size={14} />
                    </button>
                    
                    <button 
                      onClick={() => navigateTo('products')}
                      className="btn-secondary w-full justify-between"
                    >
                      <span>INJECT NEW PRODUCT SKU</span>
                      <Plus size={14} />
                    </button>

                    <button 
                      onClick={() => navigateTo('customers')}
                      className="btn-ghost w-full justify-between hover:text-[var(--accent-tertiary)] hover:border-[var(--accent-tertiary)]"
                    >
                      <span>REGISTER CUSTOMER NODE</span>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-[#2a2a3a]">
                  <span className="font-mono text-[9px] uppercase text-[#525280] block mb-1">DATASTREAM ENCRYPTION</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[var(--accent)] animate-ping rounded-none select-none"></span>
                    <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-[var(--accent)]">ONLINE // SECURED FEED</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Cyber terminal decorative block */}
            <div className="border-t border-[#2a2a3a] my-16"></div>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-12 select-none">
              <div>
                <p className="font-body text-xs leading-relaxed text-[#8c8cbe]">
                  <span className="text-[var(--accent)] font-bold font-mono block mb-2">[CRIT_ESTIMATES]</span>
                  Ethara Systems represents the pinnacle of operational security and high-tech inventory execution. 
                  By utilizing secure transaction blocks, real-time overdraw locking parameters, and fully cascading schema purges, your logistics datalink remains safe from concurrency threats. System speeds are calibrated at high-velocity rates.
                </p>
              </div>
              <div className="border-l border-[var(--accent-secondary)] pl-8 py-2 flex flex-col justify-between">
                <blockquote className="font-mono text-sm leading-normal text-[var(--accent-secondary)] text-shadow-sm italic">
                  "THE SPILL FLICKERS UNDER CORRUPTED SKY. SYSTEMS DECAY, BUT THE DATASTREAM REMAINS PURE."
                </blockquote>
                <cite className="font-mono text-[9px] tracking-[0.2em] uppercase block mt-4 font-bold not-italic text-[#6b7280]">
                  // CORE_ENG_LOG_BLOCK40
                </cite>
              </div>
            </section>

          </div>
        )}

        {/* ================= TAB 2: PRODUCTS ================= */}
        {currentTab === 'products' && (
          <div className="editorial-container">
            {/* Header */}
            <div className="mb-12">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">[SYSTEM_MODULE: INVENTORY_DB]</span>
              <h2 className="font-display font-black text-4xl uppercase tracking-wider text-white mt-1">PRODUCT CATALOG</h2>
              <div className="h-[1px] bg-[#2a2a3a] mt-4"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Product input console */}
              <div className="lg:col-span-4 hologram-card p-8 h-fit cyber-chamfer">
                <h3 className="font-display font-bold text-lg uppercase mb-6 tracking-wide text-white">
                  {editProduct ? '// UPDATE_PRODUCT_DATA' : '// INJECT_NEW_PRODUCT'}
                </h3>
                
                <form onSubmit={editProduct ? handleProductUpdate : handleProductCreate} className="flex flex-col gap-6">
                  <div>
                    <label className="form-label">PRODUCT_LABEL</label>
                    <div className="input-wrapper cyber-chamfer-sm">
                      <input 
                        type="text" 
                        placeholder="e.g. StarkDesk Lamp" 
                        className="input-field"
                        value={editProduct ? editProduct.name : productForm.name}
                        onChange={(e) => editProduct 
                          ? setEditProduct({ ...editProduct, name: e.target.value })
                          : setProductForm({ ...productForm, name: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">SKU_IDENTIFIER</label>
                    <div className="input-wrapper cyber-chamfer-sm">
                      <input 
                        type="text" 
                        placeholder="e.g. LIGHT-003" 
                        className="input-field uppercase font-mono"
                        value={editProduct ? editProduct.sku : productForm.sku}
                        onChange={(e) => editProduct 
                          ? setEditProduct({ ...editProduct, sku: e.target.value.toUpperCase() })
                          : setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">VAL_PRICE</label>
                      <div className="input-wrapper cyber-chamfer-sm">
                        <input 
                          type="number" 
                          step="0.01" 
                          min="0.01" 
                          placeholder="180.00" 
                          className="input-field font-mono"
                          value={editProduct ? editProduct.price : productForm.price}
                          onChange={(e) => editProduct 
                            ? setEditProduct({ ...editProduct, price: e.target.value })
                            : setProductForm({ ...productForm, price: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="form-label">QTY_STOCK</label>
                      <div className="input-wrapper cyber-chamfer-sm">
                        <input 
                          type="number" 
                          min="0" 
                          placeholder="4" 
                          className="input-field font-mono"
                          value={editProduct ? editProduct.quantity_in_stock : productForm.quantity_in_stock}
                          onChange={(e) => editProduct 
                            ? setEditProduct({ ...editProduct, quantity_in_stock: e.target.value })
                            : setProductForm({ ...productForm, quantity_in_stock: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 mt-4">
                    <button type="submit" className="btn-primary w-full justify-center">
                      {editProduct ? 'PATCH SKU BLOCK' : 'COMMIT SKU INJECTION'}
                    </button>
                    {editProduct && (
                      <button 
                        type="button" 
                        onClick={() => setEditProduct(null)} 
                        className="btn-secondary w-full justify-center"
                      >
                        ABORT PATCH
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Product catalog terminal listing */}
              <div className="lg:col-span-8">
                
                {/* Search */}
                <div className="mb-6 flex gap-4">
                  <div className="input-wrapper cyber-chamfer-sm flex-1">
                    <input 
                      type="text" 
                      placeholder="FILTER BY SKU OR PRODUCT_LABEL..." 
                      className="input-field uppercase font-mono text-xs tracking-widest text-[var(--accent)]"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Cyberpunk high-glow table */}
                <div className="border border-[#2a2a3a] hologram-card cyber-chamfer overflow-hidden">
                  <table className="w-full text-left border-collapse font-mono text-xs">
                    <thead>
                      <tr className="bg-[#12121a] text-[var(--accent)] uppercase tracking-widest border-b border-[#2a2a3a]">
                        <th className="py-4 px-6 font-bold">SKU</th>
                        <th className="py-4 px-6 font-bold">LABEL</th>
                        <th className="py-4 px-6 font-bold text-right">VAL_PRICE</th>
                        <th className="py-4 px-6 font-bold text-right">QUANTITY</th>
                        <th className="py-4 px-6 font-bold text-center">COMMAND</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a3a] text-[#c0c0d8]">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-[#525280] uppercase tracking-widest">
                            ERROR: NO SKU MATCHES RETURNED BY QUERY
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((p) => {
                          const isLowStock = p.quantity_in_stock <= LOW_STOCK_THRESHOLD && p.quantity_in_stock > 0;
                          const isOutOfStock = p.quantity_in_stock === 0;

                          return (
                            <tr key={p.id} className="hover:bg-[rgba(0,255,136,0.02)] transition-colors duration-150">
                              <td className="py-4 px-6 font-bold text-[var(--accent-tertiary)]">{p.sku}</td>
                              <td className="py-4 px-6">
                                <span className="font-display font-bold block text-white">{p.name}</span>
                                <span className="text-[8px] text-[#525280] block">
                                  LAST_PATCH: {new Date(p.updated_at).toLocaleString()}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right font-bold text-[#fff]">${p.price.toFixed(2)}</td>
                              <td className="py-4 px-6 text-right">
                                <div className="flex flex-col items-end gap-1">
                                  <span className="font-bold text-[#fff]">{p.quantity_in_stock}</span>
                                  {isLowStock && (
                                    <span className="border border-[var(--accent-secondary)] px-2 py-0.5 text-[8px] font-bold tracking-widest uppercase text-[var(--accent-secondary)] shadow-[0_0_5px_rgba(255,0,255,0.3)]">
                                      [LOW_STOCK]
                                    </span>
                                  )}
                                  {isOutOfStock && (
                                    <span className="bg-[#ff3366] text-black font-bold px-2 py-0.5 text-[8px] tracking-widest uppercase shadow-[0_0_5px_rgba(255,51,102,0.3)]">
                                      [DEPLETED]
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex gap-2 justify-center">
                                  <button 
                                    onClick={() => setEditProduct(p)} 
                                    className="p-2 border border-[#2a2a3a] text-[var(--accent)] hover:border-[var(--accent)] hover:shadow-neon transition-all"
                                    title="Edit Product"
                                  >
                                    <Edit3 size={12} />
                                  </button>
                                  <button 
                                    onClick={() => setDeleteConfirm({ show: true, type: 'product', id: p.id })} 
                                    className="p-2 border border-[#2a2a3a] text-[#ff3366] hover:border-[#ff3366] hover:shadow-[0_0_6px_rgba(255,51,102,0.4)] transition-all"
                                    title="Delete Product"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ================= TAB 3: CUSTOMERS ================= */}
        {currentTab === 'customers' && (
          <div className="editorial-container">
            {/* Header */}
            <div className="mb-12">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">[SYSTEM_MODULE: CLIENT_NODES]</span>
              <h2 className="font-display font-black text-4xl uppercase tracking-wider text-white mt-1">CLIENT ARCHIVE</h2>
              <div className="h-[1px] bg-[#2a2a3a] mt-4"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Customer inputs */}
              <div className="lg:col-span-4 hologram-card p-8 h-fit cyber-chamfer">
                <h3 className="font-display font-bold text-lg uppercase mb-6 tracking-wide text-white">// INJECT_CLIENT_NODE</h3>
                
                <form onSubmit={handleCustomerCreate} className="flex flex-col gap-6">
                  <div>
                    <label className="form-label">CLIENT_FULLNAME</label>
                    <div className="input-wrapper cyber-chamfer-sm">
                      <input 
                        type="text" 
                        placeholder="e.g. Charlotte Perriand" 
                        className="input-field"
                        value={customerForm.full_name}
                        onChange={(e) => setCustomerForm({ ...customerForm, full_name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">CLIENT_EMAIL</label>
                    <div className="input-wrapper cyber-chamfer-sm">
                      <input 
                        type="email" 
                        placeholder="e.g. charlotte@cassina.fr" 
                        className="input-field"
                        value={customerForm.email}
                        onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">VAL_PHONE_NUMBER</label>
                    <div className="input-wrapper cyber-chamfer-sm">
                      <input 
                        type="text" 
                        placeholder="e.g. +33 6 12345678" 
                        className="input-field font-mono"
                        value={customerForm.phone_number}
                        onChange={(e) => setCustomerForm({ ...customerForm, phone_number: e.target.value })}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary w-full justify-center mt-4">
                    COMMIT CLIENT NODE
                  </button>
                </form>
              </div>

              {/* Customer table */}
              <div className="lg:col-span-8">
                
                {/* Search */}
                <div className="mb-6">
                  <div className="input-wrapper cyber-chamfer-sm">
                    <input 
                      type="text" 
                      placeholder="FILTER BY CLIENT NAME OR REGISTERED_EMAIL..." 
                      className="input-field uppercase font-mono text-xs tracking-widest text-[var(--accent)]"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Table */}
                <div className="border border-[#2a2a3a] hologram-card cyber-chamfer overflow-hidden">
                  <table className="w-full text-left border-collapse font-mono text-xs">
                    <thead>
                      <tr className="bg-[#12121a] text-[var(--accent)] uppercase tracking-widest border-b border-[#2a2a3a]">
                        <th className="py-4 px-6 font-bold">CLIENT NAME</th>
                        <th className="py-4 px-6 font-bold">DATALINK_EMAIL</th>
                        <th className="py-4 px-6 font-bold">COMMS_PHONE</th>
                        <th className="py-4 px-6 font-bold text-center">PURGE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a3a] text-[#c0c0d8]">
                      {filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-[#525280] uppercase tracking-widest">
                            ERROR: DATAFEED RETURNED ZERO CLIENT STACKS
                          </td>
                        </tr>
                      ) : (
                        filteredCustomers.map((c) => (
                          <tr key={c.id} className="hover:bg-[rgba(0,255,136,0.02)] transition-colors duration-150">
                            <td className="py-4 px-6">
                              <span className="font-display font-bold block text-white">{c.full_name}</span>
                              <span className="text-[8px] text-[#525280] block">
                                REGISTER_STAMP: {new Date(c.created_at).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-semibold text-[var(--accent-tertiary)]">{c.email}</td>
                            <td className="py-4 px-6 text-[#fff]">{c.phone_number || '—'}</td>
                            <td className="py-4 px-6 text-center">
                              <button 
                                onClick={() => setDeleteConfirm({ show: true, type: 'customer', id: c.id })} 
                                className="p-2 border border-[#2a2a3a] text-[#ff3366] hover:border-[#ff3366] hover:shadow-[0_0_6px_rgba(255,51,102,0.4)] transition-all"
                                title="Purge Customer Record"
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ================= TAB 4: ORDERS ================= */}
        {currentTab === 'orders' && (
          <div className="editorial-container">
            {/* Header */}
            <div className="mb-12">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">[SYSTEM_MODULE: SALES_BLOCS]</span>
              <h2 className="font-display font-black text-4xl uppercase tracking-wider text-white mt-1">TRANSACT REGISTRY</h2>
              <div className="h-[1px] bg-[#2a2a3a] mt-4"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Order form console */}
              <div className="lg:col-span-5 hologram-card p-8 h-fit cyber-chamfer">
                <h3 className="font-display font-bold text-lg uppercase mb-6 tracking-wide text-white">// COMPILE_TRANSACT_ORDER</h3>
                
                <form onSubmit={handleOrderCreate} className="flex flex-col gap-6">
                  {/* Select Customer */}
                  <div>
                    <label className="form-label">TARGET_CLIENT_NODE</label>
                    <div className="input-wrapper cyber-chamfer-sm">
                      <select 
                        className="input-field font-mono font-bold text-xs bg-[#12121a] text-white focus:outline-none"
                        value={orderForm.customer_id}
                        onChange={(e) => setOrderForm({ ...orderForm, customer_id: e.target.value })}
                        required
                      >
                        <option value="">SELECT TARGET DECODER...</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id} className="bg-[#12121a]">{c.full_name} ({c.email})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="h-[1px] bg-[#2a2a3a] my-2"></div>

                  {/* Add Order Item */}
                  <div>
                    <h4 className="font-mono text-xs uppercase tracking-wider font-bold mb-4 text-[var(--accent-secondary)]">[ADD SKU TO TRANSACT]</h4>
                    
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="form-label">INVENTORY_SKU</label>
                        <div className="input-wrapper cyber-chamfer-sm">
                          <select 
                            className="input-field font-mono text-xs bg-[#12121a] text-white focus:outline-none"
                            value={newOrderItem.product_id}
                            onChange={(e) => setNewOrderItem({ ...newOrderItem, product_id: e.target.value })}
                          >
                            <option value="">SELECT SOURCE CODE...</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id} disabled={p.quantity_in_stock === 0} className="bg-[#12121a]">
                                {p.sku} // {p.name} (${p.price.toFixed(2)}) [QTY: {p.quantity_in_stock}]
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                          <label className="form-label">PURCHASE_QTY</label>
                          <div className="input-wrapper cyber-chamfer-sm">
                            <input 
                              type="number" 
                              min="1" 
                              className="input-field font-mono"
                              value={newOrderItem.quantity}
                              onChange={(e) => setNewOrderItem({ ...newOrderItem, quantity: parseInt(e.target.value) })}
                            />
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={addOrderItem}
                          className="btn-secondary h-fit py-3 px-6"
                        >
                          STAGE SKU
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Staged Items List */}
                  <div className="mt-4">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#525280] block mb-2">[STAGED TRANSACTION BLOCKS]</span>
                    
                    {orderForm.items.length === 0 ? (
                      <div className="border border-dashed border-[#2a2a3a] p-4 text-center font-mono text-[9px] uppercase text-[#525280]">
                        EMPTY BASKET PROTOCOLS: ADD STAGE ITEMS
                      </div>
                    ) : (
                      <div className="border border-[#2a2a3a] divide-y divide-[#2a2a3a] max-h-48 overflow-y-auto font-mono text-xs">
                        {orderForm.items.map((item, index) => (
                          <div key={index} className="p-3 flex justify-between items-center hover:bg-[rgba(0,255,136,0.02)]">
                            <div>
                              <span className="font-bold text-[var(--accent)] block">{item.sku}</span>
                              <span className="text-[10px] text-[#8c8cbe]">{item.name} x {item.quantity}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-white">${(item.price * item.quantity).toFixed(2)}</span>
                              <button 
                                type="button" 
                                onClick={() => removeOrderItem(index)}
                                className="text-[#ff3366] hover:opacity-60"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Live subtotal */}
                  <div className="border-t border-[#2a2a3a] pt-4 flex justify-between items-center select-none">
                    <span className="font-mono text-xs uppercase tracking-wider font-bold text-[#8c8cbe]">Live Transact Sum:</span>
                    <span className="font-display font-bold text-2xl text-[var(--accent)] shadow-sm">${orderTotalLive.toFixed(2)}</span>
                  </div>

                  <button 
                    type="submit" 
                    className="btn-primary w-full justify-center mt-2"
                    disabled={orderForm.items.length === 0 || !orderForm.customer_id}
                  >
                    PLACE ORDER & DEDUCT STOCKS
                  </button>
                </form>
              </div>

              {/* Order Transaction listing */}
              <div className="lg:col-span-7">
                <span className="font-mono text-xs uppercase tracking-widest text-[#525280] block mb-6">[TRANSACT HISTORY LOGGER]</span>
                
                {/* Table */}
                <div className="border border-[#2a2a3a] hologram-card cyber-chamfer overflow-hidden">
                  <table className="w-full text-left border-collapse font-mono text-xs">
                    <thead>
                      <tr className="bg-[#12121a] text-[var(--accent)] uppercase tracking-widest border-b border-[#2a2a3a]">
                        <th className="py-4 px-6 font-bold">TRANSACT_ID</th>
                        <th className="py-4 px-6 font-bold">CLIENT NODE</th>
                        <th className="py-4 px-6 font-bold text-right">VAL_SUM</th>
                        <th className="py-4 px-6 font-bold text-center">CONTROL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a3a] text-[#c0c0d8]">
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-[#525280] uppercase tracking-widest">
                            ERROR: NO COMPLETED SALES BLOCS DETECTED
                          </td>
                        </tr>
                      ) : (
                        orders.map((o) => (
                          <tr key={o.id} className="hover:bg-[rgba(0,255,136,0.02)] transition-colors duration-150">
                            <td className="py-4 px-6 text-[var(--accent-tertiary)] font-bold">
                              #TRX-{String(o.id).padStart(4, '0')}
                              <span className="block font-normal text-[8px] text-[#525280]">
                                {new Date(o.created_at).toLocaleString()}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-display font-bold block text-white">{o.customer?.full_name || 'Dieter Rams'}</span>
                              <span className="text-[8px] text-[#525280] block">
                                {o.customer?.email}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right font-bold text-white">
                              ${o.total_amount.toFixed(2)}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex gap-2 justify-center">
                                <button 
                                  onClick={() => setSelectedOrder(o)} 
                                  className="p-2 border border-[#2a2a3a] text-[var(--accent)] hover:border-[var(--accent)] hover:shadow-neon transition-all"
                                  title="View Order Details"
                                >
                                  <Eye size={12} />
                                </button>
                                <button 
                                  onClick={() => setDeleteConfirm({ show: true, type: 'order', id: o.id })} 
                                  className="p-2 border border-[#2a2a3a] text-[#ff3366] hover:border-[#ff3366] hover:shadow-[0_0_6px_rgba(255,51,102,0.4)] transition-all"
                                  title="Cancel/Rollback Order"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* ================= MODAL: ORDER DETAILS (Holographic Overlay) ================= */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#12121a] border-2 border-[var(--accent)] w-full max-w-2xl p-8 relative cyber-chamfer shadow-[0_0_30px_rgba(0,255,136,0.15)]" style={{ transition: 'all 150ms ease' }}>
            
            {/* HUD Bracket overlays */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--accent)]"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[var(--accent)]"></div>

            {/* Close Button */}
            <button 
              onClick={() => setSelectedOrder(null)}
              className="absolute top-6 right-6 p-2 border border-[#2a2a3a] text-[var(--accent)] hover:border-[var(--accent)] hover:shadow-neon transition-colors"
            >
              <X size={16} />
            </button>

            {/* Header info */}
            <div className="mb-6">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">[SYSTEM: ORDER_INSPECT]</span>
              <h3 className="font-display font-black text-2xl uppercase tracking-wider text-white mt-1">
                TRANSACTION #TRX-{String(selectedOrder.id).padStart(4, '0')}
              </h3>
              <p className="font-mono text-[9px] text-[#525280] mt-1">
                INVENTORY BLOCK WRITE TIME: {new Date(selectedOrder.created_at).toLocaleString()}
              </p>
            </div>

            <div className="h-[1px] bg-[#2a2a3a] my-4"></div>

            {/* Customer Details */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div>
                <span className="form-label">DECODER_CLIENT_NODE</span>
                <span className="font-display font-bold text-md block text-white">{selectedOrder.customer?.full_name}</span>
                <span className="font-mono text-xs text-[var(--accent-tertiary)] block">{selectedOrder.customer?.email}</span>
              </div>
              <div>
                <span className="form-label">DATALINK_PHONE</span>
                <span className="font-mono text-xs block text-white">{selectedOrder.customer?.phone_number || '—'}</span>
              </div>
            </div>

            <div className="h-[1px] bg-[#2a2a3a] my-4"></div>

            {/* Ordered Items Table */}
            <div className="mb-6 max-h-48 overflow-y-auto border border-[#2a2a3a]">
              <table className="w-full text-left border-collapse font-mono text-[10px]">
                <thead>
                  <tr className="bg-[#0a0a0f] text-[var(--accent)] uppercase tracking-wider border-b border-[#2a2a3a]">
                    <th className="p-3 font-bold">SKU</th>
                    <th className="p-3 font-bold">LABEL</th>
                    <th className="p-3 text-right font-bold">VAL_UNIT_PRICE</th>
                    <th className="p-3 text-right font-bold">STAGED</th>
                    <th className="p-3 text-right font-bold">SUM_TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a3a] text-[#c0c0d8]">
                  {selectedOrder.items.map((item) => (
                    <tr key={item.id} className="hover:bg-[rgba(0,255,136,0.02)]">
                      <td className="p-3 font-bold text-[var(--accent-tertiary)]">{item.product?.sku || 'SKU'}</td>
                      <td className="p-3 font-body text-white">{item.product?.name || 'Product'}</td>
                      <td className="p-3 text-right">${item.unit_price.toFixed(2)}</td>
                      <td className="p-3 text-right text-white font-bold">{item.quantity}</td>
                      <td className="p-3 text-right text-[var(--accent)] font-bold">${item.line_total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Aggregate */}
            <div className="flex justify-between items-center border-t-2 border-[#2a2a3a] pt-4 select-none">
              <span className="font-mono text-xs uppercase tracking-wider font-bold text-[#8c8cbe]">AGGREGATE SUM:</span>
              <span className="font-display font-black text-2xl text-[var(--accent)] shadow-sm">${selectedOrder.total_amount.toFixed(2)}</span>
            </div>

            {/* Close footer button */}
            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="btn-primary px-8"
              >
                DISMISS INSPECTOR
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL: GENERIC CONFIRMATION (Glow HUD Panels) ================= */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#12121a] border-2 border-[#ff3366] w-full max-w-md p-8 relative cyber-chamfer shadow-[0_0_30px_rgba(255,51,102,0.15)]">
            
            {/* HUD pink border brackets */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#ff3366]"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#ff3366]"></div>

            <h3 className="font-display font-black text-xl uppercase tracking-wider mb-4 text-[#ff3366]">
              // DESTRUCTIVE_TRIGGER_WARNING
            </h3>
            
            <p className="font-body text-xs leading-relaxed text-[#c0c0d8] mb-8">
              {deleteConfirm.type === 'order' && 'PURGE_WARNING: Cancelling this transaction block will permanently drop the database logs and immediately replenish the staged quantities back to inventory stock engines.'}
              {deleteConfirm.type === 'product' && 'PURGE_WARNING: Deleting this product SKU will wipe its catalog records. Historical orders references will remain intact but product metadata will be detached.'}
              {deleteConfirm.type === 'customer' && 'PURGE_WARNING: Cascade deletes are active. Purging this customer node will cascade destroy their historical sales log blocks completely.'}
            </p>

            <div className="flex gap-4 justify-end">
              <button 
                onClick={() => setDeleteConfirm({ show: false, type: '', id: null })}
                className="btn-secondary"
              >
                ABORT FORCE
              </button>
              
              <button 
                onClick={() => {
                  if (deleteConfirm.type === 'product') handleProductDelete(deleteConfirm.id);
                  if (deleteConfirm.type === 'customer') handleCustomerDelete(deleteConfirm.id);
                  if (deleteConfirm.type === 'order') handleOrderCancel(deleteConfirm.id);
                }}
                className="btn-primary border-[#ff3366] text-[#ff3366] hover:bg-[#ff3366] hover:text-black hover:shadow-[0_0_15px_rgba(255,51,102,0.4)]"
                style={{ borderColor: '#ff3366', color: '#ff3366' }}
              >
                CONFIRM PURGE
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
