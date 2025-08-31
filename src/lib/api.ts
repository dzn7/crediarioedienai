import { BACKEND_URL } from './firebase';
import { Crediario, MenuProduct } from '@/types/crediario';

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

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
}

// Crediário API calls
export async function createCrediario(customerName: string, initialValue?: number, initialItemsConsumed?: string): Promise<Crediario> {
  const response = await fetchWithAuth(`${BACKEND_URL}/createCrediario`, {
    method: 'POST',
    body: JSON.stringify({ customerName, initialValue, initialItemsConsumed }),
  });
  return response.json();
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
  return response.json();
}

export async function updateCrediarioName(crediarioId: string, newCustomerName: string): Promise<Crediario> {
  const response = await fetchWithAuth(`${BACKEND_URL}/updateCrediarioName`, {
    method: 'POST',
    body: JSON.stringify({ crediarioId, newCustomerName }),
  });
  return response.json();
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
  return response.json();
}

export async function deleteCrediarioTransaction(crediarioId: string, transactionId: string): Promise<Crediario> {
  const response = await fetchWithAuth(`${BACKEND_URL}/deleteCrediarioTransaction`, {
    method: 'POST',
    body: JSON.stringify({ crediarioId, transactionId }),
  });
  return response.json();
}

export async function concludeCrediario(crediarioId: string): Promise<void> {
  const response = await fetchWithAuth(`${BACKEND_URL}/concludeCrediario`, {
    method: 'PUT',
    body: JSON.stringify({ crediarioId }),
  });
  return response.json();
}

export async function getMenuProducts(): Promise<MenuProduct[]> {
  const response = await fetchWithAuth(`${BACKEND_URL}/getMenuCache`);
  const data = await response.json();
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
  const data = await response.json();
  return Array.isArray(data) ? (data as Pedido[]) : [];
}
