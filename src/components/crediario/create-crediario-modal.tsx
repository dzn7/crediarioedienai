'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { createCrediario, getMenuProducts, ApiError } from '@/lib/api';
import { parseNumber } from '@/lib/utils';
import { useCrediarios } from '@/hooks/useCrediarios';
import type { MenuProduct } from '@/types/crediario';

interface CreateCrediarioModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preSelectedName?: string;
}

export function CreateCrediarioModal({ 
  open, 
  onClose, 
  onSuccess, 
  preSelectedName = '' 
}: CreateCrediarioModalProps) {
  const [customerName, setCustomerName] = useState(preSelectedName);
  const [initialValue, setInitialValue] = useState('');
  const [initialItems, setInitialItems] = useState('');
  const [loading, setLoading] = useState(false);
  // Products state
  const [products, setProducts] = useState<MenuProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState<Array<{ id: string; nome: string; preco: number; qty: number }>>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { crediarios } = useCrediarios(userRole);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async () => {
      try {
        setProductsLoading(true);
        const data = await getMenuProducts();
        if (!cancelled) setProducts(data);
      } catch (e) {
        console.error('Erro ao buscar produtos do cardápio', e);
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [open]);

  // Load role from localStorage to enable client-side duplicate check via hook
  useEffect(() => {
    if (!open) return;
    try {
      const role = typeof window !== 'undefined' ? localStorage.getItem('loggedInUserRole') : null;
      setUserRole(role);
    } catch (e) {
      // ignore
    }
  }, [open]);

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products;
    return products.filter(p =>
      p.nome.toLowerCase().includes(term) ||
      (p.categoria || '').toLowerCase().includes(term)
    );
  }, [productSearch, products]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.preco * item.qty, 0);
  }, [cart]);

  const cartItemsText = useMemo(() => {
    if (cart.length === 0) return '';
    return cart.map(i => `${i.qty}x ${i.nome}`).join(', ');
  }, [cart]);

  const addToCart = (p: MenuProduct) => {
    setCart(prev => {
      const found = prev.find(i => i.id === p.id);
      if (found) {
        return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { id: p.id, nome: p.nome, preco: p.preco, qty: 1 }];
    });
  };

  const incQty = (id: string) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i));
  const decQty = (id: string) => setCart(prev => prev.flatMap(i => {
    if (i.id !== id) return [i];
    const nextQty = i.qty - 1;
    return nextQty <= 0 ? [] : [{ ...i, qty: nextQty }];
  }));
  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      toast.error('O nome do cliente é obrigatório');
      return;
    }

    // Client-side duplicate check (best-effort). Backend still enforces 409.
    const normalizedInput = customerName.trim().toLowerCase().replace(/\s+/g, ' ');
    const exists = crediarios.some(c => (c.customerName || '').trim().toLowerCase().replace(/\s+/g, ' ') === normalizedInput);
    if (exists) {
      toast.error('Já existe um crediário ativo com este nome.');
      return;
    }

    setLoading(true);
    try {
      // Prefer cart totals if user added items from the menu; otherwise fallback to manual fields
      const valueFromCart = Number(cartTotal.toFixed(2));
      const manualValue = parseNumber(initialValue) || 0;
      const value = cart.length > 0 ? valueFromCart : manualValue;

      const itemsFromCart = cartItemsText;
      const itemsText = (cart.length > 0 ? itemsFromCart : initialItems).trim();

      await createCrediario(customerName.trim(), value, itemsText);
      toast.success('Crediário criado com sucesso!');
      onSuccess();
      onClose();
      setCustomerName('');
      setInitialValue('');
      setInitialItems('');
      setCart([]);
      setProductSearch('');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          toast.error(error.data?.message || 'Já existe um crediário ativo com este nome.');
        } else if (error.status === 401 || error.status === 403) {
          toast.error('Sem permissão. Faça login novamente.');
        } else {
          toast.error(error.data?.message || `Erro (${error.status}) ao criar crediário.`);
        }
      } else {
        toast.error('Erro ao criar crediário');
      }
      console.error('Error creating crediário:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Novo Crediário</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer-name">Nome do Cliente *</Label>
            <Input
              id="customer-name"
              placeholder="Digite o nome do cliente"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          {/* Produtos do cardápio (opcional) */}
          <div className="space-y-2">
            <Label>Adicionar Itens do Cardápio (opcional)</Label>
            <Input
              placeholder="Buscar por nome ou categoria"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
            <div className="max-h-40 overflow-auto border rounded p-2 text-sm">
              {productsLoading ? (
                <div className="text-muted-foreground">Carregando produtos...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-muted-foreground">Nenhum produto encontrado</div>
              ) : (
                filteredProducts.slice(0, 50).map(p => (
                  <div key={p.id} className="flex items-center justify-between py-1">
                    <div>
                      <div className="font-medium">{p.nome}</div>
                      <div className="text-muted-foreground">R$ {p.preco.toFixed(2).replace('.', ',')} • {p.categoria}</div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => addToCart(p)}>Adicionar</Button>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="space-y-2 border rounded p-2">
                <div className="font-medium">Itens Selecionados</div>
                <div className="space-y-1">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div>
                        {item.qty}x {item.nome} — R$ {(item.preco * item.qty).toFixed(2).replace('.', ',')}
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="outline" onClick={() => decQty(item.id)}>-</Button>
                        <Button size="icon" variant="outline" onClick={() => incQty(item.id)}>+</Button>
                        <Button size="sm" variant="ghost" onClick={() => removeItem(item.id)}>Remover</Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Total inicial</span>
                  <span>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="initial-value">Valor Inicial (R$)</Label>
            <Input
              id="initial-value"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={initialValue}
              onChange={(e) => setInitialValue(e.target.value)}
              />
          </div>
          <div className="space-y-2">
            <Label htmlFor="initial-items">Itens Iniciais</Label>
            <Textarea
              id="initial-items"
              placeholder="Ex: 2x Pastel de carne, 1x Refrigerante"
              value={initialItems}
              onChange={(e) => setInitialItems(e.target.value)}
            />
            {cart.length > 0 && (
              <p className="text-xs text-muted-foreground">Resumo: {cartItemsText}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Criando...' : 'Criar Crediário'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

