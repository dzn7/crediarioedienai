'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit, Trash2 } from 'lucide-react';
import { Crediario, Transaction } from '@/types/crediario';
import { formatBR } from '@/lib/utils';

interface TransactionsTableProps {
  open: boolean;
  onClose: () => void;
  crediario: Crediario | null;
  onEditTransaction: (crediario: Crediario, transaction: Transaction) => void;
  onDeleteTransaction: (crediario: Crediario, transaction: Transaction) => void;
}

export function TransactionsTable({ 
  open, 
  onClose, 
  crediario, 
  onEditTransaction,
  onDeleteTransaction 
}: TransactionsTableProps) {
  if (!crediario) return null;

  const transactions = crediario.history || [];

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'payment': return 'Pagamento';
      case 'consumption': return 'Consumo';
      case 'interest': return 'Juros';
      default: return type;
    }
  };

  const getTransactionVariant = (type: string) => {
    switch (type) {
      case 'payment': return 'default';
      case 'consumption': return 'destructive';
      case 'interest': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Transações de {crediario.customerName}</DialogTitle>
        </DialogHeader>
        <div className="overflow-auto">
          {transactions.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Nenhuma transação registrada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.date).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTransactionVariant(transaction.type)}>
                        {getTransactionTypeLabel(transaction.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{transaction.description || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {transaction.itemsConsumed || '-'}
                    </TableCell>
                    <TableCell className="font-mono">
                      R$ {formatBR(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditTransaction(crediario, transaction)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteTransaction(crediario, transaction)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
