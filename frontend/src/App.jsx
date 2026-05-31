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
  FileText,
  Filter
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

  // Modals & Active Edit/Details Items
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, type: '', id: null });
  const [editProduct, setEditProduct] = useState(null);

  // Form Modal visibility states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Column Filter Dropdown visibility state
  const [activeFilterDropdown, setActiveFilterDropdown] = useState({ table: '', column: '' });

  // Column Staged and Applied filters state
  const [stagedFilters, setStagedFilters] = useState({
    sku: '', name: '', min_price: '', max_price: '', min_stock: '', max_stock: '',
    customer_name: '', customer_email: '', phone: '', email: '',
    txn_id: '', min_amount: '', max_amount: ''
  });
  
  const [appliedFilters, setAppliedFilters] = useState({
    products: {},
    customers: {},
    orders: {}
  });

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

  // Dedicated filters load helpers
  const loadProducts = async (currentFilters = appliedFilters.products) => {
    setLoading(true);
    try {
      const data = await api.products.list(currentFilters);
      setProducts(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch product catalog.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async (currentFilters = appliedFilters.customers) => {
    setLoading(true);
    try {
      const data = await api.customers.list(currentFilters);
      setCustomers(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch customer nodes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async (currentFilters = appliedFilters.orders) => {
    setLoading(true);
    try {
      const data = await api.orders.list(currentFilters);
      setOrders(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch transaction ledger.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial core data
  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadProducts(),
        loadCustomers(),
        loadOrders()
      ]);
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

  // Filter application helpers
  const handleApplyFilter = (table, column, filterPatch) => {
    const updatedFilters = {
      ...appliedFilters,
      [table]: {
        ...appliedFilters[table],
        ...filterPatch
      }
    };
    setAppliedFilters(updatedFilters);
    setActiveFilterDropdown({ table: '', column: '' });
    
    if (table === 'products') loadProducts(updatedFilters.products);
    if (table === 'customers') loadCustomers(updatedFilters.customers);
    if (table === 'orders') loadOrders(updatedFilters.orders);
  };

  const handleClearFilter = (table, column, fieldsToClear) => {
    const newStaged = { ...stagedFilters };
    fieldsToClear.forEach(field => {
      newStaged[field] = '';
    });
    setStagedFilters(newStaged);

    const tableFilters = { ...appliedFilters[table] };
    fieldsToClear.forEach(field => {
      delete tableFilters[field];
    });
    
    const updatedFilters = {
      ...appliedFilters,
      [table]: tableFilters
    };
    setAppliedFilters(updatedFilters);
    setActiveFilterDropdown({ table: '', column: '' });
    
    if (table === 'products') loadProducts(updatedFilters.products);
    if (table === 'customers') loadCustomers(updatedFilters.customers);
    if (table === 'orders') loadOrders(updatedFilters.orders);
  };

  // Product CRUD
  const handleProductCreate = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.sku || !productForm.price || productForm.quantity_in_stock === '') {
      showToast('Please fill out all product details.', 'error');
      return;
    }
    if (parseFloat(productForm.price) <= 0) {
      showToast('Price must be greater than zero.', 'error');
      return;
    }
    if (parseInt(productForm.quantity_in_stock) < 0) {
      showToast('Quantity cannot be negative.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.products.create({
        name: productForm.name,
        sku: productForm.sku,
        price: parseFloat(productForm.price),
        quantity_in_stock: parseInt(productForm.quantity_in_stock)
      });
      showToast(`SKU ${productForm.sku} successfully added to database.`);
      setProductForm({ name: '', sku: '', price: '', quantity_in_stock: '' });
      setShowProductModal(false);
      loadProducts();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProductUpdate = async (e) => {
    e.preventDefault();
    if (!editProduct.name || !editProduct.sku || !editProduct.price || editProduct.quantity_in_stock === '') {
      showToast('Please fill out all product details.', 'error');
      return;
    }
    if (parseFloat(editProduct.price) <= 0) {
      showToast('Price must be greater than zero.', 'error');
      return;
    }
    if (parseInt(editProduct.quantity_in_stock) < 0) {
      showToast('Quantity cannot be negative.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.products.update(editProduct.id, {
        name: editProduct.name,
        sku: editProduct.sku,
        price: parseFloat(editProduct.price),
        quantity_in_stock: parseInt(editProduct.quantity_in_stock)
      });
      showToast(`SKU ${editProduct.sku} successfully updated.`);
      setEditProduct(null);
      loadProducts();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProductDelete = async (id) => {
    try {
      await api.products.delete(id);
      showToast('Product successfully removed from database.');
      loadProducts();
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
    if (!customerForm.email.includes('@') || !customerForm.email.includes('.')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.customers.create(customerForm);
      showToast(`Customer node successfully registered.`);
      setCustomerForm({ full_name: '', email: '', phone_number: '' });
      setShowCustomerModal(false);
      loadCustomers();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomerDelete = async (id) => {
    try {
      await api.customers.delete(id);
      showToast('Customer record successfully purged.');
      loadCustomers();
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
    setSubmitting(true);
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
      
      setOrderForm({ customer_id: '', items: [] });
      setShowOrderModal(false);
      loadOrders();
      loadProducts();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOrderCancel = async (id) => {
    try {
      await api.orders.delete(id);
      showToast('Transaction successfully rolled back. Catalog stocks replenished.');
      loadOrders();
      loadProducts();
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
            <div className="mb-10 select-none relative pl-6">
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
                      onClick={() => { navigateTo('orders'); setShowOrderModal(true); }}
                      className="btn-primary w-full justify-between"
                    >
                      <span>New Order Transaction</span>
                      <Plus size={14} />
                    </button>
                    
                    <button 
                      onClick={() => { navigateTo('products'); setShowProductModal(true); }}
                      className="btn-secondary w-full justify-between"
                    >
                      <span>Add Product SKU</span>
                      <Plus size={14} />
                    </button>
 
                    <button 
                      onClick={() => { navigateTo('customers'); setShowCustomerModal(true); }}
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
            <div className="mb-8 pl-6">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">[Catalog Console]</span>
              <h2 className="font-display font-bold text-2xl uppercase tracking-wider text-white mt-1">Product Inventory</h2>
              <div className="h-[1px] bg-[#2a2d3a] mt-4"></div>
            </div>
 
            {/* CTA bar */}
            <div className="flex justify-between items-center mb-6 pl-6 pr-2">
              <div className="text-xs font-mono text-[#9ca3af]">
                Showing {products.length} product SKUs.
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
                <div className="border border-[#2a2d3a] bg-[#12131a] rounded-lg overflow-visible">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#171924] text-[#9ca3af] uppercase tracking-wider border-b border-[#2a2d3a]">
                        
                        {/* SKU Column Header with Filter Popover */}
                        <th className="py-4 px-6 font-semibold font-mono relative select-none">
                          <div className="flex items-center gap-2">
                            <span>SKU</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveFilterDropdown({
                                  table: 'products',
                                  column: activeFilterDropdown.column === 'sku' ? '' : 'sku'
                                });
                              }}
                              className={`hover:text-white transition-colors p-1 ${appliedFilters.products.sku ? 'text-[var(--accent)] font-bold' : 'text-[#555770]'}`}
                              title="Filter by SKU"
                            >
                              <Filter size={12} />
                            </button>
                          </div>
                          
                          {activeFilterDropdown.table === 'products' && activeFilterDropdown.column === 'sku' && (
                            <div className="absolute top-12 left-6 z-50 w-64 bg-[#12131a] border border-[#2a2d3a] p-4 rounded-md shadow-2xl normal-case font-normal text-xs text-[#f3f4f6]">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setActiveFilterDropdown({ table: '', column: '' }); }}
                                className="absolute top-3 right-3 text-[#9ca3af] hover:text-white"
                              >
                                <X size={12} />
                              </button>
                              <div className="mb-3">
                                <label className="form-label mb-1">Filter by SKU</label>
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
                              </div>
                              <div className="flex gap-2 justify-end mt-4">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleClearFilter('products', 'sku', ['sku']); }}
                                  className="btn-ghost py-1 px-2.5 text-[10px]"
                                >
                                  Clear
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleApplyFilter('products', 'sku', { sku: stagedFilters.sku }); }}
                                  className="btn-primary py-1 px-3 text-[10px]"
                                >
                                  Apply
                                </button>
                              </div>
                            </div>
                          )}
                        </th>
 
                        {/* LABEL Column Header with Filter Popover */}
                        <th className="py-4 px-6 font-semibold relative select-none">
                          <div className="flex items-center gap-2">
                            <span>LABEL</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveFilterDropdown({
                                  table: 'products',
                                  column: activeFilterDropdown.column === 'name' ? '' : 'name'
                                });
                              }}
                              className={`hover:text-white transition-colors p-1 ${appliedFilters.products.name ? 'text-[var(--accent)] font-bold' : 'text-[#555770]'}`}
                              title="Filter by Name"
                            >
                              <Filter size={12} />
                            </button>
                          </div>
                          
                          {activeFilterDropdown.table === 'products' && activeFilterDropdown.column === 'name' && (
                            <div className="absolute top-12 left-6 z-50 w-64 bg-[#12131a] border border-[#2a2d3a] p-4 rounded-md shadow-2xl normal-case font-normal text-xs text-[#f3f4f6]">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setActiveFilterDropdown({ table: '', column: '' }); }}
                                className="absolute top-3 right-3 text-[#9ca3af] hover:text-white"
                              >
                                <X size={12} />
                              </button>
                              <div className="mb-3">
                                <label className="form-label mb-1">Filter by Product Name</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. StarkDesk"
                                  className="input-field"
                                  value={stagedFilters.name || ''}
                                  onChange={(e) => setStagedFilters({ ...stagedFilters, name: e.target.value })}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleApplyFilter('products', 'name', { name: stagedFilters.name });
                                  }}
                                />
                              </div>
                              <div className="flex gap-2 justify-end mt-4">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleClearFilter('products', 'name', ['name']); }}
                                  className="btn-ghost py-1 px-2.5 text-[10px]"
                                >
                                  Clear
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleApplyFilter('products', 'name', { name: stagedFilters.name }); }}
                                  className="btn-primary py-1 px-3 text-[10px]"
                                >
                                  Apply
                                </button>
                              </div>
                            </div>
                          )}
                        </th>
 
                        {/* UNIT PRICE Column Header with Filter Popover */}
                        <th className="py-4 px-6 font-semibold text-right relative select-none">
                          <div className="flex items-center gap-2 justify-end">
                            <span>UNIT PRICE</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveFilterDropdown({
                                  table: 'products',
                                  column: activeFilterDropdown.column === 'price' ? '' : 'price'
                                });
                              }}
                              className={`hover:text-white transition-colors p-1 ${ (appliedFilters.products.min_price || appliedFilters.products.max_price) ? 'text-[var(--accent)] font-bold' : 'text-[#555770]'}`}
                              title="Filter by Price"
                            >
                              <Filter size={12} />
                            </button>
                          </div>
                          
                          {activeFilterDropdown.table === 'products' && activeFilterDropdown.column === 'price' && (
                            <div className="absolute top-12 right-6 z-50 w-72 bg-[#12131a] border border-[#2a2d3a] p-4 rounded-md shadow-2xl normal-case font-normal text-xs text-[#f3f4f6] text-left">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setActiveFilterDropdown({ table: '', column: '' }); }}
                                className="absolute top-3 right-3 text-[#9ca3af] hover:text-white"
                              >
                                <X size={12} />
                              </button>
                              
                              <div className="grid grid-cols-2 gap-2 mb-3">
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
                              
                              <div className="flex gap-2 justify-end mt-4">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleClearFilter('products', 'price', ['min_price', 'max_price']); }}
                                  className="btn-ghost py-1 px-2.5 text-[10px]"
                                >
                                  Clear
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleApplyFilter('products', 'price', { min_price: stagedFilters.min_price, max_price: stagedFilters.max_price }); }}
                                  className="btn-primary py-1 px-3 text-[10px]"
                                >
                                  Apply
                                </button>
                              </div>
                            </div>
                          )}
                        </th>
 
                        {/* QUANTITY Column Header with Filter Popover */}
                        <th className="py-4 px-6 font-semibold text-right relative select-none">
                          <div className="flex items-center gap-2 justify-end">
                            <span>QUANTITY</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveFilterDropdown({
                                  table: 'products',
                                  column: activeFilterDropdown.column === 'stock' ? '' : 'stock'
                                });
                              }}
                              className={`hover:text-white transition-colors p-1 ${ (appliedFilters.products.min_stock || appliedFilters.products.max_stock) ? 'text-[var(--accent)] font-bold' : 'text-[#555770]'}`}
                              title="Filter by Quantity"
                            >
                              <Filter size={12} />
                            </button>
                          </div>
                          
                          {activeFilterDropdown.table === 'products' && activeFilterDropdown.column === 'stock' && (
                            <div className="absolute top-12 right-6 z-50 w-72 bg-[#12131a] border border-[#2a2d3a] p-4 rounded-md shadow-2xl normal-case font-normal text-xs text-[#f3f4f6] text-left">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setActiveFilterDropdown({ table: '', column: '' }); }}
                                className="absolute top-3 right-3 text-[#9ca3af] hover:text-white"
                              >
                                <X size={12} />
                              </button>
                              
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                <div>
                                  <label className="form-label mb-1">Min Stock</label>
                                  <input 
                                    type="number" 
                                    placeholder="0"
                                    className="input-field font-mono text-xs"
                                    value={stagedFilters.min_stock || ''}
                                    onChange={(e) => setStagedFilters({ ...stagedFilters, min_stock: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <label className="form-label mb-1">Max Stock</label>
                                  <input 
                                    type="number" 
                                    placeholder="250"
                                    className="input-field font-mono text-xs"
                                    value={stagedFilters.max_stock || ''}
                                    onChange={(e) => setStagedFilters({ ...stagedFilters, max_stock: e.target.value })}
                                  />
                                </div>
                              </div>
                              
                              <div className="flex gap-2 justify-end mt-4">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleClearFilter('products', 'stock', ['min_stock', 'max_stock']); }}
                                  className="btn-ghost py-1 px-2.5 text-[10px]"
                                >
                                  Clear
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleApplyFilter('products', 'stock', { min_stock: stagedFilters.min_stock, max_stock: stagedFilters.max_stock }); }}
                                  className="btn-primary py-1 px-3 text-[10px]"
                                >
                                  Apply
                                </button>
                              </div>
                            </div>
                          )}
                        </th>
                        <th className="py-4 px-6 font-semibold text-center select-none">COMMAND</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2d3a] text-[#f3f4f6]">
                      {products.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-[#9ca3af] uppercase tracking-widest font-mono">
                            No records matching query filters.
                          </td>
                        </tr>
                      ) : (
                        products.map((p) => {
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
            <div className="mb-8 pl-6">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">[Client Module]</span>
              <h2 className="font-display font-bold text-2xl uppercase tracking-wider text-white mt-1">Client Database</h2>
              <div className="h-[1px] bg-[#2a2d3a] mt-4"></div>
            </div>
 
            {/* CTA bar */}
            <div className="flex justify-between items-center mb-6 pl-6 pr-2">
              <div className="text-xs font-mono text-[#9ca3af]">
                Showing {customers.length} registered client profiles.
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
                <div className="border border-[#2a2d3a] bg-[#12131a] rounded-lg overflow-visible">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#171924] text-[#9ca3af] uppercase tracking-wider border-b border-[#2a2d3a]">
                        
                        {/* Name Column Header with Filter Popover */}
                        <th className="py-4 px-6 font-semibold relative select-none">
                          <div className="flex items-center gap-2">
                            <span>CLIENT NAME</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveFilterDropdown({
                                  table: 'customers',
                                  column: activeFilterDropdown.column === 'name' ? '' : 'name'
                                });
                              }}
                              className={`hover:text-white transition-colors p-1 ${appliedFilters.customers.name ? 'text-[var(--accent)] font-bold' : 'text-[#555770]'}`}
                              title="Filter by Name"
                            >
                              <Filter size={12} />
                            </button>
                          </div>
                          
                          {activeFilterDropdown.table === 'customers' && activeFilterDropdown.column === 'name' && (
                            <div className="absolute top-12 left-6 z-50 w-64 bg-[#12131a] border border-[#2a2d3a] p-4 rounded-md shadow-2xl normal-case font-normal text-xs text-[#f3f4f6]">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setActiveFilterDropdown({ table: '', column: '' }); }}
                                className="absolute top-3 right-3 text-[#9ca3af] hover:text-white"
                              >
                                <X size={12} />
                              </button>
                              <div className="mb-3">
                                <label className="form-label mb-1">Filter by Client Name</label>
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
                              </div>
                              <div className="flex gap-2 justify-end mt-4">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleClearFilter('customers', 'name', ['name']); }}
                                  className="btn-ghost py-1 px-2.5 text-[10px]"
                                >
                                  Clear
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleApplyFilter('customers', 'name', { name: stagedFilters.name }); }}
                                  className="btn-primary py-1 px-3 text-[10px]"
                                >
                                  Apply
                                </button>
                              </div>
                            </div>
                          )}
                        </th>
 
                        {/* Email Column Header with Filter Popover */}
                        <th className="py-4 px-6 font-semibold relative select-none">
                          <div className="flex items-center gap-2">
                            <span>COMMS_EMAIL</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveFilterDropdown({
                                  table: 'customers',
                                  column: activeFilterDropdown.column === 'email' ? '' : 'email'
                                });
                              }}
                              className={`hover:text-white transition-colors p-1 ${appliedFilters.customers.email ? 'text-[var(--accent)] font-bold' : 'text-[#555770]'}`}
                              title="Filter by Email"
                            >
                              <Filter size={12} />
                            </button>
                          </div>
                          
                          {activeFilterDropdown.table === 'customers' && activeFilterDropdown.column === 'email' && (
                            <div className="absolute top-12 left-6 z-50 w-64 bg-[#12131a] border border-[#2a2d3a] p-4 rounded-md shadow-2xl normal-case font-normal text-xs text-[#f3f4f6]">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setActiveFilterDropdown({ table: '', column: '' }); }}
                                className="absolute top-3 right-3 text-[#9ca3af] hover:text-white"
                              >
                                <X size={12} />
                              </button>
                              <div className="mb-3">
                                <label className="form-label mb-1">Filter by Email</label>
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
                              </div>
                              <div className="flex gap-2 justify-end mt-4">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleClearFilter('customers', 'email', ['email']); }}
                                  className="btn-ghost py-1 px-2.5 text-[10px]"
                                >
                                  Clear
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleApplyFilter('customers', 'email', { email: stagedFilters.email }); }}
                                  className="btn-primary py-1 px-3 text-[10px]"
                                >
                                  Apply
                                </button>
                              </div>
                            </div>
                          )}
                        </th>
 
                        {/* Phone Column Header with Filter Popover */}
                        <th className="py-4 px-6 font-semibold relative select-none">
                          <div className="flex items-center gap-2">
                            <span>COMMS_PHONE</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveFilterDropdown({
                                  table: 'customers',
                                  column: activeFilterDropdown.column === 'phone' ? '' : 'phone'
                                });
                              }}
                              className={`hover:text-white transition-colors p-1 ${appliedFilters.customers.phone ? 'text-[var(--accent)] font-bold' : 'text-[#555770]'}`}
                              title="Filter by Phone"
                            >
                              <Filter size={12} />
                            </button>
                          </div>
                          
                          {activeFilterDropdown.table === 'customers' && activeFilterDropdown.column === 'phone' && (
                            <div className="absolute top-12 left-6 z-50 w-64 bg-[#12131a] border border-[#2a2d3a] p-4 rounded-md shadow-2xl normal-case font-normal text-xs text-[#f3f4f6]">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setActiveFilterDropdown({ table: '', column: '' }); }}
                                className="absolute top-3 right-3 text-[#9ca3af] hover:text-white"
                              >
                                <X size={12} />
                              </button>
                              <div className="mb-3">
                                <label className="form-label mb-1">Filter by Phone</label>
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
                              </div>
                              <div className="flex gap-2 justify-end mt-4">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleClearFilter('customers', 'phone', ['phone']); }}
                                  className="btn-ghost py-1 px-2.5 text-[10px]"
                                >
                                  Clear
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleApplyFilter('customers', 'phone', { phone: stagedFilters.phone }); }}
                                  className="btn-primary py-1 px-3 text-[10px]"
                                >
                                  Apply
                                </button>
                              </div>
                            </div>
                          )}
                        </th>
                        <th className="py-4 px-6 font-semibold text-center select-none">PURGE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2d3a] text-[#f3f4f6]">
                      {customers.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-[#9ca3af] uppercase tracking-widest font-mono">
                            No registered client records returned.
                          </td>
                        </tr>
                      ) : (
                        customers.map((c) => (
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
            <div className="mb-8 pl-6">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">[Transaction Module]</span>
              <h2 className="font-display font-bold text-2xl uppercase tracking-wider text-white mt-1">Transaction Ledger</h2>
              <div className="h-[1px] bg-[#2a2d3a] mt-4"></div>
            </div>
 
            {/* CTA bar */}
            <div className="flex justify-between items-center mb-6 pl-6 pr-2">
              <div className="text-xs font-mono text-[#9ca3af]">
                Showing {orders.length} transaction logs settled in database.
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
                <div className="border border-[#2a2d3a] bg-[#12131a] rounded-lg overflow-visible">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#171924] text-[#9ca3af] uppercase tracking-wider border-b border-[#2a2d3a]">
                        
                        {/* Transaction ID Column Header with Filter Popover */}
                        <th className="py-4 px-6 font-semibold font-mono relative select-none">
                          <div className="flex items-center gap-2">
                            <span>TXN_ID</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveFilterDropdown({
                                  table: 'orders',
                                  column: activeFilterDropdown.column === 'txn_id' ? '' : 'txn_id'
                                });
                              }}
                              className={`hover:text-white transition-colors p-1 ${appliedFilters.orders.txn_id ? 'text-[var(--accent)] font-bold' : 'text-[#555770]'}`}
                              title="Filter by Transaction ID"
                            >
                              <Filter size={12} />
                            </button>
                          </div>
                          
                          {activeFilterDropdown.table === 'orders' && activeFilterDropdown.column === 'txn_id' && (
                            <div className="absolute top-12 left-6 z-50 w-64 bg-[#12131a] border border-[#2a2d3a] p-4 rounded-md shadow-2xl normal-case font-normal text-xs text-[#f3f4f6]">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setActiveFilterDropdown({ table: '', column: '' }); }}
                                className="absolute top-3 right-3 text-[#9ca3af] hover:text-white"
                              >
                                <X size={12} />
                              </button>
                              <div className="mb-3">
                                <label className="form-label mb-1">Filter by TXN_ID</label>
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
                              </div>
                              <div className="flex gap-2 justify-end mt-4">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleClearFilter('orders', 'txn_id', ['txn_id']); }}
                                  className="btn-ghost py-1 px-2.5 text-[10px]"
                                >
                                  Clear
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleApplyFilter('orders', 'txn_id', { txn_id: stagedFilters.txn_id }); }}
                                  className="btn-primary py-1 px-3 text-[10px]"
                                >
                                  Apply
                                </button>
                              </div>
                            </div>
                          )}
                        </th>
 
                        {/* Client Decoder Column Header with Filter Popover */}
                        <th className="py-4 px-6 font-semibold relative select-none">
                          <div className="flex items-center gap-2">
                            <span>CLIENT DECODER</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveFilterDropdown({
                                  table: 'orders',
                                  column: activeFilterDropdown.column === 'customer' ? '' : 'customer'
                                });
                              }}
                              className={`hover:text-white transition-colors p-1 ${appliedFilters.orders.customer_name ? 'text-[var(--accent)] font-bold' : 'text-[#555770]'}`}
                              title="Filter by Client"
                            >
                              <Filter size={12} />
                            </button>
                          </div>
                          
                          {activeFilterDropdown.table === 'orders' && activeFilterDropdown.column === 'customer' && (
                            <div className="absolute top-12 left-6 z-50 w-64 bg-[#12131a] border border-[#2a2d3a] p-4 rounded-md shadow-2xl normal-case font-normal text-xs text-[#f3f4f6]">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setActiveFilterDropdown({ table: '', column: '' }); }}
                                className="absolute top-3 right-3 text-[#9ca3af] hover:text-white"
                              >
                                <X size={12} />
                              </button>
                              <div className="mb-3">
                                <label className="form-label mb-1">Filter by Client Name</label>
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
                              </div>
                              <div className="flex gap-2 justify-end mt-4">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleClearFilter('orders', 'customer', ['customer_name']); }}
                                  className="btn-ghost py-1 px-2.5 text-[10px]"
                                >
                                  Clear
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleApplyFilter('orders', 'customer', { customer_name: stagedFilters.customer_name }); }}
                                  className="btn-primary py-1 px-3 text-[10px]"
                                >
                                  Apply
                                </button>
                              </div>
                            </div>
                          )}
                        </th>
 
                        {/* Value Sum Column Header with Filter Popover */}
                        <th className="py-4 px-6 font-semibold text-right relative select-none">
                          <div className="flex items-center gap-2 justify-end">
                            <span>VAL_SUM</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveFilterDropdown({
                                  table: 'orders',
                                  column: activeFilterDropdown.column === 'amount' ? '' : 'amount'
                                });
                              }}
                              className={`hover:text-white transition-colors p-1 ${ (appliedFilters.orders.min_amount || appliedFilters.orders.max_amount) ? 'text-[var(--accent)] font-bold' : 'text-[#555770]'}`}
                              title="Filter by Value"
                            >
                              <Filter size={12} />
                            </button>
                          </div>
                          
                          {activeFilterDropdown.table === 'orders' && activeFilterDropdown.column === 'amount' && (
                            <div className="absolute top-12 right-6 z-50 w-72 bg-[#12131a] border border-[#2a2d3a] p-4 rounded-md shadow-2xl normal-case font-normal text-xs text-[#f3f4f6] text-left">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setActiveFilterDropdown({ table: '', column: '' }); }}
                                className="absolute top-3 right-3 text-[#9ca3af] hover:text-white"
                              >
                                <X size={12} />
                              </button>
                              
                              <div className="grid grid-cols-2 gap-2 mb-3">
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
                              
                              <div className="flex gap-2 justify-end mt-4">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleClearFilter('orders', 'amount', ['min_amount', 'max_amount']); }}
                                  className="btn-ghost py-1 px-2.5 text-[10px]"
                                >
                                  Clear
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleApplyFilter('orders', 'amount', { min_amount: stagedFilters.min_amount, max_amount: stagedFilters.max_amount }); }}
                                  className="btn-primary py-1 px-3 text-[10px]"
                                >
                                  Apply
                                </button>
                              </div>
                            </div>
                          )}
                        </th>
                        <th className="py-4 px-6 font-semibold text-center select-none">COMMAND</th>
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
 
      {/* ================= MODAL: INJECT SKU / EDIT SKU CATALOG ================= */}
      {(showProductModal || editProduct) && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-[#12131a] border border-[#2a2d3a] w-full max-w-md p-8 relative rounded-lg shadow-2xl">
            
            {/* Abort X Button */}
            <button 
              onClick={() => { setShowProductModal(false); setEditProduct(null); }}
              className="absolute top-6 right-6 p-2 border border-[#2a2d3a] text-[#9ca3af] hover:border-white hover:text-white rounded transition-colors"
            >
              <X size={16} />
            </button>
 
            <div className="mb-6">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">[SKU Registration Node]</span>
              <h3 className="font-display font-bold text-xl uppercase tracking-wider text-white mt-1">
                {editProduct ? 'Edit SKU Profile' : 'Inject SKU Catalog'}
              </h3>
              <p className="font-mono text-[9px] text-[#9ca3af] mt-1">
                WRITE MODE: DATABASE LIVE STREAMING
              </p>
            </div>
 
            <div className="h-[1px] bg-[#2a2d3a] my-4"></div>
 
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
                  disabled={!!editProduct} /* cannot edit SKU after creation to ensure DB relational integrity */
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
 
              <div className="h-[1px] bg-[#2a2d3a] mt-2"></div>
 
              <div className="flex gap-4 justify-end mt-2">
                <button 
                  type="button" 
                  onClick={() => { setShowProductModal(false); setEditProduct(null); }} 
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'COMMITTING...' : (editProduct ? 'Save Patch' : 'Commit SKU')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
 
      {/* ================= MODAL: REGISTER CLIENT NODE ================= */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-[#12131a] border border-[#2a2d3a] w-full max-w-md p-8 relative rounded-lg shadow-2xl">
            
            {/* Abort X Button */}
            <button 
              onClick={() => setShowCustomerModal(false)}
              className="absolute top-6 right-6 p-2 border border-[#2a2d3a] text-[#9ca3af] hover:border-white hover:text-white rounded transition-colors"
            >
              <X size={16} />
            </button>
 
            <div className="mb-6">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">[Client Profile Injection]</span>
              <h3 className="font-display font-bold text-xl uppercase tracking-wider text-white mt-1">
                Register Client Node
              </h3>
              <p className="font-mono text-[9px] text-[#9ca3af] mt-1">
                WRITE MODE: DATABASE LIVE STREAMING
              </p>
            </div>
 
            <div className="h-[1px] bg-[#2a2d3a] my-4"></div>
 
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
 
              <div className="h-[1px] bg-[#2a2d3a] mt-2"></div>
 
              <div className="flex gap-4 justify-end mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowCustomerModal(false)} 
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'INJECTING...' : 'Inject Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
 
      {/* ================= MODAL: COMPILE TRANSACTION ================= */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-[#12131a] border border-[#2a2d3a] w-full max-w-2xl p-8 relative rounded-lg shadow-2xl">
            
            {/* Abort X Button */}
            <button 
              onClick={() => setShowOrderModal(false)}
              className="absolute top-6 right-6 p-2 border border-[#2a2d3a] text-[#9ca3af] hover:border-white hover:text-white rounded transition-colors"
            >
              <X size={16} />
            </button>
 
            <div className="mb-6">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">[Transaction Compiler Engine]</span>
              <h3 className="font-display font-bold text-xl uppercase tracking-wider text-white mt-1">
                Compile Transaction
              </h3>
              <p className="font-mono text-[9px] text-[#9ca3af] mt-1">
                WRITE MODE: DATABASE élő ACID TRANSACTION
              </p>
            </div>
 
            <div className="h-[1px] bg-[#2a2d3a] my-4"></div>
 
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
 
              <div className="h-[1px] bg-[#2a2d3a] my-1"></div>
 
              {/* Add Order Item */}
              <div>
                <h4 className="font-mono text-xs uppercase tracking-wider font-semibold mb-4 text-[var(--accent)]">[Add Staged SKU]</h4>
                
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="form-label">Inventory Item</label>
                    <select 
                      className="input-field font-mono text-xs bg-[#12131a] text-white focus:outline-none animate-none"
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
                  <div className="border border-[#2a2d3a] divide-y divide-[#2a2d3a] max-h-40 overflow-y-auto rounded text-xs font-mono">
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
 
              <div className="h-[1px] bg-[#2a2d3a] mt-2"></div>
 
              <div className="flex gap-4 justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowOrderModal(false)} 
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={orderForm.items.length === 0 || !orderForm.customer_id || submitting}
                >
                  {submitting ? 'SETTLING...' : 'Commit Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
 
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
