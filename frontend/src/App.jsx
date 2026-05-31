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
  ExternalLink,
  Info
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
      setError('Could not establish database connection. Please ensure the backend is running.');
      showToast('Error syncing with database server.', 'error');
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
      showToast(`Product ${productForm.sku} registered successfully.`);
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
      showToast(`Product ${editProduct.sku} updated.`);
      setEditProduct(null);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleProductDelete = async (id) => {
    try {
      await api.products.delete(id);
      showToast('Product successfully deleted.');
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
      showToast(`Customer registered successfully.`);
      setCustomerForm({ full_name: '', email: '', phone_number: '' });
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCustomerDelete = async (id) => {
    try {
      await api.customers.delete(id);
      showToast('Customer deleted.');
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
      showToast(`Warning: Requested quantity exceeds current available stock (${selectedProduct.quantity_in_stock}).`, 'error');
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
      showToast('Please add at least one item to the order.', 'error');
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
      showToast('Order successfully generated and inventory updated.');
      
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
      showToast('Order successfully cancelled and inventory replenished.');
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

  // Tab navigation handler that closes mobile menu
  const navigateTo = (tab) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col md:flex-row relative">
      
      {/* Dynamic Toast System */}
      {toast.show && (
        <div 
          className="fixed bottom-8 right-8 z-[1000] border-2 border-black bg-black text-white px-6 py-4 flex items-center justify-between gap-4 max-w-sm cursor-pointer shadow-none"
          style={{ transition: 'all 100ms steps(2)' }}
          onClick={() => setToast(prev => ({ ...prev, show: false }))}
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-wider font-bold">
              [{toast.type === 'error' ? '!' : '✓'}]
            </span>
            <span className="font-body text-sm leading-tight">{toast.message}</span>
          </div>
          <X size={14} className="opacity-60 hover:opacity-100" />
        </div>
      )}

      {/* Navigation Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-72 bg-white v-line-thin p-8 shrink-0 justify-between select-none">
        <div>
          {/* Logo Brand */}
          <div className="mb-12">
            <h1 className="font-display font-bold text-2xl tracking-tighter uppercase leading-none">
              ETHARA <span className="block font-mono text-xs font-normal tracking-widest mt-2 text-[var(--muted-foreground)]">INVENTORY SYSTEM</span>
            </h1>
          </div>

          <nav className="flex flex-col gap-2">
            <button 
              onClick={() => navigateTo('dashboard')}
              className={`w-full text-left px-4 py-3 font-mono text-xs tracking-wider uppercase flex justify-between items-center transition-all duration-100 ${currentTab === 'dashboard' ? 'bg-black text-white font-bold' : 'hover:bg-[var(--muted)] text-[var(--foreground)]'}`}
            >
              <span>Dashboard</span>
              <ChevronRight size={14} className={currentTab === 'dashboard' ? 'opacity-100' : 'opacity-0'} />
            </button>
            <button 
              onClick={() => navigateTo('products')}
              className={`w-full text-left px-4 py-3 font-mono text-xs tracking-wider uppercase flex justify-between items-center transition-all duration-100 ${currentTab === 'products' ? 'bg-black text-white font-bold' : 'hover:bg-[var(--muted)] text-[var(--foreground)]'}`}
            >
              <span>Products ({products.length})</span>
              <ChevronRight size={14} className={currentTab === 'products' ? 'opacity-100' : 'opacity-0'} />
            </button>
            <button 
              onClick={() => navigateTo('customers')}
              className={`w-full text-left px-4 py-3 font-mono text-xs tracking-wider uppercase flex justify-between items-center transition-all duration-100 ${currentTab === 'customers' ? 'bg-black text-white font-bold' : 'hover:bg-[var(--muted)] text-[var(--foreground)]'}`}
            >
              <span>Customers ({customers.length})</span>
              <ChevronRight size={14} className={currentTab === 'customers' ? 'opacity-100' : 'opacity-0'} />
            </button>
            <button 
              onClick={() => navigateTo('orders')}
              className={`w-full text-left px-4 py-3 font-mono text-xs tracking-wider uppercase flex justify-between items-center transition-all duration-100 ${currentTab === 'orders' ? 'bg-black text-white font-bold' : 'hover:bg-[var(--muted)] text-[var(--foreground)]'}`}
            >
              <span>Orders ({orders.length})</span>
              <ChevronRight size={14} className={currentTab === 'orders' ? 'opacity-100' : 'opacity-0'} />
            </button>
          </nav>
        </div>

        <div>
          <div className="line-thin mb-4"></div>
          <p className="font-mono text-[10px] text-[var(--muted-foreground)] tracking-widest uppercase">
            STRICT MONOCHROME V1.0<br/>
            DESIGN AS DISCIPLINE
          </p>
        </div>
      </aside>

      {/* Navigation Topbar (Mobile) */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b-2 border-black w-full sticky top-0 z-50">
        <h1 className="font-display font-bold text-lg tracking-tight uppercase">
          ETHARA <span className="font-mono text-[9px] tracking-widest font-normal text-[var(--muted-foreground)] ml-1">IMS</span>
        </h1>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 border-2 border-black hover:bg-black hover:text-white"
        >
          {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-[60px] left-0 w-full h-[calc(100vh-60px)] bg-white z-40 flex flex-col p-8 justify-between border-b-4 border-black">
          <nav className="flex flex-col gap-3">
            <button 
              onClick={() => navigateTo('dashboard')}
              className="w-full text-left px-4 py-4 font-mono text-sm tracking-wider uppercase border-2 border-black hover:bg-black hover:text-white flex justify-between items-center"
            >
              <span>Dashboard</span>
              <ChevronRight size={16} />
            </button>
            <button 
              onClick={() => navigateTo('products')}
              className="w-full text-left px-4 py-4 font-mono text-sm tracking-wider uppercase border-2 border-black hover:bg-black hover:text-white flex justify-between items-center"
            >
              <span>Products ({products.length})</span>
              <ChevronRight size={16} />
            </button>
            <button 
              onClick={() => navigateTo('customers')}
              className="w-full text-left px-4 py-4 font-mono text-sm tracking-wider uppercase border-2 border-black hover:bg-black hover:text-white flex justify-between items-center"
            >
              <span>Customers ({customers.length})</span>
              <ChevronRight size={16} />
            </button>
            <button 
              onClick={() => navigateTo('orders')}
              className="w-full text-left px-4 py-4 font-mono text-sm tracking-wider uppercase border-2 border-black hover:bg-black hover:text-white flex justify-between items-center"
            >
              <span>Orders ({orders.length})</span>
              <ChevronRight size={16} />
            </button>
          </nav>

          <div className="line-thin mb-4">
            <p className="font-mono text-[9px] text-[var(--muted-foreground)] tracking-widest uppercase py-4">
              ETHARA AI — MINIMALIST MONOCHROME OPERATIONAL PLATFORM
            </p>
          </div>
        </div>
      )}

      {/* Main View Container */}
      <main className="flex-1 overflow-y-auto w-full relative">
        {loading && (
          <div className="absolute top-0 left-0 w-full h-1 bg-black animate-pulse z-[200]"></div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="bg-black text-white px-8 py-3 border-b-2 border-black font-mono text-xs uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle size={14} /> {error}
            </span>
            <button 
              onClick={() => { setError(''); loadData(); }} 
              className="px-3 py-1 border border-white hover:bg-white hover:text-black font-bold text-[10px]"
            >
              RETRY CONNECTION
            </button>
          </div>
        )}

        {/* ================= TAB 1: DASHBOARD ================= */}
        {currentTab === 'dashboard' && (
          <div className="editorial-container">
            {/* Massive Editorial Hero Headline */}
            <div className="mb-16 select-none relative">
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--muted-foreground)] block mb-2">OPERATIONAL CONTROL</span>
              <h2 className="font-display font-bold text-7xl md:text-9xl tracking-tighter leading-[0.85] uppercase">
                ETHARA
              </h2>
              <div className="line-thick mt-6 mb-4 flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-widest py-2">[AUSTERE & AUTHORITATIVE OPERATIONS]</span>
                {/* Hero visual punctuation: 4px heavy line with bordered box */}
                <div className="w-4 h-4 border-2 border-black bg-white -mt-0.5 select-none"></div>
              </div>
            </div>

            {/* Inverted Stats Row with White Vertical Lines Texture */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-0 border-2 border-black mb-16 select-none">
              
              <div className="p-8 border-b-2 md:border-b-0 md:border-r-2 border-black texture-stats-inverted hover:bg-white hover:text-black transition-all duration-100 group">
                <div className="flex justify-between items-start mb-6">
                  <span className="font-mono text-[10px] tracking-widest uppercase opacity-75 group-hover:opacity-100">01 / PRODUCTS</span>
                  <Layers size={16} className="opacity-60" />
                </div>
                <div className="font-display font-bold text-5xl leading-none">{products.length}</div>
                <div className="font-mono text-[9px] tracking-wider uppercase mt-4 opacity-50 group-hover:opacity-75">Active SKUs</div>
              </div>

              <div className="p-8 border-b-2 md:border-b-0 md:border-r-2 border-black texture-stats-inverted hover:bg-white hover:text-black transition-all duration-100 group">
                <div className="flex justify-between items-start mb-6">
                  <span className="font-mono text-[10px] tracking-widest uppercase opacity-75 group-hover:opacity-100">02 / CUSTOMERS</span>
                  <Users size={16} className="opacity-60" />
                </div>
                <div className="font-display font-bold text-5xl leading-none">{customers.length}</div>
                <div className="font-mono text-[9px] tracking-wider uppercase mt-4 opacity-50 group-hover:opacity-75">Registered Clients</div>
              </div>

              <div className="p-8 border-b-2 md:border-b-0 md:border-r-2 border-black texture-stats-inverted hover:bg-white hover:text-black transition-all duration-100 group">
                <div className="flex justify-between items-start mb-6">
                  <span className="font-mono text-[10px] tracking-widest uppercase opacity-75 group-hover:opacity-100">03 / ORDERS</span>
                  <ShoppingBag size={16} className="opacity-60" />
                </div>
                <div className="font-display font-bold text-5xl leading-none">{orders.length}</div>
                <div className="font-mono text-[9px] tracking-wider uppercase mt-4 opacity-50 group-hover:opacity-75">Sales Transactions</div>
              </div>

              <div className="p-8 texture-stats-inverted hover:bg-white hover:text-black transition-all duration-100 group">
                <div className="flex justify-between items-start mb-6">
                  <span className="font-mono text-[10px] tracking-widest uppercase opacity-75 group-hover:opacity-100">04 / ALERTS</span>
                  <AlertTriangle size={16} className="opacity-60" />
                </div>
                <div className="font-display font-bold text-5xl leading-none">
                  {lowStockProductsCount}
                </div>
                <div className="font-mono text-[9px] tracking-wider uppercase mt-4 opacity-50 group-hover:opacity-75">Low Stock Threshold</div>
              </div>

            </section>

            {/* Dashboard Analytics Representation & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Analytics Section */}
              <div className="lg:col-span-8 border-2 border-black p-8 texture-grid relative">
                <h3 className="font-display font-bold text-xl uppercase mb-6 tracking-tight flex items-center justify-between">
                  <span>METRIC VELOCITY</span>
                  <TrendingUp size={16} />
                </h3>
                
                {/* CSS Grid-Based Monochrome Bar Chart */}
                <div className="h-64 flex items-end justify-between gap-4 border-b-2 border-black pt-8 px-4">
                  {products.slice(0, 6).map((prod, i) => {
                    // compute relative height
                    const maxQty = Math.max(...products.map(p => p.quantity_in_stock), 1);
                    const pct = Math.max((prod.quantity_in_stock / maxQty) * 100, 4);
                    return (
                      <div key={prod.id} className="flex flex-col items-center flex-1 group">
                        {/* Hover quantity display */}
                        <span className="font-mono text-[10px] opacity-0 group-hover:opacity-100 mb-1 transition-opacity duration-100 select-none">
                          {prod.quantity_in_stock}
                        </span>
                        {/* Monochrome dynamic bar */}
                        <div 
                          className="w-full bg-black hover:bg-[var(--muted-foreground)] cursor-pointer"
                          style={{ height: `${pct * 1.5}px`, transition: 'height 200ms ease' }}
                        ></div>
                        <span className="font-mono text-[9px] tracking-tight uppercase truncate w-full text-center mt-2">
                          {prod.sku}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between items-center mt-4">
                  <p className="font-mono text-[10px] text-[var(--muted-foreground)] uppercase">
                    BARS REPRESENT INVENTORY QUANTITY PER PRODUCT SKU
                  </p>
                  <button onClick={() => navigateTo('products')} className="btn-ghost">
                    VIEW ALL PRODUCTS <ChevronRight size={12} />
                  </button>
                </div>
              </div>

              {/* Quick Operations Panel */}
              <div className="lg:col-span-4 border-2 border-black p-8 flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-bold text-xl uppercase mb-6 tracking-tight">OPERATIONS</h3>
                  <p className="font-body text-sm text-[var(--muted-foreground)] mb-6">
                    Immediate database registration and transactional execution triggers:
                  </p>

                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => navigateTo('orders')}
                      className="btn-primary w-full justify-between"
                    >
                      <span>GENERATE NEW ORDER</span>
                      <Plus size={16} />
                    </button>
                    
                    <button 
                      onClick={() => navigateTo('products')}
                      className="btn-secondary w-full justify-between"
                    >
                      <span>REGISTER NEW SKU</span>
                      <Plus size={16} />
                    </button>

                    <button 
                      onClick={() => navigateTo('customers')}
                      className="btn-secondary w-full justify-between"
                    >
                      <span>REGISTER CUSTOMER</span>
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-black">
                  <span className="font-mono text-[10px] uppercase text-[var(--muted-foreground)] block mb-1">SYSTEM STATUS</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 border border-black bg-black select-none"></span>
                    <span className="font-mono text-[10px] uppercase tracking-wider font-bold">ONLINE & AUTHENTICATED</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Editorial Pull Quote Boxed Drop Cap (From Success Criteria) */}
            <div className="line-thick my-16"></div>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-12 select-none">
              <div>
                <p className="font-body text-lg leading-relaxed boxed-dropcap text-[var(--foreground)]">
                  The essence of high-performance design resides in absolute constraints. 
                  By stripping away color, softness, and shadows, this operations control interface forces focus onto SKU velocities, customer relationships, and transaction safety. The stark typography communicates raw mathematical data with luxury elegance.
                </p>
              </div>
              <div className="border-l-4 border-black pl-8 py-2 flex flex-col justify-between">
                {/* Large Italic Serif Pull Quote */}
                <blockquote className="font-display italic text-2xl leading-normal text-[var(--muted-foreground)]">
                  "Simplicity is not the avoidance of clutter, but the absolute reduction of an object to its core purpose. Discipline is beauty."
                </blockquote>
                <cite className="font-mono text-[10px] tracking-widest uppercase block mt-4 font-bold not-italic">
                  — EDITORIAL MANIFESTO, ETHARA AI
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
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--muted-foreground)]">[CATALOG CONTROLS]</span>
              <h2 className="font-display font-bold text-5xl uppercase tracking-tight mt-1">INVENTORY CATALOG</h2>
              <div className="line-thick mt-4"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Product Registration Form */}
              <div className="lg:col-span-4 border-2 border-black p-8 h-fit">
                <h3 className="font-display font-bold text-xl uppercase mb-6 tracking-tight">
                  {editProduct ? 'EDIT SKU DETAILS' : 'REGISTER NEW SKU'}
                </h3>
                
                <form onSubmit={editProduct ? handleProductUpdate : handleProductCreate} className="flex flex-col gap-6">
                  <div>
                    <label className="form-label">Product Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Bauhaus Armchair" 
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
                      placeholder="e.g. FURN-001" 
                      className="input-field font-mono uppercase"
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
                      <label className="form-label">Price ($ USD)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0.01" 
                        placeholder="850.00" 
                        className="input-field"
                        value={editProduct ? editProduct.price : productForm.price}
                        onChange={(e) => editProduct 
                          ? setEditProduct({ ...editProduct, price: e.target.value })
                          : setProductForm({ ...productForm, price: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Stock Quantity</label>
                      <input 
                        type="number" 
                        min="0" 
                        placeholder="12" 
                        className="input-field"
                        value={editProduct ? editProduct.quantity_in_stock : productForm.quantity_in_stock}
                        onChange={(e) => editProduct 
                          ? setEditProduct({ ...editProduct, quantity_in_stock: e.target.value })
                          : setProductForm({ ...productForm, quantity_in_stock: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button type="submit" className="btn-primary flex-1 justify-center">
                      {editProduct ? 'UPDATE SKU' : 'COMMIT REGISTRATION'}
                    </button>
                    {editProduct && (
                      <button 
                        type="button" 
                        onClick={() => setEditProduct(null)} 
                        className="btn-secondary"
                      >
                        CANCEL
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Product Listing Catalog */}
              <div className="lg:col-span-8">
                
                {/* Search and Filters */}
                <div className="mb-6 flex gap-4">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      placeholder="SEARCH BY SKU OR PRODUCT NAME..." 
                      className="input-field uppercase font-mono text-xs tracking-wider"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Table */}
                <div className="border-2 border-black overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-black text-white font-mono text-xs uppercase tracking-widest">
                        <th className="py-4 px-6 font-medium">SKU</th>
                        <th className="py-4 px-6 font-medium">PRODUCT</th>
                        <th className="py-4 px-6 font-medium text-right">PRICE</th>
                        <th className="py-4 px-6 font-medium text-right">STOCK</th>
                        <th className="py-4 px-6 font-medium text-center">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black font-body text-sm">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-8 text-center font-mono text-xs text-[var(--muted-foreground)] uppercase">
                            NO REGISTERED PRODUCTS MATCHING SEARCH
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((p) => {
                          const isLowStock = p.quantity_in_stock <= LOW_STOCK_THRESHOLD && p.quantity_in_stock > 0;
                          const isOutOfStock = p.quantity_in_stock === 0;

                          return (
                            <tr key={p.id} className="hover:bg-[var(--muted)] transition-colors duration-100">
                              <td className="py-4 px-6 font-mono text-xs font-bold tracking-wider">{p.sku}</td>
                              <td className="py-4 px-6">
                                <span className="font-display font-bold block">{p.name}</span>
                                <span className="font-mono text-[9px] text-[var(--muted-foreground)] block">
                                  UPDATED: {new Date(p.updated_at).toLocaleString()}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right font-mono font-bold">${p.price.toFixed(2)}</td>
                              <td className="py-4 px-6 text-right">
                                <div className="flex flex-col items-end gap-1">
                                  <span className="font-mono font-bold">{p.quantity_in_stock}</span>
                                  {isLowStock && (
                                    <span className="border border-black px-2 py-0.5 font-mono text-[8px] font-bold italic tracking-wider uppercase text-black">
                                      [LOW STOCK]
                                    </span>
                                  )}
                                  {isOutOfStock && (
                                    <span className="bg-black text-white px-2 py-0.5 font-mono text-[8px] font-bold tracking-wider uppercase">
                                      [OUT OF STOCK]
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <div className="flex gap-2 justify-center">
                                  <button 
                                    onClick={() => setEditProduct(p)} 
                                    className="p-2 border border-black hover:bg-black hover:text-white transition-colors duration-100"
                                    title="Edit Product"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  <button 
                                    onClick={() => setDeleteConfirm({ show: true, type: 'product', id: p.id })} 
                                    className="p-2 border border-black hover:bg-black hover:text-white transition-colors duration-100"
                                    title="Delete Product"
                                  >
                                    <Trash2 size={14} />
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
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--muted-foreground)]">[RELATION DATABASE]</span>
              <h2 className="font-display font-bold text-5xl uppercase tracking-tight mt-1">CUSTOMER CLIENTS</h2>
              <div className="line-thick mt-4"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Customer Registration Form */}
              <div className="lg:col-span-4 border-2 border-black p-8 h-fit">
                <h3 className="font-display font-bold text-xl uppercase mb-6 tracking-tight">REGISTER CUSTOMER</h3>
                
                <form onSubmit={handleCustomerCreate} className="flex flex-col gap-6">
                  <div>
                    <label className="form-label">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Dieter Rams" 
                      className="input-field"
                      value={customerForm.full_name}
                      onChange={(e) => setCustomerForm({ ...customerForm, full_name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Email Address (Unique)</label>
                    <input 
                      type="email" 
                      placeholder="e.g. dieter@vitsoe.com" 
                      className="input-field"
                      value={customerForm.email}
                      onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Phone Number (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. +49 171 1234567" 
                      className="input-field font-mono"
                      value={customerForm.phone_number}
                      onChange={(e) => setCustomerForm({ ...customerForm, phone_number: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="btn-primary w-full justify-center mt-4">
                    COMMIT CUSTOMER RECORD
                  </button>
                </form>
              </div>

              {/* Customer Listing */}
              <div className="lg:col-span-8">
                
                {/* Search */}
                <div className="mb-6">
                  <input 
                    type="text" 
                    placeholder="SEARCH BY CLIENT NAME OR EMAIL ADDRESS..." 
                    className="input-field uppercase font-mono text-xs tracking-wider"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                </div>

                {/* Table */}
                <div className="border-2 border-black overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-black text-white font-mono text-xs uppercase tracking-widest">
                        <th className="py-4 px-6 font-medium">NAME</th>
                        <th className="py-4 px-6 font-medium">EMAIL</th>
                        <th className="py-4 px-6 font-medium">PHONE</th>
                        <th className="py-4 px-6 font-medium text-center">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black font-body text-sm">
                      {filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-8 text-center font-mono text-xs text-[var(--muted-foreground)] uppercase">
                            NO CUSTOMERS REGISTRATIONS FOUND
                          </td>
                        </tr>
                      ) : (
                        filteredCustomers.map((c) => (
                          <tr key={c.id} className="hover:bg-[var(--muted)] transition-colors duration-100">
                            <td className="py-4 px-6">
                              <span className="font-display font-bold block">{c.full_name}</span>
                              <span className="font-mono text-[9px] text-[var(--muted-foreground)] block">
                                REGISTERED: {new Date(c.created_at).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-mono text-xs">{c.email}</td>
                            <td className="py-4 px-6 font-mono text-xs">{c.phone_number || '—'}</td>
                            <td className="py-4 px-6 text-center">
                              <button 
                                onClick={() => setDeleteConfirm({ show: true, type: 'customer', id: c.id })} 
                                className="p-2 border border-black hover:bg-black hover:text-white transition-colors duration-100"
                                title="Delete Customer"
                              >
                                <Trash2 size={14} />
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
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--muted-foreground)]">[TRANSACTORS]</span>
              <h2 className="font-display font-bold text-5xl uppercase tracking-tight mt-1">SALES ORDERS</h2>
              <div className="line-thick mt-4"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Generate New Order Panel */}
              <div className="lg:col-span-5 border-2 border-black p-8 h-fit">
                <h3 className="font-display font-bold text-xl uppercase mb-6 tracking-tight">GENERATE ORDER</h3>
                
                <form onSubmit={handleOrderCreate} className="flex flex-col gap-6">
                  {/* Select Customer */}
                  <div>
                    <label className="form-label">Client Customer</label>
                    <select 
                      className="input-field font-display font-bold text-sm bg-white"
                      value={orderForm.customer_id}
                      onChange={(e) => setOrderForm({ ...orderForm, customer_id: e.target.value })}
                      required
                    >
                      <option value="">SELECT REGISTERED CUSTOMER...</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
                      ))}
                    </select>
                  </div>

                  <div className="line-thin my-2"></div>

                  {/* Add Order Item segment */}
                  <div>
                    <h4 className="font-mono text-xs uppercase tracking-wider font-bold mb-4">[ADD ORDER ITEM]</h4>
                    
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="form-label">Product Item</label>
                        <select 
                          className="input-field font-mono text-xs bg-white"
                          value={newOrderItem.product_id}
                          onChange={(e) => setNewOrderItem({ ...newOrderItem, product_id: e.target.value })}
                        >
                          <option value="">SELECT PRODUCT SKU...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id} disabled={p.quantity_in_stock === 0}>
                              {p.sku} — {p.name} (${p.price.toFixed(2)}) [STOCK: {p.quantity_in_stock}]
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                          <label className="form-label">Purchase Quantity</label>
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
                          className="btn-secondary py-3 px-6 h-fit"
                        >
                          ADD ITEM
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Added Items List */}
                  <div className="mt-4">
                    <span className="font-mono text-xs uppercase tracking-widest text-[var(--muted-foreground)] block mb-2">[CURRENT LINE ITEMS]</span>
                    
                    {orderForm.items.length === 0 ? (
                      <div className="border border-dashed border-black p-4 text-center font-mono text-[10px] uppercase text-[var(--muted-foreground)]">
                        ADD ITEMS TO INITIATE BASKET
                      </div>
                    ) : (
                      <div className="border border-black divide-y divide-black max-h-48 overflow-y-auto">
                        {orderForm.items.map((item, index) => (
                          <div key={index} className="p-3 flex justify-between items-center text-xs hover:bg-[var(--muted)] font-mono">
                            <div>
                              <span className="font-bold block">{item.sku}</span>
                              <span className="text-[10px] text-[var(--muted-foreground)]">{item.name} x {item.quantity}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                              <button 
                                type="button" 
                                onClick={() => removeOrderItem(index)}
                                className="text-black hover:opacity-60"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Calculated aggregate cost */}
                  <div className="border-t-2 border-black pt-4 flex justify-between items-center select-none">
                    <span className="font-mono text-xs uppercase tracking-wider font-bold">Aggregate Total:</span>
                    <span className="font-display font-bold text-2xl">${orderTotalLive.toFixed(2)}</span>
                  </div>

                  <button 
                    type="submit" 
                    className="btn-primary w-full justify-center mt-2"
                    disabled={orderForm.items.length === 0 || !orderForm.customer_id}
                  >
                    PLACE ORDER & ATOMIC DECREMENT
                  </button>
                </form>
              </div>

              {/* Order Lists */}
              <div className="lg:col-span-7">
                <span className="font-mono text-xs uppercase tracking-widest text-[var(--muted-foreground)] block mb-6">[TRANSACT HISTORY]</span>
                
                {/* Table */}
                <div className="border-2 border-black overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-black text-white font-mono text-xs uppercase tracking-widest">
                        <th className="py-4 px-6 font-medium">ORDER ID</th>
                        <th className="py-4 px-6 font-medium">CUSTOMER</th>
                        <th className="py-4 px-6 font-medium text-right">TOTAL</th>
                        <th className="py-4 px-6 font-medium text-center">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black font-body text-sm">
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-8 text-center font-mono text-xs text-[var(--muted-foreground)] uppercase">
                            NO HISTORY OF COMPLETED ORDERS
                          </td>
                        </tr>
                      ) : (
                        orders.map((o) => (
                          <tr key={o.id} className="hover:bg-[var(--muted)] transition-colors duration-100">
                            <td className="py-4 px-6 font-mono text-xs font-bold">
                              #ORD-{String(o.id).padStart(4, '0')}
                              <span className="block font-normal text-[9px] text-[var(--muted-foreground)]">
                                {new Date(o.created_at).toLocaleString()}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-display font-bold block">{o.customer?.full_name || 'Dieter Rams'}</span>
                              <span className="font-mono text-[9px] text-[var(--muted-foreground)] block">
                                {o.customer?.email}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right font-mono font-bold">
                              ${o.total_amount.toFixed(2)}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex gap-2 justify-center">
                                <button 
                                  onClick={() => setSelectedOrder(o)} 
                                  className="p-2 border border-black hover:bg-black hover:text-white transition-colors duration-100"
                                  title="View Order Details"
                                >
                                  <Eye size={14} />
                                </button>
                                <button 
                                  onClick={() => setDeleteConfirm({ show: true, type: 'order', id: o.id })} 
                                  className="p-2 border border-black hover:bg-black hover:text-white transition-colors duration-100"
                                  title="Cancel/Delete Order"
                                >
                                  <X size={14} />
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

      {/* ================= MODAL: ORDER DETAILS ================= */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black w-full max-w-2xl p-8 relative" style={{ transition: 'all 100ms steps(2)' }}>
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedOrder(null)}
              className="absolute top-6 right-6 p-2 border border-black hover:bg-black hover:text-white transition-colors"
            >
              <X size={16} />
            </button>

            {/* Header info */}
            <div className="mb-6">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--muted-foreground)]">[TRANSACT DETAILS]</span>
              <h3 className="font-display font-bold text-3xl uppercase tracking-tight mt-1">
                ORDER #ORD-{String(selectedOrder.id).padStart(4, '0')}
              </h3>
              <p className="font-mono text-xs text-[var(--muted-foreground)] mt-1">
                COMPLETED TRANSACTION ON: {new Date(selectedOrder.created_at).toLocaleString()}
              </p>
            </div>

            <div className="line-medium my-4"></div>

            {/* Customer Details */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div>
                <span className="form-label">Client Customer</span>
                <span className="font-display font-bold text-md block">{selectedOrder.customer?.full_name}</span>
                <span className="font-mono text-xs text-[var(--muted-foreground)] block">{selectedOrder.customer?.email}</span>
              </div>
              <div>
                <span className="form-label">Contact Phone</span>
                <span className="font-mono text-xs block">{selectedOrder.customer?.phone_number || '—'}</span>
              </div>
            </div>

            <div className="line-thin my-4"></div>

            {/* Ordered Items Table */}
            <div className="mb-6 max-h-48 overflow-y-auto border border-black">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-black text-white uppercase tracking-wider">
                    <th className="p-3">SKU</th>
                    <th className="p-3">PRODUCT</th>
                    <th className="p-3 text-right">UNIT PRICE</th>
                    <th className="p-3 text-right">QTY</th>
                    <th className="p-3 text-right font-bold">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {selectedOrder.items.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--muted)]">
                      <td className="p-3 font-bold">{item.product?.sku || 'SKU'}</td>
                      <td className="p-3 font-body">{item.product?.name || 'Product'}</td>
                      <td className="p-3 text-right">${item.unit_price.toFixed(2)}</td>
                      <td className="p-3 text-right">{item.quantity}</td>
                      <td className="p-3 text-right font-bold">${item.line_total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Aggregate */}
            <div className="flex justify-between items-center border-t-4 border-black pt-4 select-none">
              <span className="font-mono text-sm uppercase tracking-wider font-bold">Transaction Sum:</span>
              <span className="font-display font-bold text-3xl">${selectedOrder.total_amount.toFixed(2)}</span>
            </div>

            {/* Close footer button */}
            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="btn-primary px-8"
              >
                CLOSE DETAILS
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL: GENERIC CONFIRMATION ================= */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black w-full max-w-md p-8 relative">
            <h3 className="font-display font-bold text-2xl uppercase tracking-tight mb-4">
              CONFIRM DESTRUCTIVE ACTION
            </h3>
            
            <p className="font-body text-sm leading-relaxed text-[var(--muted-foreground)] mb-8">
              {deleteConfirm.type === 'order' && 'Warning: Cancelling this order will permanently delete the transaction record and immediately replenish the original quantities back into product stocks.'}
              {deleteConfirm.type === 'product' && 'Warning: Deleting this product SKU will permanently erase it from the catalog. Historical order lists referring to this product will remain but product schema data will be detached.'}
              {deleteConfirm.type === 'customer' && 'Warning: Deleting this customer will remove their client registration record and cascade delete their transaction histories.'}
            </p>

            <div className="flex gap-4 justify-end">
              <button 
                onClick={() => setDeleteConfirm({ show: false, type: '', id: null })}
                className="btn-secondary"
              >
                ABORT ACTION
              </button>
              
              <button 
                onClick={() => {
                  if (deleteConfirm.type === 'product') handleProductDelete(deleteConfirm.id);
                  if (deleteConfirm.type === 'customer') handleCustomerDelete(deleteConfirm.id);
                  if (deleteConfirm.type === 'order') handleOrderCancel(deleteConfirm.id);
                }}
                className="btn-primary"
              >
                CONFIRM DELETION
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
