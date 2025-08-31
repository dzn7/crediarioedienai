import { Mistral } from '@mistralai/mistralai';
import { Crediario } from '@/types/crediario';
import * as api from './api';
import { formatBR } from './utils';

const MISTRAL_API_KEY = 'YkTCIOXtxMv8k6nz6oTbtwB4kU6CSJtH';
const mistral = new Mistral({ apiKey: MISTRAL_API_KEY });

type AIParameters = {
  crediarioId?: string;
  amount?: number;
  description?: string;
  customerName?: string;
  initialValue?: number;
};

interface AIAction {
  type: 'api_call' | 'analysis' | 'suggestion';
  action: string;
  parameters?: AIParameters;
  result?: string;
}

export class CrediarioAI {
  private crediarios: Crediario[] = [];
  private context: string = '';

  constructor(crediarios: Crediario[]) {
    this.crediarios = crediarios;
    this.buildContext();
  }

  private buildContext() {
    const totalBalance = this.crediarios.reduce((sum, c) => sum + c.totalBalance, 0);
    const debtorsCount = this.crediarios.filter(c => c.totalBalance > 0).length;
    const averageBalance = this.crediarios.length > 0 ? totalBalance / this.crediarios.length : 0;

    this.context = `
SISTEMA DE CREDIÁRIO EDIENAI LANCHES

DADOS ATUAIS:
- Total de crediários ativos: ${this.crediarios.length}
- Saldo total em aberto: R$ ${formatBR(totalBalance)}
- Clientes com débito: ${debtorsCount}
- Saldo médio por cliente: R$ ${formatBR(averageBalance)}

CLIENTES CADASTRADOS:
${this.crediarios.map(c => `- ${c.customerName}: R$ ${formatBR(c.totalBalance)} (${c.history?.length || 0} transações)`).join('\n')}

APIS DISPONÍVEIS:
- createCrediario(customerName, initialValue?, initialItems?) - Criar novo crediário
- addCrediarioTransaction(id, type, amount, description, items?) - Adicionar transação
- updateCrediarioName(id, newName) - Atualizar nome do cliente
- editCrediarioTransaction(id, transactionId, type, amount, description, items?) - Editar transação
- deleteCrediarioTransaction(id, transactionId) - Excluir transação
- concludeCrediario(id) - Concluir/arquivar crediário
- getMenuProducts() - Buscar produtos do cardápio
- getPedidos() - Buscar histórico de pedidos

TIPOS DE TRANSAÇÃO:
- payment: Pagamento (diminui saldo)
- consumption: Consumo (aumenta saldo)
- interest: Juros (aumenta saldo)

VOCÊ É UMA IA ESPECIALISTA EM GESTÃO DE CREDIÁRIOS. Pode analisar dados, fazer sugestões, executar ações através das APIs disponíveis e fornecer insights inteligentes sobre o negócio.
`;
  }

  async processMessage(userMessage: string): Promise<{ response: string; actions: AIAction[] }> {
    const actions: AIAction[] = [];

    try {
      const prompt = `${this.context}

MENSAGEM DO USUÁRIO: ${userMessage}

INSTRUÇÕES:
1. Analise a mensagem do usuário no contexto do sistema de crediário
2. Se o usuário pedir para executar uma ação (criar, adicionar, editar, etc.), identifique exatamente qual API chamar
3. Forneça análises inteligentes e sugestões práticas
4. Seja proativo em sugerir ações baseadas nos dados
5. Responda sempre em português brasileiro
6. Se precisar executar uma API, especifique claramente qual função e parâmetros usar

EXEMPLOS DE AÇÕES:
- "Criar crediário para João com R$ 50": createCrediario("João", 50)
- "Adicionar pagamento de R$ 30 para Maria": addCrediarioTransaction(id_maria, "payment", 30, "Pagamento")
- "Mostrar clientes com mais débito": análise dos dados atuais

Responda de forma inteligente e útil:`;

      const response = await mistral.chat.complete({
        model: 'mistral-large-latest',
        messages: [
          {
            role: 'system',
            content: 'Você é uma IA especialista em gestão de crediários para o restaurante Edienai Lanches. Você tem acesso total às APIs do sistema e pode executar ações automaticamente. Seja proativo, inteligente e útil.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        maxTokens: 1000
      });

      const content = response.choices?.[0]?.message?.content;
      const aiResponse: string = typeof content === 'string'
        ? content
        : 'Desculpe, não consegui processar sua solicitação.';

      // Parse potential API calls from response
      await this.parseAndExecuteActions(aiResponse, userMessage, actions);

      return {
        response: aiResponse,
        actions
      };

    } catch (error) {
      console.error('Erro na IA Mistral:', error);
      return {
        response: 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente.',
        actions: []
      };
    }
  }

  private async parseAndExecuteActions(aiResponse: string, userMessage: string, actions: AIAction[]): Promise<void> {
    const lowerMessage = userMessage.toLowerCase();

    // Detectar se o usuário quer criar um crediário
    if (lowerMessage.includes('criar') && (lowerMessage.includes('crediário') || lowerMessage.includes('cliente'))) {
      const nameMatch = userMessage.match(/(?:para|cliente)\s+([A-Za-zÀ-ÿ\s]+?)(?:\s+com|\s+de|\s*$)/i);
      const valueMatch = userMessage.match(/r?\$?\s*(\d+(?:[.,]\d{2})?)/i);

      if (nameMatch) {
        const customerName = nameMatch[1].trim();
        const initialValue = valueMatch ? parseFloat(valueMatch[1].replace(',', '.')) : 0;

        actions.push({
          type: 'api_call',
          action: 'createCrediario',
          parameters: { customerName, initialValue }
        });
      }
    }

    // Detectar pagamentos
    if (lowerMessage.includes('pagamento') && lowerMessage.includes('adicionar')) {
      const nameMatch = userMessage.match(/(?:para|de)\s+([A-Za-zÀ-ÿ\s]+?)(?:\s+de|\s+com|\s*$)/i);
      const valueMatch = userMessage.match(/r?\$?\s*(\d+(?:[.,]\d{2})?)/i);

      if (nameMatch && valueMatch) {
        const customerName = nameMatch[1].trim();
        const amount = parseFloat(valueMatch[1].replace(',', '.'));
        const customer = this.crediarios.find(c =>
          c.customerName.toLowerCase().includes(customerName.toLowerCase())
        );

        if (customer) {
          actions.push({
            type: 'api_call',
            action: 'addPayment',
            parameters: { crediarioId: customer.id, amount, description: 'Pagamento via IA' }
          });
        }
      }
    }

    // Detectar consumos
    if (lowerMessage.includes('consumo') && lowerMessage.includes('adicionar')) {
      const nameMatch = userMessage.match(/(?:para|de)\s+([A-Za-zÀ-ÿ\s]+?)(?:\s+de|\s+com|\s*$)/i);
      const valueMatch = userMessage.match(/r?\$?\s*(\d+(?:[.,]\d{2})?)/i);

      if (nameMatch && valueMatch) {
        const customerName = nameMatch[1].trim();
        const amount = parseFloat(valueMatch[1].replace(',', '.'));
        const customer = this.crediarios.find(c =>
          c.customerName.toLowerCase().includes(customerName.toLowerCase())
        );

        if (customer) {
          actions.push({
            type: 'api_call',
            action: 'addConsumption',
            parameters: { crediarioId: customer.id, amount, description: 'Consumo via IA' }
          });
        }
      }
    }
  }

  async executeActions(actions: AIAction[]): Promise<AIAction[]> {
    const executedActions: AIAction[] = [];

    for (const action of actions) {
      try {
        switch (action.action) {
          case 'createCrediario': {
            const params = (action.parameters || {}) as AIParameters;
            const newCrediario = await api.createCrediario(
              params.customerName!,
              params.initialValue
            );
            executedActions.push({
              ...action,
              result: `Crediário criado com sucesso para ${newCrediario.customerName}`
            });
            break;
          }

          case 'addPayment': {
            const params = (action.parameters || {}) as AIParameters;
            await api.addCrediarioTransaction(
              params.crediarioId!,
              'payment',
              params.amount!,
              params.description || 'Pagamento via IA'
            );
            executedActions.push({
              ...action,
              result: `Pagamento de R$ ${formatBR(params.amount ?? 0)} registrado`
            });
            break;
          }

          case 'addConsumption': {
            const params = (action.parameters || {}) as AIParameters;
            await api.addCrediarioTransaction(
              params.crediarioId!,
              'consumption',
              params.amount!,
              params.description || 'Consumo via IA'
            );
            executedActions.push({
              ...action,
              result: `Consumo de R$ ${formatBR(params.amount ?? 0)} adicionado`
            });
            break;
          }

          default:
            break;
        }
      } catch (error) {
        executedActions.push({
          ...action,
          result: `Erro ao executar ${action.action}: ${error}`
        });
      }
    }

    return executedActions;
  }

  getAnalytics() {
    const totalBalance = this.crediarios.reduce((sum, c) => sum + c.totalBalance, 0);
    const debtorsCount = this.crediarios.filter(c => c.totalBalance > 0).length;
    const topDebtor = this.crediarios
      .filter(c => c.totalBalance > 0)
      .sort((a, b) => b.totalBalance - a.totalBalance)[0];
    
    return {
      totalBalance,
      debtorsCount,
      activeCount: this.crediarios.length,
      averageBalance: this.crediarios.length > 0 ? totalBalance / this.crediarios.length : 0,
      topDebtor: topDebtor ? { name: topDebtor.customerName, balance: topDebtor.totalBalance } : null,
      suggestions: this.generateSuggestions()
    };
  }

  private generateSuggestions(): string[] {
    const suggestions: string[] = [];
    const highDebtors = this.crediarios.filter(c => c.totalBalance > 100);
    const oldDebtors = this.crediarios.filter(c => {
      const lastTransaction = c.history?.[0];
      if (!lastTransaction) return false;
      const daysSinceLastTransaction = (Date.now() - new Date(lastTransaction.date).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceLastTransaction > 30 && c.totalBalance > 0;
    });

    if (highDebtors.length > 0) {
      suggestions.push(`${highDebtors.length} clientes com débito alto (>R$ 100). Considere parcelamento.`);
    }

    if (oldDebtors.length > 0) {
      suggestions.push(`${oldDebtors.length} clientes sem movimentação há mais de 30 dias. Revisar status.`);
    }

    if (this.crediarios.filter(c => c.totalBalance < 0).length > 0) {
      suggestions.push('Alguns clientes têm crédito em conta. Considere usar em futuras compras.');
    }

    return suggestions;
  }
}
