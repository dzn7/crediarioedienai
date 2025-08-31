'use client';

import { useState } from 'react';
import { formatBR, parseNumber } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { addCrediarioTransaction } from '@/lib/api';
import { Crediario } from '@/types/crediario';

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  crediario: Crediario | null;
}

export function AddPaymentModal({ open, onClose, onSuccess, crediario }: TransactionModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!crediario) return;
    
    const value = parseFloat(amount.replace(',', '.'));
    if (isNaN(value) || value <= 0) {
      toast.error('Valor inválido');
      return;
    }

    setLoading(true);
    try {
      await addCrediarioTransaction(crediario.id, 'payment', value, description);
      toast.success('Pagamento registrado com sucesso!');
      onSuccess();
      onClose();
      setAmount('');
      setDescription('');
    } catch (error) {
      toast.error('Erro ao registrar pagamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Pagamento - {crediario?.customerName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment-amount">Valor do Pagamento (R$)</Label>
            <Input
              id="payment-amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment-description">Descrição (opcional)</Label>
            <Textarea
              id="payment-description"
              placeholder="Ex: Pagamento em dinheiro"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Processando...' : 'Confirmar Pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddConsumptionModal({ open, onClose, onSuccess, crediario }: TransactionModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [itemsConsumed, setItemsConsumed] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!crediario) return;
    
    const value = parseFloat(amount.replace(',', '.'));
    if (isNaN(value) || value <= 0) {
      toast.error('Valor inválido');
      return;
    }

    setLoading(true);
    try {
      await addCrediarioTransaction(crediario.id, 'consumption', value, description, itemsConsumed);
      toast.success('Consumo adicionado com sucesso!');
      onSuccess();
      onClose();
      setAmount('');
      setDescription('');
      setItemsConsumed('');
    } catch (error) {
      toast.error('Erro ao adicionar consumo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Consumo - {crediario?.customerName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="consumption-amount">Valor do Consumo (R$)</Label>
            <Input
              id="consumption-amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="consumption-description">Descrição</Label>
            <Textarea
              id="consumption-description"
              placeholder="Ex: Pastel de carne"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="items-consumed">Itens Consumidos</Label>
            <Textarea
              id="items-consumed"
              placeholder="Ex: 2x Pastel de carne, 1x Refrigerante"
              value={itemsConsumed}
              onChange={(e) => setItemsConsumed(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Adicionando...' : 'Confirmar Consumo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddInterestModal({ open, onClose, onSuccess, crediario }: TransactionModalProps) {
  const [percentage, setPercentage] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!crediario) return;
    
    const interestPercentage = parseNumber(percentage);
    if (isNaN(interestPercentage) || interestPercentage <= 0) {
      toast.error('Porcentagem inválida');
      return;
    }

    if (crediario.totalBalance <= 0) {
      toast.error('Não é possível adicionar juros a um saldo zero ou negativo');
      return;
    }

    const interestAmount = (crediario.totalBalance * interestPercentage) / 100;
    
    setLoading(true);
    try {
      await addCrediarioTransaction(
        crediario.id, 
        'interest', 
        interestAmount, 
        description || `Juros de ${percentage}%`,
        `Juros (${percentage}%)`
      );
      toast.success('Juros adicionados com sucesso!');
      onSuccess();
      onClose();
      setPercentage('');
      setDescription('');
    } catch (error) {
      toast.error('Erro ao adicionar juros');
    } finally {
      setLoading(false);
    }
  };

  const interestAmount = crediario && percentage ? 
    (crediario.totalBalance * parseNumber(percentage)) / 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Juros - {crediario?.customerName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="interest-percentage">Porcentagem de Juros (%)</Label>
            <Input
              id="interest-percentage"
              type="number"
              step="0.1"
              placeholder="5.0"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
            />
            {percentage && crediario && (
              <p className="text-sm text-muted-foreground">
                Valor dos juros: R$ {formatBR(interestAmount)}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="interest-description">Descrição (opcional)</Label>
            <Textarea
              id="interest-description"
              placeholder="Ex: Juros por atraso"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Adicionando...' : 'Adicionar Juros'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
