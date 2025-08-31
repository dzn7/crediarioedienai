'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, RefreshCw, BarChart3, MessageCircle } from 'lucide-react';
import { useCrediarios } from '@/hooks/useCrediarios';
import { CrediarioCard } from './crediario-card';
import { CreateCrediarioModal } from './create-crediario-modal';
import { AddPaymentModal, AddConsumptionModal, AddInterestModal } from './transaction-modals';
import { TransactionsTable } from './transactions-table';
import { CrediarioAnalytics } from '@/components/charts/crediario-analytics';
import { CrediarioAIChat } from '@/components/ai/crediario-ai-chat';
import { Crediario } from '@/types/crediario';
import { formatBR } from '@/lib/utils';
import { toast } from 'sonner';

interface CrediarioDashboardProps {
  userRole: string;
}

export function CrediarioDashboard({ userRole }: CrediarioDashboardProps) {
  const { crediarios, loading, error, refetch } = useCrediarios(userRole);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [balanceFilter, setBalanceFilter] = useState('all');
  const [isMobile, setIsMobile] = useState(false);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [consumptionModalOpen, setConsumptionModalOpen] = useState(false);
  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [transactionsModalOpen, setTransactionsModalOpen] = useState(false);
  const [selectedCrediario, setSelectedCrediario] = useState<Crediario | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const filteredAndSortedCrediarios = crediarios
    .filter(crediario => {
      const matchesSearch = crediario.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBalance = balanceFilter === 'all' || 
        (balanceFilter === 'positive' && crediario.totalBalance > 0) ||
        (balanceFilter === 'zero' && Math.abs(crediario.totalBalance) < 0.01);
      return matchesSearch && matchesBalance;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.customerName.localeCompare(b.customerName);
        case 'balance':
          return b.totalBalance - a.totalBalance;
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const totalBalance = crediarios.reduce((sum, c) => sum + c.totalBalance, 0);
  const activeCount = crediarios.length;
  const debtorsCount = crediarios.filter(c => c.totalBalance > 0).length;

  const handleModalSuccess = () => {
    refetch();
  };

  if (userRole !== 'owner') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Você não tem permissão para gerenciar crediários.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Carregando crediários...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-destructive">{error}</p>
            <Button className="mt-4" onClick={refetch}>
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Aberto</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {formatBR(totalBalance)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crediários Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Pendências</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{debtorsCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="crediarios" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="crediarios">Crediários</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
        </TabsList>
        
        <TabsContent value="crediarios" className="space-y-4">
          {/* Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex flex-col md:flex-row gap-4 flex-1">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Data de Criação</SelectItem>
                      <SelectItem value="name">Nome</SelectItem>
                      <SelectItem value="balance">Saldo</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={balanceFilter} onValueChange={setBalanceFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar saldo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="positive">Com Débito</SelectItem>
                      <SelectItem value="zero">Saldo Zero</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={refetch}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                  <Button onClick={() => setCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Crediário
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Crediarios Grid */}
          <div className={isMobile 
            ? "space-y-2" 
            : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          }>
            {filteredAndSortedCrediarios.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    Nenhum crediário encontrado com os critérios atuais.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredAndSortedCrediarios.map((crediario) => (
                <CrediarioCard
                  key={crediario.id}
                  crediario={crediario}
                  isMobile={isMobile}
                  onAddPayment={(c) => {
                    setSelectedCrediario(c);
                    setPaymentModalOpen(true);
                  }}
                  onAddConsumption={(c) => {
                    setSelectedCrediario(c);
                    setConsumptionModalOpen(true);
                  }}
                  onAddInterest={(c) => {
                    setSelectedCrediario(c);
                    setInterestModalOpen(true);
                  }}
                  onViewTransactions={(c) => {
                    setSelectedCrediario(c);
                    setTransactionsModalOpen(true);
                  }}
                  onEditName={(c) => {
                    toast.info('Funcionalidade de edição será implementada em breve');
                  }}
                  onViewHistory={(c) => {
                    toast.info('Histórico de pedidos será implementado em breve');
                  }}
                  onConclude={(c) => {
                    if (confirm(`Tem certeza que deseja concluir o crediário de ${c.customerName}?`)) {
                      toast.info('Funcionalidade de conclusão será implementada em breve');
                    }
                  }}
                />
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <CrediarioAnalytics crediarios={crediarios} />
        </TabsContent>
      </Tabs>

      {/* AI Chat */}
      <CrediarioAIChat crediarios={crediarios} />

      {/* Modals */}
      <CreateCrediarioModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
      
      <AddPaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={handleModalSuccess}
        crediario={selectedCrediario}
      />
      
      <AddConsumptionModal
        open={consumptionModalOpen}
        onClose={() => setConsumptionModalOpen(false)}
        onSuccess={handleModalSuccess}
        crediario={selectedCrediario}
      />
      
      <AddInterestModal
        open={interestModalOpen}
        onClose={() => setInterestModalOpen(false)}
        onSuccess={handleModalSuccess}
        crediario={selectedCrediario}
      />
      
      <TransactionsTable
        open={transactionsModalOpen}
        onClose={() => setTransactionsModalOpen(false)}
        crediario={selectedCrediario}
        onEditTransaction={(c, t) => {
          toast.info('Edição de transação será implementada em breve');
        }}
        onDeleteTransaction={(c, t) => {
          toast.info('Exclusão de transação será implementada em breve');
        }}
      />
    </div>
  );
}
