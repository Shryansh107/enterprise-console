import React, { useState, useEffect, useLayoutEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Eye, 
  X, 
  Menu, 
  ChevronRight, 
  Edit3, 
  Terminal,
  Activity,
  Cpu,
  ShieldAlert,
  Users
} from 'lucide-react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { api } from './services/api';

import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Orders from './pages/Orders';

import HUDToast from './components/HUDToast';
import Modal from './components/Modal';
import { formatCurrency, formatDateTime, padOrderId } from './utils/formatters';

const LOADING_MESSAGES = [
  "CONNECTING TO REMOTE CLOUD DATABASE...",
  "STATUS: SPINNING UP STORAGE DISKS...",
  "DATALINK: WAKING UP DORMANT COMPUTE HANDLERS...",
  "AUTHENTICATING SYSTEM CREDENTIALS...",
  "RESOLVING ENVIRONMENT CONFIG...",
  "FETCHING INTEGRITY SCHEMAS...",
  "RETRIEVING PRODUCT SKU ENTRIES...",
  "SYNCHRONIZING CUSTOMER ACCOUNTS MATRIX...",
  "COMPILING COMPLETE SALES TRANSACTION BLOCS...",
  "INITIAL HANDSHAKE READY — DEPLOYING DASHBOARD..."
];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const isDashboardActive = currentPath === '/';
  const isProductsActive = currentPath === '/products';
  const isCustomersActive = currentPath === '/customers';
  const isOrdersActive = currentPath === '/orders';

  // Navigation & Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Data Lists
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);

  // Pagination skip/limit states
  const PAGE_SIZE = 50;
  const [hasMore, setHasMore] = useState({
    products: true,
    customers: true,
    orders: true
  });
  const [loadingMore, setLoadingMore] = useState(false);

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Typewriter Fullscreen Loader States
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [visibleLines, setVisibleLines] = useState([]);
  const [currentLineIdx, setCurrentLineIdx] = useState(0);
  const [typedText, setTypedText] = useState("");
  
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
    stock_status: '',
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

  // Dedicated filters load helpers with page offsets
  const loadProducts = async (currentFilters = {}, reset = false, currentCount = 0) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const skip = reset ? 0 : currentCount;
      const apiFilters = {
        ...currentFilters,
        skip,
        limit: PAGE_SIZE
      };
      const data = await api.products.list(apiFilters);
      
      if (reset) {
        setProducts(data);
      } else {
        setProducts(prev => [...prev, ...data]);
      }
      
      setHasMore(prev => ({
        ...prev,
        products: data.length === PAGE_SIZE
      }));
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch product catalog.', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadCustomers = async (currentFilters = {}, reset = false, currentCount = 0) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const skip = reset ? 0 : currentCount;
      const apiFilters = {
        ...currentFilters,
        skip,
        limit: PAGE_SIZE
      };
      const data = await api.customers.list(apiFilters);
      
      if (reset) {
        setCustomers(data);
      } else {
        setCustomers(prev => [...prev, ...data]);
      }
      
      setHasMore(prev => ({
        ...prev,
        customers: data.length === PAGE_SIZE
      }));
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch customer nodes.', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadOrders = async (currentFilters = {}, reset = false, currentCount = 0) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const skip = reset ? 0 : currentCount;
      const apiFilters = {
        ...currentFilters,
        skip,
        limit: PAGE_SIZE
      };
      const data = await api.orders.list(apiFilters);
      
      if (reset) {
        setOrders(data);
      } else {
        setOrders(prev => [...prev, ...data]);
      }
      
      setHasMore(prev => ({
        ...prev,
        orders: data.length === PAGE_SIZE
      }));
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch transaction ledger.', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Fetch initial core data for Dashboard stats (loads a larger list to display metrics accurately)
  const loadData = async () => {
    setLoading(true);
    try {
      const [prodData, custData, ordData] = await Promise.all([
        api.products.list({ skip: 0, limit: 2000 }),
        api.customers.list({ skip: 0, limit: 2000 }),
        api.orders.list({ skip: 0, limit: 2000 })
      ]);
      setProducts(prodData);
      setCustomers(custData);
      setOrders(ordData);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Database synchronization error. Please ensure the backend server is online.');
      showToast('Datalink handshake failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper to sync filter changes to URL search parameters
  const updateURLWithFilters = (table, filterPatch) => {
    const searchParams = new URLSearchParams();
    
    // Combine currently active table filters with the new patch
    const mergedFilters = {
      ...appliedFilters[table],
      ...filterPatch
    };

    // Populate URL search params with non-empty values
    Object.keys(mergedFilters).forEach(key => {
      const value = mergedFilters[key];
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, value);
      }
    });

    // Navigate to the current path with the new search string
    navigate({
      pathname: location.pathname,
      search: searchParams.toString()
    });
  };

  // Parse URL search parameters on route/query changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filters = {};
    params.forEach((value, key) => {
      filters[key] = value;
    });

    if (currentPath === '/products') {
      // Map stock_status parameter to API filters
      const apiFilters = { ...filters };
      if (filters.stock_status === 'low_stock') {
        apiFilters.max_stock = 5;
        apiFilters.min_stock = null;
      } else if (filters.stock_status === 'depleted') {
        apiFilters.max_stock = 0;
        apiFilters.min_stock = null;
      } else {
        delete apiFilters.max_stock;
        delete apiFilters.min_stock;
      }
      delete apiFilters.stock_status;

      setStagedFilters(prev => ({
        ...prev,
        sku: filters.sku || '',
        name: filters.name || '',
        min_price: filters.min_price || '',
        max_price: filters.max_price || '',
        stock_status: filters.stock_status || '',
      }));

      setAppliedFilters(prev => ({
        ...prev,
        products: filters
      }));

      loadProducts(apiFilters, true, 0);
      
      // Load baseline customers and orders if not populated yet
      if (customers.length === 0) loadCustomers({}, true, 0);
      if (orders.length === 0) loadOrders({}, true, 0);

    } else if (currentPath === '/customers') {
      setStagedFilters(prev => ({
        ...prev,
        name: filters.name || '',
        email: filters.email || '',
        phone: filters.phone || '',
      }));

      setAppliedFilters(prev => ({
        ...prev,
        customers: filters
      }));

      loadCustomers(filters, true, 0);

      // Load baseline products and orders if not populated yet
      if (products.length === 0) loadProducts({}, true, 0);
      if (orders.length === 0) loadOrders({}, true, 0);

    } else if (currentPath === '/orders') {
      setStagedFilters(prev => ({
        ...prev,
        txn_id: filters.txn_id || '',
        customer_name: filters.customer_name || '',
        min_amount: filters.min_amount || '',
        max_amount: filters.max_amount || '',
      }));

      setAppliedFilters(prev => ({
        ...prev,
        orders: filters
      }));

      loadOrders(filters, true, 0);

      // Load baseline products and customers if not populated yet
      if (products.length === 0) loadProducts({}, true, 0);
      if (customers.length === 0) loadCustomers({}, true, 0);

    } else if (currentPath === '/') {
      // Dashboard - load fresh baseline numbers
      loadData();
    }
  }, [location.pathname, location.search]);

  // Intercept route changes and show loader instantly before browser paints
  useLayoutEffect(() => {
    setLoading(true);
  }, [location.pathname]);

  // Typewriter effect timer logic
  useEffect(() => {
    if (!isInitialLoad || !loading) return;

    if (currentLineIdx < LOADING_MESSAGES.length) {
      const fullText = LOADING_MESSAGES[currentLineIdx];
      let charIdx = 0;
      setTypedText("");

      const timer = setInterval(() => {
        setTypedText((prev) => prev + fullText.charAt(charIdx));
        charIdx++;
        if (charIdx >= fullText.length) {
          clearInterval(timer);
          setTimeout(() => {
            setVisibleLines((prev) => [...prev, fullText]);
            setCurrentLineIdx((prev) => prev + 1);
          }, 800);
        }
      }, 30);

      return () => clearInterval(timer);
    } else {
      // Periodic wait lines if cloud service wakeup is delayed
      const timer = setInterval(() => {
        setVisibleLines((prev) => [...prev, "CLOUD GATEWAY DELAYED... RETRYING DATA FEED PINGS... (SERVER STILL WAKING UP)"]);
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [currentLineIdx, isInitialLoad, loading]);

  // Track initial load completion (wakes up when products/data exist or error occurs)
  useEffect(() => {
    if (isInitialLoad && !loading && (products.length > 0 || customers.length > 0 || orders.length > 0 || error)) {
      setIsInitialLoad(false);
    }
  }, [loading, products, customers, orders, error]);

  // Load more trigger callbacks mapped to paginated offsets
  const handleLoadMoreProducts = (currentCount) => {
    const params = new URLSearchParams(location.search);
    const filters = {};
    params.forEach((value, key) => {
      filters[key] = value;
    });

    const apiFilters = { ...filters };
    if (filters.stock_status === 'low_stock') {
      apiFilters.max_stock = 5;
      apiFilters.min_stock = null;
    } else if (filters.stock_status === 'depleted') {
      apiFilters.max_stock = 0;
      apiFilters.min_stock = null;
    } else {
      delete apiFilters.max_stock;
      delete apiFilters.min_stock;
    }
    delete apiFilters.stock_status;

    loadProducts(apiFilters, false, currentCount);
  };

  const handleLoadMoreCustomers = (currentCount) => {
    const params = new URLSearchParams(location.search);
    const filters = {};
    params.forEach((value, key) => {
      filters[key] = value;
    });
    loadCustomers(filters, false, currentCount);
  };

  const handleLoadMoreOrders = (currentCount) => {
    const params = new URLSearchParams(location.search);
    const filters = {};
    params.forEach((value, key) => {
      filters[key] = value;
    });
    loadOrders(filters, false, currentCount);
  };

  // Filter application helpers
  const handleApplyFilter = (table, column, filterPatch) => {
    setActiveFilterDropdown({ table: '', column: '' });
    updateURLWithFilters(table, filterPatch);
  };

  const handleClearFilter = (table, column, fieldsToClear) => {
    setActiveFilterDropdown({ table: '', column: '' });
    
    // Clear staged input states
    const newStaged = { ...stagedFilters };
    fieldsToClear.forEach(field => {
      newStaged[field] = '';
    });
    setStagedFilters(newStaged);

    // Create filter patch with empty values to omit them from the URL query params
    const filterPatch = {};
    fieldsToClear.forEach(field => {
      filterPatch[field] = '';
    });
    
    updateURLWithFilters(table, filterPatch);
  };

  const handleClearAllFilters = (table) => {
    setActiveFilterDropdown({ table: '', column: '' });
    
    const newStaged = { ...stagedFilters };
    if (table === 'products') {
      ['sku', 'name', 'min_price', 'max_price', 'min_stock', 'max_stock', 'stock_status'].forEach(k => newStaged[k] = '');
    } else if (table === 'customers') {
      ['name', 'email', 'phone'].forEach(k => newStaged[k] = '');
    } else if (table === 'orders') {
      ['txn_id', 'customer_name', 'min_amount', 'max_amount'].forEach(k => newStaged[k] = '');
    }
    setStagedFilters(newStaged);

    // Navigate to current pathname with clear search query
    navigate({
      pathname: location.pathname,
      search: ''
    });
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
      showToast('Product successfully deleted.');
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
      showToast('Customer profile successfully deleted.');
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

    if (selectedProduct.quantity_in_stock < newOrderItem.quantity) {
      showToast(`Insufficient stock: only ${selectedProduct.quantity_in_stock} items remaining in inventory.`, 'error');
      return;
    }

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
      showToast('Order successfully cancelled. Stock levels restored.');
      loadOrders();
      loadProducts();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleteConfirm({ show: false, type: '', id: null });
    }
  };

  // Named function for delete confirmation action (satisfying rule 9 - definition > 5 lines)
  const handleConfirmDelete = () => {
    const { type, id } = deleteConfirm;
    if (type === 'product') handleProductDelete(id);
    if (type === 'customer') handleCustomerDelete(id);
    if (type === 'order') handleOrderCancel(id);
  };

  // Helper Calculations
  const lowStockProductsCount = products.filter(p => p.quantity_in_stock <= LOW_STOCK_THRESHOLD).length;
  const orderTotalLive = orderForm.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-[#0b0b12] text-[#f3f4f6] flex flex-col lg:flex-row relative">
      
      {/* Fullscreen Loader Overlay */}
      {loading && (isInitialLoad ? (
        <div className="fullscreen-loader-overlay select-none">
          <div className="loader"></div>
          <div className="loader-messages-container">
            <div className="font-display font-bold text-white text-[10px] tracking-wider mb-6">
              SYSTEM INITIALIZATION — DATABASE HANDSHAKE
            </div>
            {visibleLines.map((line, idx) => (
              <div key={idx} className="text-[#9ca3af] font-mono text-[9px] mb-1">// {line}</div>
            ))}
            {currentLineIdx < LOADING_MESSAGES.length && (
              <div className="text-white font-mono text-[9px] font-semibold">
                &gt; {typedText}
                <span className="loader-cursor"></span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="fullscreen-loader-overlay select-none">
          <div className="loader"></div>
          <div className="mt-6 font-mono text-[9px] uppercase tracking-widest text-[#9ca3af]">// Syncing Database Ledger</div>
        </div>
      ))}
      
      {/* Dynamic Toast System */}
      <HUDToast 
        show={toast.show} 
        message={toast.message} 
        onClose={() => setToast(prev => ({ ...prev, show: false }))} 
      />

      {/* Navigation Sidebar (Desktop B2B Console) */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#12131a] border-r border-[#2a2d3a] p-8 shrink-0 justify-between select-none">
        <div>
          {/* Logo Brand - Sleek Sans-Serif Enterprise Header */}
          <div className="mb-12">
            <h1 className="font-display font-bold text-2xl tracking-tight uppercase leading-none text-white">
              ETHARA
              <span className="block font-mono text-[9px] font-bold tracking-[0.25em] mt-3 text-[var(--accent)]">ENTERPRISE CONSOLE</span>
            </h1>
          </div>

          <nav className="flex flex-col gap-2">
            <NavLink 
              to="/"
              end
              className={({ isActive }) => `w-full text-left px-4 py-3 font-mono text-[10px] tracking-wider uppercase flex justify-between items-center transition-all duration-150 border-l-2 rounded-md ${isActive ? 'bg-[#171924] border-[var(--accent)] text-white font-semibold' : 'border-transparent text-[#9ca3af] hover:text-white hover:bg-[#171924]/50'}`}
            >
              <span>Dashboard Overview</span>
              <Terminal size={12} className={isDashboardActive ? 'text-[var(--accent)]' : 'opacity-40'} />
            </NavLink>
            <NavLink 
              to="/products"
              className={({ isActive }) => `w-full text-left px-4 py-3 font-mono text-[10px] tracking-wider uppercase flex justify-between items-center transition-all duration-150 border-l-2 rounded-md ${isActive ? 'bg-[#171924] border-[var(--accent)] text-white font-semibold' : 'border-transparent text-[#9ca3af] hover:text-white hover:bg-[#171924]/50'}`}
            >
              <span>Inventory SKUs</span>
              <Cpu size={12} className={isProductsActive ? 'text-[var(--accent)]' : 'opacity-40'} />
            </NavLink>
            <NavLink 
              to="/customers"
              className={({ isActive }) => `w-full text-left px-4 py-3 font-mono text-[10px] tracking-wider uppercase flex justify-between items-center transition-all duration-150 border-l-2 rounded-md ${isActive ? 'bg-[#171924] border-[var(--accent)] text-white font-semibold' : 'border-transparent text-[#9ca3af] hover:text-white hover:bg-[#171924]/50'}`}
            >
              <span>Customer Nodes</span>
              <Users size={12} className={isCustomersActive ? 'text-[var(--accent)]' : 'opacity-40'} />
            </NavLink>
            <NavLink 
              to="/orders"
              className={({ isActive }) => `w-full text-left px-4 py-3 font-mono text-[10px] tracking-wider uppercase flex justify-between items-center transition-all duration-150 border-l-2 rounded-md ${isActive ? 'bg-[#171924] border-[var(--accent)] text-white font-semibold' : 'border-transparent text-[#9ca3af] hover:text-white hover:bg-[#171924]/50'}`}
            >
              <span>Transaction Blocs</span>
              <Activity size={12} className={isOrdersActive ? 'text-[var(--accent)]' : 'opacity-40'} />
            </NavLink>
          </nav>
        </div>

      </aside>

      {/* Navigation Topbar (Mobile) */}
      <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-[#12131a] border-b border-[#2a2d3a] w-full sticky top-0 z-50">
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
        <div className="lg:hidden fixed top-[60px] left-0 w-full h-[calc(100vh-60px)] bg-[#0c0c14] z-40 flex flex-col p-8 justify-between border-b border-[var(--accent)]">
          <nav className="flex flex-col gap-4">
            <NavLink 
              to="/"
              end
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => `w-full text-left px-4 py-4 font-mono text-xs tracking-wider uppercase border flex justify-between items-center rounded-md transition-all ${isActive ? 'border-[var(--accent)] text-white bg-[#171924]/50' : 'border-[#2a2d3a] text-[#9ca3af] hover:text-[var(--accent)] hover:border-[var(--accent)]'}`}
            >
              <span>Dashboard Overview</span>
              <ChevronRight size={14} />
            </NavLink>
            <NavLink 
              to="/products"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => `w-full text-left px-4 py-4 font-mono text-xs tracking-wider uppercase border flex justify-between items-center rounded-md transition-all ${isActive ? 'border-[var(--accent)] text-white bg-[#171924]/50' : 'border-[#2a2d3a] text-[#9ca3af] hover:text-[var(--accent)] hover:border-[var(--accent)]'}`}
            >
              <span>Inventory Catalog</span>
              <ChevronRight size={14} />
            </NavLink>
            <NavLink 
              to="/customers"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => `w-full text-left px-4 py-4 font-mono text-xs tracking-wider uppercase border flex justify-between items-center rounded-md transition-all ${isActive ? 'border-[var(--accent)] text-white bg-[#171924]/50' : 'border-[#2a2d3a] text-[#9ca3af] hover:text-[var(--accent)] hover:border-[var(--accent)]'}`}
            >
              <span>Customer Nodes</span>
              <ChevronRight size={14} />
            </NavLink>
            <NavLink 
              to="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => `w-full text-left px-4 py-4 font-mono text-xs tracking-wider uppercase border flex justify-between items-center rounded-md transition-all ${isActive ? 'border-[var(--accent)] text-white bg-[#171924]/50' : 'border-[#2a2d3a] text-[#9ca3af] hover:text-[var(--accent)] hover:border-[var(--accent)]'}`}
            >
              <span>Transaction Blocs</span>
              <ChevronRight size={14} />
            </NavLink>
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

        <Routes>
          <Route 
            path="/" 
            element={
              <Dashboard 
                products={products}
                customers={customers}
                orders={orders}
                lowStockProductsCount={lowStockProductsCount}
                onNavigateTo={navigate}
                setShowOrderModal={setShowOrderModal}
                setShowProductModal={setShowProductModal}
                setShowCustomerModal={setShowCustomerModal}
              />
            } 
          />
          <Route 
            path="/products" 
            element={
              <Products 
                products={products}
                loading={loading}
                appliedFilters={appliedFilters}
                stagedFilters={stagedFilters}
                setStagedFilters={setStagedFilters}
                activeFilterDropdown={activeFilterDropdown}
                setActiveFilterDropdown={setActiveFilterDropdown}
                handleApplyFilter={handleApplyFilter}
                handleClearFilter={handleClearFilter}
                handleClearAllFilters={handleClearAllFilters}
                setShowProductModal={setShowProductModal}
                setEditProduct={setEditProduct}
                setDeleteConfirm={setDeleteConfirm}
                LOW_STOCK_THRESHOLD={LOW_STOCK_THRESHOLD}
                loadingMore={loadingMore}
                hasMore={hasMore.products}
                onLoadMore={handleLoadMoreProducts}
              />
            } 
          />
          <Route 
            path="/customers" 
            element={
              <Customers 
                customers={customers}
                loading={loading}
                appliedFilters={appliedFilters}
                stagedFilters={stagedFilters}
                setStagedFilters={setStagedFilters}
                activeFilterDropdown={activeFilterDropdown}
                setActiveFilterDropdown={setActiveFilterDropdown}
                handleApplyFilter={handleApplyFilter}
                handleClearFilter={handleClearFilter}
                handleClearAllFilters={handleClearAllFilters}
                setShowCustomerModal={setShowCustomerModal}
                setDeleteConfirm={setDeleteConfirm}
                loadingMore={loadingMore}
                hasMore={hasMore.customers}
                onLoadMore={handleLoadMoreCustomers}
              />
            } 
          />
          <Route 
            path="/orders" 
            element={
              <Orders 
                orders={orders}
                loading={loading}
                appliedFilters={appliedFilters}
                stagedFilters={stagedFilters}
                setStagedFilters={setStagedFilters}
                activeFilterDropdown={activeFilterDropdown}
                setActiveFilterDropdown={setActiveFilterDropdown}
                handleApplyFilter={handleApplyFilter}
                handleClearFilter={handleClearFilter}
                handleClearAllFilters={handleClearAllFilters}
                setShowOrderModal={setShowOrderModal}
                setSelectedOrder={setSelectedOrder}
                setDeleteConfirm={setDeleteConfirm}
                loadingMore={loadingMore}
                hasMore={hasMore.orders}
                onLoadMore={handleLoadMoreOrders}
              />
            } 
          />
        </Routes>

      </main>

      {/* ================= MODAL: INJECT SKU / EDIT SKU CATALOG ================= */}
      <Modal
        isOpen={showProductModal || !!editProduct}
        onClose={() => { setShowProductModal(false); setEditProduct(null); }}
        tag="[SKU Registration Node]"
        title={editProduct ? 'Edit SKU Profile' : 'Inject SKU Catalog'}
        subTitle="WRITE MODE: DATABASE LIVE STREAMING"
      >
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
              <label className="form-label">Unit Value ($)</label>
              <input 
                type="number" 
                step="0.01" 
                min="0.01"
                placeholder="49.99" 
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
              <label className="form-label">Quantity Staged</label>
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
      </Modal>

      {/* ================= MODAL: REGISTER CLIENT NODE ================= */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        tag="[Client Profile Injection]"
        title="Register Client Node"
        subTitle="WRITE MODE: DATABASE LIVE STREAMING"
      >
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
      </Modal>

      {/* ================= MODAL: COMPILE TRANSACTION ================= */}
      <Modal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        tag="[Transaction Compiler Engine]"
        title="Compile Transaction"
        subTitle="WRITE MODE: DATABASE LIVE ACID TRANSACTION"
        size="lg"
      >
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

          {/* Add Staged Item Box */}
          <div className="border border-[#2a2d3a] p-4 rounded bg-[#171924]/20">
            <span className="form-label mb-3 text-[10px]">Staging Area — Load Items</span>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="form-label text-[9px]">Select Catalog Product SKU</label>
                <select 
                  className="input-field text-xs font-mono"
                  value={newOrderItem.product_id}
                  onChange={(e) => setNewOrderItem({ ...newOrderItem, product_id: e.target.value })}
                >
                  <option value="">CHOOSE SKU...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id} disabled={p.quantity_in_stock <= 0}>
                      {p.sku} — {p.name} ({formatCurrency(p.price)}) [{p.quantity_in_stock} AVAILABLE]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label text-[9px]">Quantity Staged</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    min="1" 
                    className="input-field font-mono text-xs text-center"
                    value={newOrderItem.quantity}
                    onChange={(e) => setNewOrderItem({ ...newOrderItem, quantity: parseInt(e.target.value) || 1 })}
                  />
                  <button 
                    type="button" 
                    onClick={addOrderItem}
                    className="btn-primary py-1 px-4 text-xs tracking-wider"
                  >
                    Stage
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Staged Items Table list */}
          <div>
            <span className="form-label mb-2 text-[10px]">Staged Transaction queue ({orderForm.items.length})</span>
            {orderForm.items.length === 0 ? (
              <div className="border border-dashed border-[#2a2d3a] p-6 text-center text-[#9ca3af] text-xs uppercase tracking-widest font-mono rounded">
                Transaction Memory Staging Empty
              </div>
            ) : (
              <div className="border border-[#2a2d3a] rounded max-h-36 overflow-y-auto">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-[#171924] text-[#9ca3af] uppercase tracking-wider border-b border-[#2a2d3a] font-mono">
                      <th className="p-2 font-semibold">SKU</th>
                      <th className="p-2 font-semibold">Product Name</th>
                      <th className="p-2 text-right font-semibold">Value</th>
                      <th className="p-2 text-right font-semibold">Qty</th>
                      <th className="p-2 text-right font-semibold">Sum</th>
                      <th className="p-2 text-center font-semibold">Void</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2d3a] text-[#f3f4f6] font-mono">
                    {orderForm.items.map((item, index) => (
                      <tr key={index} className="hover:bg-[#171924]/30">
                        <td className="p-2 font-bold text-[var(--accent)]">{item.sku}</td>
                        <td className="p-2 font-body text-white">{item.name}</td>
                        <td className="p-2 text-right">{formatCurrency(item.price)}</td>
                        <td className="p-2 text-right text-white font-bold">{item.quantity}</td>
                        <td className="p-2 text-right text-[var(--accent)] font-bold">{formatCurrency(item.price * item.quantity)}</td>
                        <td className="p-2 text-center">
                          <button 
                            type="button" 
                            onClick={() => removeOrderItem(index)}
                            className="p-1 border border-transparent hover:border-[#ef4444] text-[#9ca3af] hover:text-[#ef4444] rounded transition-all"
                            title="Remove item"
                          >
                            <Trash2 size={10} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Live subtotal */}
          <div className="border-t border-[#2a2d3a] pt-4 flex justify-between items-center select-none">
            <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#9ca3af]">Total Transaction:</span>
            <span className="font-display font-bold text-2xl text-white">{formatCurrency(orderTotalLive)}</span>
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
      </Modal>

      {/* ================= MODAL: ORDER DETAILS (Refined Overlay) ================= */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        tag="[Operational Audit]"
        title={`Transaction #TRX-${padOrderId(selectedOrder?.id)}`}
        subTitle={`INVENTORY BLOCK WRITE TIME: ${selectedOrder ? formatDateTime(selectedOrder.created_at) : ''}`}
        size="lg"
      >
        {selectedOrder && (
          <>
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
                      <td className="p-3 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="p-3 text-right text-white font-bold">{item.quantity}</td>
                      <td className="p-3 text-right text-[var(--accent)] font-bold">{formatCurrency(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Aggregate */}
            <div className="flex justify-between items-center border-t border-[#2a2d3a] pt-4 select-none">
              <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#9ca3af]">AGGREGATE VALUE:</span>
              <span className="font-display font-bold text-2xl text-white">{formatCurrency(selectedOrder.total_amount)}</span>
            </div>
          </>
        )}
      </Modal>

      {/* ================= MODAL: GENERIC CONFIRMATION (Refined HUD Overlay) ================= */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#12131a] border border-[#ef4444]/30 w-full max-w-md p-8 relative rounded-lg shadow-2xl">
            <h3 className="font-display font-semibold text-lg uppercase tracking-wider mb-4 text-[#ef4444]">
              // Warning: Permanent Action
            </h3>
            
            <p className="font-body text-xs leading-relaxed text-[#9ca3af] mb-8">
              {deleteConfirm.type === 'order' && 'Are you sure you want to cancel this order? This action will permanently remove the order and return the reserved stock back to the inventory.'}
              {deleteConfirm.type === 'product' && 'Are you sure you want to delete this product? This will permanently remove the product from your catalog. Previous orders containing this product will not be affected.'}
              {deleteConfirm.type === 'customer' && 'Are you sure you want to delete this customer profile? This will permanently delete the customer along with all of their order history. This action cannot be undone.'}
            </p>

            <div className="flex gap-4 justify-end">
              <button 
                onClick={() => setDeleteConfirm({ show: false, type: '', id: null })}
                className="btn-secondary"
              >
                Cancel
              </button>
              
              <button 
                onClick={handleConfirmDelete}
                className="btn-primary"
                style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
              >
                {deleteConfirm.type === 'order' ? 'Cancel Order' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
