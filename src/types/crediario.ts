export interface Transaction {
  id: string;
  type: 'payment' | 'consumption' | 'interest';
  amount: number;
  description: string;
  itemsConsumed?: string;
  date: Date | string;
}

export interface Crediario {
  id: string;
  customerName: string;
  totalBalance: number;
  isActive: boolean;
  createdAt: Date | string;
  history?: Transaction[];
}

export interface User {
  pin: string;
  displayName: string;
  role: 'owner' | 'waiter';
}

export interface MenuProduct {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  descricao?: string;
  isHidden?: boolean;
}
