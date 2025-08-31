import { BACKEND_URL } from './firebase';
import { Crediario, MenuProduct } from '@/types/crediario';

// Reusable error with HTTP status and optional response body
export class ApiError extends Error {
  status: number;
  data?: ApiResponseBody;
  constructor(status: number, message: string, data?: ApiResponseBody) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// Generic API response body shape we expect back from the backend
type ApiResponseBody = Record<string, unknown> & {
  message?: string;
  error?: string;
  crediario?: Crediario;
};

// Minimal shapes for external data
type RawProduct = {
  nome?: string;
  name?: string;
  preco?: number | string;
  price?: number | string;
  categoria?: string;
  descricao?: string;
  description?: string;
  isHidden?: boolean;
};
type Pedido = Record<string, unknown>;

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const pin = localStorage.getItem('loggedInUserPin');
  const role = localStorage.getItem('loggedInUserRole');
  
  if (!pin || !role) {
    throw new Error('Usuário não autenticado. Faça login novamente.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-User-Role': role,
    'X-User-Pin': pin,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Always return the response; callers decide how to handle non-OK statuses
  return response;
}

// Crediário API calls
export async function createCrediario(customerName: string, initialValue?: number, initialItemsConsumed?: string): Promise<Crediario> {
  const response = await fetchWithAuth(`${BACKEND_URL}/createCrediario`, {
    method: 'POST',
    body: JSON.stringify({ customerName, initialValue, initialItemsConsumed }),
  });
  const data = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new ApiError(response.status, (data && (data.message || data.error)) || `HTTP ${response.status}`, data);
  }
  return (data && (data.crediario || data)) as Crediario;
}

export async function addCrediarioTransaction(
  crediarioId: string, 
  type: 'payment' | 'consumption' | 'interest',
  amount: number,
  description: string,
  itemsConsumed?: string
): Promise<Crediario> {
  const response = await fetchWithAuth(`${BACKEND_URL}/addCrediarioTransaction`, {
    method: 'POST',
    body: JSON.stringify({ crediarioId, type, amount, description, itemsConsumed }),
  });
  const data = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new ApiError(response.status, (data && (data.message || data.error)) || `HTTP ${response.status}`, data);
  }
  return (data && (data.crediario || data)) as Crediario;
}

export async function updateCrediarioName(crediarioId: string, newCustomerName: string): Promise<Crediario> {
  const response = await fetchWithAuth(`${BACKEND_URL}/updateCrediarioName`, {
    method: 'POST',
    body: JSON.stringify({ crediarioId, newCustomerName }),
  });
  const data = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new ApiError(response.status, (data && (data.message || data.error)) || `HTTP ${response.status}`, data);
  }
  return (data && (data.crediario || data)) as Crediario;
}

export async function editCrediarioTransaction(
  crediarioId: string,
  transactionId: string,
  type: 'payment' | 'consumption' | 'interest',
  amount: number,
  description: string,
  itemsConsumed?: string
): Promise<Crediario> {
  const response = await fetchWithAuth(`${BACKEND_URL}/editCrediarioTransaction`, {
    method: 'POST',
    body: JSON.stringify({ crediarioId, transactionId, type, amount, description, itemsConsumed }),
  });
  const data = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new ApiError(response.status, (data && (data.message || data.error)) || `HTTP ${response.status}`, data);
  }
  return (data && (data.crediario || data)) as Crediario;
}

export async function deleteCrediarioTransaction(crediarioId: string, transactionId: string): Promise<Crediario> {
  const response = await fetchWithAuth(`${BACKEND_URL}/deleteCrediarioTransaction`, {
    method: 'POST',
    body: JSON.stringify({ crediarioId, transactionId }),
  });
  const data = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new ApiError(response.status, (data && (data.message || data.error)) || `HTTP ${response.status}`, data);
  }
  return (data && (data.crediario || data)) as Crediario;
}

export async function concludeCrediario(crediarioId: string): Promise<void> {
  const response = await fetchWithAuth(`${BACKEND_URL}/concludeCrediario`, {
    method: 'PUT',
    body: JSON.stringify({ crediarioId }),
  });
  const data = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new ApiError(response.status, (data && (data.message || data.error)) || `HTTP ${response.status}`, data);
  }
  // Backend returns a message, but callers don't need it here.
  return;
}

export async function getMenuProducts(): Promise<MenuProduct[]> {
  const response = await fetchWithAuth(`${BACKEND_URL}/getMenuCache`);
  const data = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new ApiError(response.status, (data && (data.message || data.error)) || `HTTP ${response.status}`, data);
  }
  const rawProducts = Object.values(data.products || {}).flat() as RawProduct[];
  
  return rawProducts
    .filter(p => !p.isHidden)
    .map((p, idx) => ({
      id: String(idx),
      nome: p.nome || p.name || '',
      preco: Number(p.preco || p.price || 0),
      categoria: p.categoria || 'Outras',
      descricao: p.descricao || p.description,
      isHidden: p.isHidden
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function getPedidos(): Promise<Pedido[]> {
  const response = await fetchWithAuth(`${BACKEND_URL}/getPedidos`);
  const data = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new ApiError(response.status, (data && (data.message || data.error)) || `HTTP ${response.status}`, data);
  }
  return Array.isArray(data) ? (data as Pedido[]) : [];
}
