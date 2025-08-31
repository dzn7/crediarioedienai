'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, Users, DollarSign } from 'lucide-react';
import { Crediario } from '@/types/crediario';
import { formatBR } from '@/lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);

interface CrediarioAnalyticsProps {
  crediarios: Crediario[];
}

export function CrediarioAnalytics({ crediarios }: CrediarioAnalyticsProps) {
  const analytics = useMemo(() => {
    const totalBalance = crediarios.reduce((sum, c) => sum + c.totalBalance, 0);
    const averageBalance = crediarios.length > 0 ? totalBalance / crediarios.length : 0;
    const debtorsCount = crediarios.filter(c => c.totalBalance > 0).length;
    const creditorsCount = crediarios.filter(c => c.totalBalance < 0).length;
    const zeroBalanceCount = crediarios.filter(c => Math.abs(c.totalBalance) < 0.01).length;

    // Monthly data for line chart
    const last6Months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        date: date
      });
    }

    const monthlyBalances = last6Months.map(({ month, date }) => {
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const balanceAtMonth = crediarios.reduce((sum, crediario) => {
        // Calculate balance at end of month based on transactions
        const history = crediario.history || [];
        const relevantTransactions = history.filter(t => new Date(t.date) <= monthEnd);
        const balance = relevantTransactions.reduce((bal, t) => {
          return t.type === 'payment' ? bal - t.amount : bal + t.amount;
        }, 0);
        return sum + balance;
      }, 0);
      return { month, balance: balanceAtMonth };
    });

    // Top debtors
    const topDebtors = crediarios
      .filter(c => c.totalBalance > 0)
      .sort((a, b) => b.totalBalance - a.totalBalance)
      .slice(0, 5);

    return {
      totalBalance,
      averageBalance,
      debtorsCount,
      creditorsCount,
      zeroBalanceCount,
      monthlyBalances,
      topDebtors
    };
  }, [crediarios]);

  const balanceDistributionData = {
    labels: ['Com Débito', 'Saldo Zero', 'Com Crédito'],
    datasets: [{
      data: [analytics.debtorsCount, analytics.zeroBalanceCount, analytics.creditorsCount],
      backgroundColor: ['#ef4444', '#94a3b8', '#22c55e'],
      borderWidth: 0,
    }]
  };

  const monthlyTrendData = {
    labels: analytics.monthlyBalances.map(m => m.month),
    datasets: [{
      label: 'Saldo Total (R$)',
      data: analytics.monthlyBalances.map(m => m.balance),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
    }]
  };

  const topDebtorsData = {
    labels: analytics.topDebtors.map(c => c.customerName.split(' ')[0]),
    datasets: [{
      label: 'Débito (R$)',
      data: analytics.topDebtors.map(c => c.totalBalance),
      backgroundColor: '#ef4444',
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {formatBR(analytics.totalBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Média: R$ {formatBR(analytics.averageBalance)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devedores</CardTitle>
            <TrendingUp className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.debtorsCount}</div>
            <p className="text-xs text-muted-foreground">
              {((analytics.debtorsCount / crediarios.length) * 100).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Zero</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.zeroBalanceCount}</div>
            <p className="text-xs text-muted-foreground">Em dia</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Crédito</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.creditorsCount}</div>
            <p className="text-xs text-muted-foreground">Saldo positivo</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="distribution" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="distribution">Distribuição</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="top-debtors">Maiores Débitos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Saldos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <Doughnut data={balanceDistributionData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução do Saldo Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <Line data={monthlyTrendData} options={{ ...chartOptions, maintainAspectRatio: false }} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="top-debtors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maiores Devedores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <Bar data={topDebtorsData} options={{ ...chartOptions, maintainAspectRatio: false }} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
