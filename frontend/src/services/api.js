const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const data = await response.json();
      errorMessage = data.detail || data.message || errorMessage;
    } catch (e) {
      // Failed to parse JSON error
    }
    throw new Error(errorMessage);
  }
  
  if (response.status === 204) {
    return null;
  }
  
  return response.json();
}

export const api = {
  products: {
    list: async (search = '') => {
      const url = new URL(`${API_URL}/api/products/`);
      if (search) url.searchParams.append('search', search);
      const res = await fetch(url.toString());
      return handleResponse(res);
    },
    get: async (id) => {
      const res = await fetch(`${API_URL}/api/products/${id}`);
      return handleResponse(res);
    },
    create: async (data) => {
      const res = await fetch(`${API_URL}/api/products/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    update: async (id, data) => {
      const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    delete: async (id) => {
      const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'DELETE',
      });
      return handleResponse(res);
    },
  },
  
  customers: {
    list: async (search = '') => {
      const url = new URL(`${API_URL}/api/customers/`);
      if (search) url.searchParams.append('search', search);
      const res = await fetch(url.toString());
      return handleResponse(res);
    },
    create: async (data) => {
      const res = await fetch(`${API_URL}/api/customers/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    delete: async (id) => {
      const res = await fetch(`${API_URL}/api/customers/${id}`, {
        method: 'DELETE',
      });
      return handleResponse(res);
    },
  },
  
  orders: {
    list: async () => {
      const res = await fetch(`${API_URL}/api/orders/`);
      return handleResponse(res);
    },
    create: async (data) => {
      const res = await fetch(`${API_URL}/api/orders/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    delete: async (id) => {
      const res = await fetch(`${API_URL}/api/orders/${id}`, {
        method: 'DELETE',
      });
      return handleResponse(res);
    },
  },
};
