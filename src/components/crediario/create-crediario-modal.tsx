'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { createCrediario } from '@/lib/api';
import { parseNumber } from '@/lib/utils';

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

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      toast.error('O nome do cliente é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const value = parseNumber(initialValue) || 0;
      await createCrediario(customerName.trim(), value, initialItems.trim());
      toast.success('Crediário criado com sucesso!');
      onSuccess();
      onClose();
      setCustomerName('');
      setInitialValue('');
      setInitialItems('');
    } catch (error) {
      toast.error('Erro ao criar crediário');
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
