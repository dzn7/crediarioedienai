'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Calendar, List, DollarSign } from 'lucide-react';
import { Crediario } from '@/types/crediario';
import { formatBR } from '@/lib/utils';

interface CrediarioCardProps {
  crediario: Crediario;
  onAddPayment: (crediario: Crediario) => void;
  onAddConsumption: (crediario: Crediario) => void;
  onAddInterest: (crediario: Crediario) => void;
  onViewTransactions: (crediario: Crediario) => void;
  onEditName: (crediario: Crediario) => void;
  onViewHistory: (crediario: Crediario) => void;
  onConclude: (crediario: Crediario) => void;
  isMobile?: boolean;
}

export function CrediarioCard({ 
  crediario, 
  onAddPayment,
  onAddConsumption,
  onAddInterest,
  onViewTransactions,
  onEditName,
  onViewHistory,
  onConclude,
  isMobile = false
}: CrediarioCardProps) {
  const transactionCount = crediario.history?.length || 0;
  const lastTransaction = crediario.history?.[0];
  const lastTransactionDate = lastTransaction?.date 
    ? new Date(lastTransaction.date).toLocaleDateString('pt-BR')
    : 'Nunca';

  if (isMobile) {
    return (
      <Button
        variant="outline"
        className="w-full justify-between p-4 h-auto"
        onClick={() => onViewTransactions(crediario)}
      >
        <div className="text-left">
          <div className="font-semibold text-lg">{crediario.customerName}</div>
          <div className="text-sm text-muted-foreground">{transactionCount} transações</div>
        </div>
        <Badge variant={crediario.totalBalance > 0 ? 'destructive' : 'default'} className="text-lg">
          R$ {formatBR(crediario.totalBalance)}
        </Badge>
      </Button>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onViewTransactions(crediario)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <h3 className="font-semibold text-lg">{crediario.customerName}</h3>
          <Badge variant={crediario.totalBalance > 0 ? 'destructive' : 'default'}>
            R$ {formatBR(crediario.totalBalance)}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddPayment(crediario); }}>
              <DollarSign className="h-4 w-4 mr-2" />
              Registrar Pagamento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddConsumption(crediario); }}>
              <List className="h-4 w-4 mr-2" />
              Adicionar Consumo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddInterest(crediario); }}>
              Adicionar Juros
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewHistory(crediario); }}>
              Histórico de Pedidos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditName(crediario); }}>
              Editar Nome
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onConclude(crediario); }}
              className="text-destructive"
            >
              Concluir Crediário
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <List className="h-4 w-4" />
            <span>{transactionCount} transações</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{lastTransactionDate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
