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
  ShieldAlert,
  Search,
  CheckCircle,
  FileText
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
      setError('Database synchronization error. Please ensure the backend server is online.');
      showToast('Datalink handshake failed.', 'error');
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
      showToast('Please fill out all product details.', 'error');
      return;
    }
    try {
      await api.products.create({
        name: productForm.name,
        sku: productForm.sku,
        price: parseFloat(productForm.price),
        quantity_in_stock: parseInt(productForm.quantity_in_stock)
      });
      showToast(`SKU ${productForm.sku} successfully added to database.`);
      setProductForm({ name: '', sku: '', price: '', quantity_in_stock: '' });
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleProductUpdate = async (e) => {
    e.preventDefault();
    if (!editProduct.name || !editProduct.sku || !editProduct.price || editProduct.quantity_in_stock === '') {
      showToast('Please fill out all product details.', 'error');
      return;
    }
    try {
      await api.products.update(editProduct.id, {
        name: editProduct.name,
        sku: editProduct.sku,
        price: parseFloat(editProduct.price),
        quantity_in_stock: parseInt(editProduct.quantity_in_stock)
      });
      showToast(`SKU ${editProduct.sku} successfully updated.`);
      setEditProduct(null);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleProductDelete = async (id) => {
    try {
      await api.products.delete(id);
      showToast('Product successfully removed from database.');
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
      showToast('Please fill out customer name and email.', 'error');
      return;
    }
    try {
      await api.customers.create(customerForm);
      showToast(`Customer node successfully registered.`);
      setCustomerForm({ full_name: '', email: '', phone_number: '' });
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCustomerDelete = async (id) => {
    try {
      await api.customers.delete(id);
      showToast('Customer record successfully purged.');
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
      showToast('Please select a product and valid quantity.', 'error');
      return;
    }

    const selectedProduct = products.find(p => p.id === parseInt(newOrderItem.product_id));
    if (!selectedProduct) return;

    // Check inventory availability (front-end check)
    if (selectedProduct.quantity_in_stock < newOrderItem.quantity) {
      showToast(`Insufficient stock: only ${selectedProduct.quantity_in_stock} items remaining in inventory.`, 'error');
      return;
    }

    // Check if product already exists in item list, update quantity
    const existingIndex = orderForm.items.findIndex(item => item.product_id === selectedProduct.id);
    if (existingIndex > -1) {
      const updatedItems = [...orderForm.items];
      const newQty = updatedItems[existingIndex].quantity + parseInt(newOrderItem.quantity);
      
      if (selectedProduct.quantity_in_stock < newQty) {
        showToast(`Cannot exceed total available stock (${selectedProduct.quantity_in_stock}).`, 'error');
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
      showToast('Please select a customer for this order.', 'error');
      return;
    }
    if (orderForm.items.length === 0) {
      showToast('Please add at least one item to stage this order.', 'error');
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
      showToast('Transaction settled. Inventory stock levels updated.');
      
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
      showToast('Transaction successfully rolled back. Catalog stocks replenished.');
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
    <div className="min-h-screen bg-[#0b0b12] text-[#f3f4f6] flex flex-col md:flex-row relative">
      
      {/* Dynamic Toast System */}
      {toast.show && (
        <div 
          className="fixed bottom-8 right-8 z-[1000] border border-[#2a2d3a] bg-[#12131a] text-[#fff] px-6 py-4 flex items-center justify-between gap-4 max-w-sm cursor-pointer shadow-lg rounded-lg"
          style={{ transition: 'all 150ms ease' }}
          onClick={() => setToast(prev => ({ ...prev, show: false }))}
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-wider font-bold text-[var(--accent)]">
              [INFO]
            </span>
            <span className="text-xs font-semibold leading-tight">{toast.message}</span>
          </div>
          <X size={14} className="text-[#9ca3af] hover:text-[#fff]" />
        </div>
      )}

      {/* Navigation Sidebar (Desktop B2B Console) */}
      <aside className="hidden md:flex flex-col w-72 bg-[#12131a] border-r border-[#2a2d3a] p-8 shrink-0 justify-between select-none">
        <div>
          {/* Logo Brand - Sleek Sans-Serif Enterprise Header */}
          <div className="mb-12">
            <h1 className="font-display font-bold text-2xl tracking-tight uppercase leading-none text-white">
              ETHARA
              <span className="block font-mono text-[9px] font-bold tracking-[0.25em] mt-3 text-[var(--accent)]">ENTERPRISE CONSOLE</span>
            </h1>
          </div>

          <nav className="flex flex-col gap-2">
            <button 
              onClick={() => navigateTo('dashboard')}
              className={`w-full text-left px-4 py-3 font-mono text-[10px] tracking-wider uppercase flex justify-between items-center transition-all duration-150 border-l-2 rounded-md ${currentTab === 'dashboard' ? 'bg-[#171924] border-[var(--accent)] text-white font-semibold' : 'border-transparent text-[#9ca3af] hover:text-white hover:bg-[#171924]/50'}`}
            >
              <span>Dashboard Overview</span>
              <Terminal size={12} className={currentTab === 'dashboard' ? 'text-[var(--accent)]' : 'opacity-40'} />
            </button>
            <button 
              onClick={() => navigateTo('products')}
              className={`w-full text-left px-4 py-3 font-mono text-[10px] tracking-wider uppercase flex justify-between items-center transition-all duration-150 border-l-2 rounded-md ${currentTab === 'products' ? 'bg-[#171924] border-[var(--accent)] text-white font-semibold' : 'border-transparent text-[#9ca3af] hover:text-white hover:bg-[#171924]/50'}`}
            >
              <span>Inventory SKUs ({products.length})</span>
              <Cpu size={12} className={currentTab === 'products' ? 'text-[var(--accent)]' : 'opacity-40'} />
            </button>
            <button 
              onClick={() => navigateTo('customers')}
              className={`w-full text-left px-4 py-3 font-mono text-[10px] tracking-wider uppercase flex justify-between items-center transition-all duration-150 border-l-2 rounded-md ${currentTab === 'customers' ? 'bg-[#171924] border-[var(--accent)] text-white font-semibold' : 'border-transparent text-[#9ca3af] hover:text-white hover:bg-[#171924]/50'}`}
            >
              <span>Customer Nodes ({customers.length})</span>
              <Users size={12} className={currentTab === 'customers' ? 'text-[var(--accent)]' : 'opacity-40'} />
            </button>
            <button 
              onClick={() => navigateTo('orders')}
              className={`w-full text-left px-4 py-3 font-mono text-[10px] tracking-wider uppercase flex justify-between items-center transition-all duration-150 border-l-2 rounded-md ${currentTab === 'orders' ? 'bg-[#171924] border-[var(--accent)] text-white font-semibold' : 'border-transparent text-[#9ca3af] hover:text-white hover:bg-[#171924]/50'}`}
            >
              <span>Transaction Blocs ({orders.length})</span>
              <Activity size={12} className={currentTab === 'orders' ? 'text-[var(--accent)]' : 'opacity-40'} />
            </button>
          </nav>
        </div>

        <div>
          <div className="h-[1px] bg-[#2a2d3a] mb-4"></div>
          <p className="font-mono text-[9px] text-[#555770] tracking-widest uppercase">
            OPERATIONS_FEEDS_v2.0<br/>
            STATUS: SECURE // CONNECTED
          </p>
        </div>
      </aside>

      {/* Navigation Topbar (Mobile) */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-[#12131a] border-b border-[#2a2d3a] w-full sticky top-0 z-50">
        <h1 className="font-display font-bold text-xl tracking-tight uppercase text-white">
          ETHARA <span className="font-mono text-[8px] tracking-wider font-bold text-[var(--accent)] ml-1">IMS</span>
        </h1>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 border border-[#2a2d3a] text-[var(--accent)] bg-[#0b0b12] hover:bg-[var(--accent)] hover:text-white transition-colors"
        >
          {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-[60px] left-0 w-full h-[calc(100vh-60px)] bg-[#0c0c14] z-40 flex flex-col p-8 justify-between border-b border-[var(--accent)]">
          <nav className="flex flex-col gap-4">
            <button 
              onClick={() => navigateTo('dashboard')}
              className="w-full text-left px-4 py-4 font-mono text-xs tracking-wider uppercase border border-[#2a2d3a] text-[#9ca3af] hover:text-[var(--accent)] hover:border-[var(--accent)] flex justify-between items-center rounded-md"
            >
              <span>Dashboard Overview</span>
              <ChevronRight size={14} />
            </button>
            <button 
              onClick={() => navigateTo('products')}
              className="w-full text-left px-4 py-4 font-mono text-xs tracking-wider uppercase border border-[#2a2d3a] text-[#9ca3af] hover:text-[var(--accent)] hover:border-[var(--accent)] flex justify-between items-center rounded-md"
            >
              <span>Inventory Catalog ({products.length})</span>
              <ChevronRight size={14} />
            </button>
            <button 
              onClick={() => navigateTo('customers')}
              className="w-full text-left px-4 py-4 font-mono text-xs tracking-wider uppercase border border-[#2a2d3a] text-[#9ca3af] hover:text-[var(--accent)] hover:border-[var(--accent)] flex justify-between items-center rounded-md"
            >
              <span>Customer Nodes ({customers.length})</span>
              <ChevronRight size={14} />
            </button>
            <button 
              onClick={() => navigateTo('orders')}
              className="w-full text-left px-4 py-4 font-mono text-xs tracking-wider uppercase border border-[#2a2d3a] text-[#9ca3af] hover:text-[var(--accent)] hover:border-[var(--accent)] flex justify-between items-center rounded-md"
            >
              <span>Transaction Blocs ({orders.length})</span>
              <ChevronRight size={14} />
            </button>
          </nav>

          <div className="border-t border-[#2a2d3a] pt-4">
            <p className="font-mono text-[8px] text-[#555770] tracking-widest uppercase">
              ETHARA OPERATIONAL PORTABLE GATEWAY
            </p>
          </div>
        </div>
      )}

      {/* Main View Container */}
      <main className="flex-1 overflow-y-auto w-full relative">
        {loading && (
          <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--accent)] animate-pulse z-[200]"></div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="bg-[#ef4444]/10 text-[#ef4444] px-8 py-3 border-b border-[#ef4444]/20 font-mono text-xs uppercase tracking-wider flex items-center justify-between font-medium">
            <span className="flex items-center gap-2">
              <ShieldAlert size={14} /> {error}
            </span>
            <button 
              onClick={() => { setError(''); loadData(); }} 
              className="px-3 py-1 border border-[#ef4444]/30 hover:bg-[#ef4444]/20 font-bold text-[10px] rounded"
            >
              SYNC_DATABASE()
            </button>
          </div>
        )}

        {/* ================= TAB 1: DASHBOARD ================= */}
        {currentTab === 'dashboard' && (
          <div className="editorial-container">
            {/* Elegant HUD Sub-Header */}
            <div className="mb-10 select-none relative">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)] block mb-1">// Operational Control Center</span>
              <h2 className="font-display font-bold text-3xl tracking-tight text-white select-none">
                System Overview
              </h2>
              <div className="flex items-center justify-between border-b border-[#2a2d3a] pb-4 mt-4">
                <span className="font-mono text-xs text-[#9ca3af]">
                  Database feeds loaded. Operations system report: nominal.
                </span>
              </div>
            </div>

            {/* Standard B2B Elevated Cards */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 select-none">
              
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
                  {products.slice(0, 8).map((prod, i) => {
                    const maxQty = Math.max(...products.map(p => p.quantity_in_stock), 1);
                    const pct = Math.max((prod.quantity_in_stock / maxQty) * 100, 4);
                    return (
                      <div key={prod.id} className="flex flex-col items-center flex-1 group">
                        <span className="font-mono text-[9px] text-[var(--accent)] opacity-0 group-hover:opacity-100 mb-1 transition-opacity duration-150 select-none">
                          {prod.quantity_in_stock}
                        </span>
                        {/* Clean purple block bar */}
                        <div 
                          className="w-full bg-[#3b1d4a] group-hover:bg-[var(--accent)] cursor-pointer rounded-t"
                          style={{ height: `${pct * 1.5}px`, transition: 'all 200ms ease' }}
                        ></div>
                        <span className="font-mono text-[8px] tracking-wider uppercase truncate w-full text-center mt-2 text-[#9ca3af] group-hover:text-white">
                          {prod.sku}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between items-center mt-4">
                  <p className="font-mono text-[8px] text-[#555770] uppercase">
                    Histogram showing inventory quantities per product SKU code.
                  </p>
                  <button onClick={() => navigateTo('products')} className="btn-ghost">
                    Catalog View <ChevronRight size={12} />
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
                      onClick={() => navigateTo('orders')}
                      className="btn-primary w-full justify-between"
                    >
                      <span>New Order Transaction</span>
                      <Plus size={14} />
                    </button>
                    
                    <button 
                      onClick={() => navigateTo('products')}
                      className="btn-secondary w-full justify-between"
                    >
                      <span>Add Product SKU</span>
                      <Plus size={14} />
                    </button>

                    <button 
                      onClick={() => navigateTo('customers')}
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

            {/* Cyber terminal decorative block */}
            <div className="border-t border-[#2a2d3a] my-12"></div>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-12 select-none">
              <div>
                <p className="font-body text-xs leading-relaxed text-[#9ca3af]">
                  <span className="text-[var(--accent)] font-semibold font-mono block mb-2">[PLATFORM SUMMARY]</span>
                  Ethara Systems features absolute B2B catalog protection and transaction processing. By utilizing ACID database transactions, safe overdraw checks, and relational cascade deletes, your backend records are fully isolated from race conditions or partial writes. Spacing and layouts conform to elite operational design.
                </p>
              </div>
              <div className="border-l border-[#2a2d3a] pl-8 py-2 flex flex-col justify-between">
                <blockquote className="font-mono text-xs leading-normal text-[#9ca3af] italic">
                  "Efficiency and visual restraint are the pillars of serious enterprise engineering. Clear data hierarchy ensures rapid operational scanning."
                </blockquote>
                <cite className="font-mono text-[8px] tracking-widest uppercase block mt-4 font-bold not-italic text-[#555770]">
                  // Operational Directive // Ethara AI
                </cite>
              </div>
            </section>

          </div>
        )}

        {/* ================= TAB 2: PRODUCTS ================= */}
        {currentTab === 'products' && (
          <div className="editorial-container">
            {/* Header */}
            <div className="mb-8">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">[Catalog Console]</span>
              <h2 className="font-display font-bold text-2xl uppercase tracking-wider text-white mt-1">Product Inventory</h2>
              <div className="h-[1px] bg-[#2a2d3a] mt-4"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Product input form */}
              <div className="lg:col-span-4 enterprise-card h-fit">
                <h3 className="font-display font-semibold text-sm uppercase mb-6 tracking-wide text-white">
                  {editProduct ? 'Edit SKU Profile' : 'Inject SKU catalog'}
                </h3>
                
                <form onSubmit={editProduct ? handleProductUpdate : handleProductCreate} className="flex flex-col gap-5">
                  <div>
                    <label className="form-label">Product Name</label>
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

                  <div>
                    <label className="form-label">SKU Identifier (Unique)</label>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Unit Price ($)</label>
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
                    <div>
                      <label className="form-label">Catalog Qty</label>
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

                  <div className="flex flex-col gap-2 mt-2">
                    <button type="submit" className="btn-primary w-full justify-center">
                      {editProduct ? 'Save Patch Changes' : 'Commit SKU Registration'}
                    </button>
                    {editProduct && (
                      <button 
                        type="button" 
                        onClick={() => setEditProduct(null)} 
                        className="btn-secondary w-full justify-center"
                      >
                        Abort Modification
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Product catalog listing */}
              <div className="lg:col-span-8">
                
                {/* Search */}
                <div className="mb-6 relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#555770]">
                    <Search size={14} />
                  </span>
                  <input 
                    type="text" 
                    placeholder="Filter products by name or SKU..." 
                    className="input-field uppercase font-mono text-xs tracking-wider pl-9"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>

                {/* Table */}
                <div className="border border-[#2a2d3a] bg-[#12131a] rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#171924] text-[#9ca3af] uppercase tracking-wider border-b border-[#2a2d3a]">
                        <th className="py-4 px-6 font-semibold font-mono">SKU</th>
                        <th className="py-4 px-6 font-semibold">LABEL</th>
                        <th className="py-4 px-6 font-semibold text-right">UNIT PRICE</th>
                        <th className="py-4 px-6 font-semibold text-right">QUANTITY</th>
                        <th className="py-4 px-6 font-semibold text-center">COMMAND</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2d3a] text-[#f3f4f6]">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-[#9ca3af] uppercase tracking-widest font-mono">
                            No records matching query filters.
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((p) => {
                          const isLowStock = p.quantity_in_stock <= LOW_STOCK_THRESHOLD && p.quantity_in_stock > 0;
                          const isOutOfStock = p.quantity_in_stock === 0;

                          return (
                            <tr key={p.id} className="hover:bg-[#171924]/30 transition-colors duration-150">
                              <td className="py-4 px-6 font-bold font-mono text-[var(--accent)]">{p.sku}</td>
                              <td className="py-4 px-6">
                                <span className="font-semibold block text-white">{p.name}</span>
                                <span className="text-[8px] text-[#9ca3af] block font-mono">
                                  LAST PATCHED: {new Date(p.updated_at).toLocaleString()}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right font-semibold font-mono text-white">${p.price.toFixed(2)}</td>
                              <td className="py-4 px-6 text-right">
                                <div className="flex flex-col items-end gap-1 font-mono">
                                  <span className="font-semibold">{p.quantity_in_stock}</span>
                                  {isLowStock && (
                                    <span className="badge badge-warning text-[8px] py-0.5 tracking-wider uppercase font-semibold">
                                      [Low Stock]
                                    </span>
                                  )}
                                  {isOutOfStock && (
                                    <span className="badge badge-error text-[8px] py-0.5 tracking-wider uppercase font-semibold">
                                      [Depleted]
                                    </span>
                                  )}
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
            <div className="mb-8">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">[Client Module]</span>
              <h2 className="font-display font-bold text-2xl uppercase tracking-wider text-white mt-1">Client Database</h2>
              <div className="h-[1px] bg-[#2a2d3a] mt-4"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Customer inputs */}
              <div className="lg:col-span-4 enterprise-card h-fit">
                <h3 className="font-display font-semibold text-sm uppercase mb-6 tracking-wide text-white">Register Client Node</h3>
                
                <form onSubmit={handleCustomerCreate} className="flex flex-col gap-5">
                  <div>
                    <label className="form-label">Client Full Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Charlotte Perriand" 
                      className="input-field"
                      value={customerForm.full_name}
                      onChange={(e) => setCustomerForm({ ...customerForm, full_name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Client Email Address</label>
                    <input 
                      type="email" 
                      placeholder="e.g. charlotte@cassina.fr" 
                      className="input-field"
                      value={customerForm.email}
                      onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Datalink Comms Phone</label>
                    <input 
                      type="text" 
                      placeholder="e.g. +33 6 12345678" 
                      className="input-field font-mono"
                      value={customerForm.phone_number}
                      onChange={(e) => setCustomerForm({ ...customerForm, phone_number: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="btn-primary w-full justify-center mt-2">
                    Inject Client Profile
                  </button>
                </form>
              </div>

              {/* Customer table */}
              <div className="lg:col-span-8">
                
                {/* Search */}
                <div className="mb-6 relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#555770]">
                    <Search size={14} />
                  </span>
                  <input 
                    type="text" 
                    placeholder="Filter clients by name or email..." 
                    className="input-field uppercase font-mono text-xs tracking-wider pl-9"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                </div>

                {/* Table */}
                <div className="border border-[#2a2d3a] bg-[#12131a] rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#171924] text-[#9ca3af] uppercase tracking-wider border-b border-[#2a2d3a]">
                        <th className="py-4 px-6 font-semibold">CLIENT NAME</th>
                        <th className="py-4 px-6 font-semibold">COMMS_EMAIL</th>
                        <th className="py-4 px-6 font-semibold">COMMS_PHONE</th>
                        <th className="py-4 px-6 font-semibold text-center">PURGE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2d3a] text-[#f3f4f6]">
                      {filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-[#9ca3af] uppercase tracking-widest font-mono">
                            No registered client records returned.
                          </td>
                        </tr>
                      ) : (
                        filteredCustomers.map((c) => (
                          <tr key={c.id} className="hover:bg-[#171924]/30 transition-colors duration-150">
                            <td className="py-4 px-6">
                              <span className="font-semibold block text-white">{c.full_name}</span>
                              <span className="text-[8px] text-[#9ca3af] block font-mono">
                                STAGE DATE: {new Date(c.created_at).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-semibold text-[var(--accent)] font-mono">{c.email}</td>
                            <td className="py-4 px-6 text-[#f3f4f6] font-mono">{c.phone_number || '—'}</td>
                            <td className="py-4 px-6 text-center">
                              <button 
                                onClick={() => setDeleteConfirm({ show: true, type: 'customer', id: c.id })} 
                                className="p-2 border border-[#2a2d3a] text-[#9ca3af] hover:border-[#ef4444] hover:text-[#ef4444] rounded transition-all"
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
            <div className="mb-8">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">[Transaction Module]</span>
              <h2 className="font-display font-bold text-2xl uppercase tracking-wider text-white mt-1">Transaction Ledger</h2>
              <div className="h-[1px] bg-[#2a2d3a] mt-4"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Order input form */}
              <div className="lg:col-span-5 enterprise-card h-fit">
                <h3 className="font-display font-semibold text-sm uppercase mb-6 tracking-wide text-white">Compile Transaction</h3>
                
                <form onSubmit={handleOrderCreate} className="flex flex-col gap-5">
                  {/* Select Customer */}
                  <div>
                    <label className="form-label">Operational Client Node</label>
                    <select 
                      className="input-field font-semibold text-xs bg-[#12131a] text-white focus:outline-none"
                      value={orderForm.customer_id}
                      onChange={(e) => setOrderForm({ ...orderForm, customer_id: e.target.value })}
                      required
                    >
                      <option value="">SELECT TARGET PROFILE...</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id} className="bg-[#12131a]">{c.full_name} ({c.email})</option>
                      ))}
                    </select>
                  </div>

                  <div className="h-[1px] bg-[#2a2d3a] my-2"></div>

                  {/* Add Order Item */}
                  <div>
                    <h4 className="font-mono text-xs uppercase tracking-wider font-semibold mb-4 text-[var(--accent)]">[Add Staged SKU]</h4>
                    
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="form-label">Inventory Item</label>
                        <select 
                          className="input-field font-mono text-xs bg-[#12131a] text-white focus:outline-none"
                          value={newOrderItem.product_id}
                          onChange={(e) => setNewOrderItem({ ...newOrderItem, product_id: e.target.value })}
                        >
                          <option value="">SELECT SOURCE CODE...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id} disabled={p.quantity_in_stock === 0} className="bg-[#12131a]">
                              {p.sku} // {p.name} (${p.price.toFixed(2)}) [STOCKS: {p.quantity_in_stock}]
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                          <label className="form-label">Stage Qty</label>
                          <input 
                            type="number" 
                            min="1" 
                            className="input-field font-mono"
                            value={newOrderItem.quantity}
                            onChange={(e) => setNewOrderItem({ ...newOrderItem, quantity: parseInt(e.target.value) })}
                          />
                        </div>
                        <button 
                          type="button" 
                          onClick={addOrderItem}
                          className="btn-secondary h-fit py-2.5 px-5"
                        >
                          Stage SKU
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Staged Items List */}
                  <div className="mt-2">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#9ca3af] block mb-2">[Staged items basket]</span>
                    
                    {orderForm.items.length === 0 ? (
                      <div className="border border-dashed border-[#2a2d3a] p-4 text-center font-mono text-[9px] uppercase text-[#555770] rounded">
                        Staging queue is empty. Stage catalog SKUs above.
                      </div>
                    ) : (
                      <div className="border border-[#2a2d3a] divide-y divide-[#2a2d3a] max-h-48 overflow-y-auto rounded text-xs font-mono">
                        {orderForm.items.map((item, index) => (
                          <div key={index} className="p-3 flex justify-between items-center hover:bg-[#171924]/30">
                            <div>
                              <span className="font-bold text-[var(--accent)] block">{item.sku}</span>
                              <span className="text-[10px] text-[#9ca3af]">{item.name} x {item.quantity}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-white">${(item.price * item.quantity).toFixed(2)}</span>
                              <button 
                                type="button" 
                                onClick={() => removeOrderItem(index)}
                                className="text-[#ef4444] hover:opacity-60"
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
                  <div className="border-t border-[#2a2d3a] pt-4 flex justify-between items-center select-none">
                    <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#9ca3af]">Total Transaction:</span>
                    <span className="font-display font-bold text-2xl text-white">${orderTotalLive.toFixed(2)}</span>
                  </div>

                  <button 
                    type="submit" 
                    className="btn-primary w-full justify-center mt-1"
                    disabled={orderForm.items.length === 0 || !orderForm.customer_id}
                  >
                    Commit Transaction
                  </button>
                </form>
              </div>

              {/* Order Transaction listing */}
              <div className="lg:col-span-7">
                <span className="font-mono text-xs uppercase tracking-widest text-[#555770] block mb-6">[Historical Ledgers]</span>
                
                {/* Table */}
                <div className="border border-[#2a2d3a] bg-[#12131a] rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#171924] text-[#9ca3af] uppercase tracking-wider border-b border-[#2a2d3a]">
                        <th className="py-4 px-6 font-semibold font-mono">TXN_ID</th>
                        <th className="py-4 px-6 font-semibold">CLIENT DECODER</th>
                        <th className="py-4 px-6 font-semibold text-right">VAL_SUM</th>
                        <th className="py-4 px-6 font-semibold text-center">COMMAND</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2d3a] text-[#f3f4f6]">
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-[#9ca3af] uppercase tracking-widest font-mono">
                            No transaction blocks logged to database.
                          </td>
                        </tr>
                      ) : (
                        orders.map((o) => (
                          <tr key={o.id} className="hover:bg-[#171924]/30 transition-colors duration-150">
                            <td className="py-4 px-6 text-[var(--accent)] font-bold font-mono">
                              #TRX-{String(o.id).padStart(4, '0')}
                              <span className="block font-normal text-[8px] text-[#9ca3af]">
                                {new Date(o.created_at).toLocaleString()}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-semibold block text-white">{o.customer?.full_name || 'Dieter Rams'}</span>
                              <span className="text-[8px] text-[#9ca3af] block font-mono">
                                {o.customer?.email}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right font-bold font-mono text-white">
                              ${o.total_amount.toFixed(2)}
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

      {/* ================= MODAL: ORDER DETAILS (Refined Overlay) ================= */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#12131a] border border-[#2a2d3a] w-full max-w-2xl p-8 relative rounded-lg shadow-2xl" style={{ transition: 'all 150ms ease' }}>
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedOrder(null)}
              className="absolute top-6 right-6 p-2 border border-[#2a2d3a] text-[#9ca3af] hover:border-white hover:text-white rounded transition-colors"
            >
              <X size={16} />
            </button>

            {/* Header info */}
            <div className="mb-6">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">[Operational Audit]</span>
              <h3 className="font-display font-bold text-xl uppercase tracking-wider text-white mt-1">
                Transaction #TRX-{String(selectedOrder.id).padStart(4, '0')}
              </h3>
              <p className="font-mono text-[9px] text-[#9ca3af] mt-1">
                INVENTORY BLOCK WRITE TIME: {new Date(selectedOrder.created_at).toLocaleString()}
              </p>
            </div>

            <div className="h-[1px] bg-[#2a2d3a] my-4"></div>

            {/* Customer Details */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div>
                <span className="form-label">CLIENT NODES PROFILE</span>
                <span className="font-display font-semibold text-sm block text-white">{selectedOrder.customer?.full_name}</span>
                <span className="font-mono text-xs text-[#9ca3af] block">{selectedOrder.customer?.email}</span>
              </div>
              <div>
                <span className="form-label">DATALINK CONTACT</span>
                <span className="font-mono text-xs block text-white">{selectedOrder.customer?.phone_number || '—'}</span>
              </div>
            </div>

            <div className="h-[1px] bg-[#2a2d3a] my-4"></div>

            {/* Ordered Items Table */}
            <div className="mb-6 max-h-48 overflow-y-auto border border-[#2a2d3a] rounded">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="bg-[#171924] text-[#9ca3af] uppercase tracking-wider border-b border-[#2a2d3a] font-mono">
                    <th className="p-3 font-semibold">SKU</th>
                    <th className="p-3 font-semibold">LABEL</th>
                    <th className="p-3 text-right font-semibold">VAL_UNIT_PRICE</th>
                    <th className="p-3 text-right font-semibold">STAGED</th>
                    <th className="p-3 text-right font-semibold">SUM_TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2d3a] text-[#f3f4f6] font-mono">
                  {selectedOrder.items.map((item) => (
                    <tr key={item.id} className="hover:bg-[#171924]/30">
                      <td className="p-3 font-bold text-[var(--accent)]">{item.product?.sku || 'SKU'}</td>
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
            <div className="flex justify-between items-center border-t border-[#2a2d3a] pt-4 select-none">
              <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#9ca3af]">AGGREGATE VALUE:</span>
              <span className="font-display font-bold text-2xl text-white">${selectedOrder.total_amount.toFixed(2)}</span>
            </div>

            {/* Close footer button */}
            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="btn-primary px-8"
              >
                Close Audit Page
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL: GENERIC CONFIRMATION (Refined HUD Overlay) ================= */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#12131a] border border-[#ef4444]/30 w-full max-w-md p-8 relative rounded-lg shadow-2xl">
            <h3 className="font-display font-semibold text-lg uppercase tracking-wider mb-4 text-[#ef4444]">
              // Destructive Action Warning
            </h3>
            
            <p className="font-body text-xs leading-relaxed text-[#9ca3af] mb-8">
              {deleteConfirm.type === 'order' && 'PURGE_WARNING: Cancelling this transaction block will permanently drop database entries and immediately replenish the staged quantities back to inventory catalog logs.'}
              {deleteConfirm.type === 'product' && 'PURGE_WARNING: Deleting this product SKU will wipe its database indexes. Historical orders logs will remain intact but product metadata will be detached.'}
              {deleteConfirm.type === 'customer' && 'PURGE_WARNING: Cascade deletes are active. Purging this customer node will cascade destroy their historical transaction logs completely.'}
            </p>

            <div className="flex gap-4 justify-end">
              <button 
                onClick={() => setDeleteConfirm({ show: false, type: '', id: null })}
                className="btn-secondary"
              >
                Abort Force
              </button>
              
              <button 
                onClick={() => {
                  if (deleteConfirm.type === 'product') handleProductDelete(deleteConfirm.id);
                  if (deleteConfirm.type === 'customer') handleCustomerDelete(deleteConfirm.id);
                  if (deleteConfirm.type === 'order') handleOrderCancel(deleteConfirm.id);
                }}
                className="btn-primary"
                style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
              >
                Confirm Purge Run
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
