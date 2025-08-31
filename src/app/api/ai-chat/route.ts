 import { NextRequest, NextResponse } from 'next/server';
 import { Mistral } from '@mistralai/mistralai';
 import { Crediario } from '@/types/crediario';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://southamerica-east1-edienailanches.cloudfunctions.net';
const mistral = new Mistral({ apiKey: MISTRAL_API_KEY || '' });

// Simple in-memory cache (per server instance)
type CacheEntry = { data: unknown; ts: number };
const CACHE_TTL_MS = 60_000; // 60s
const aiCache = new Map<string, CacheEntry>();

async function fetchWithAuth(url: string, options: RequestInit = {}, role: string, pin: string) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'X-User-Role': role,
    'X-User-Pin': pin,
  };

  return fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });
}

interface AIAction {
  action: string;
  parameters: Record<string, unknown>;
  reasoning: string;
}

 export async function POST(request: NextRequest) {
  try {
    const headersRole = request.headers.get('x-user-role') || request.headers.get('X-User-Role') || '';
    const headersPin = request.headers.get('x-user-pin') || request.headers.get('X-User-Pin') || '';

    const body = await request.json();
    const message = body?.message;
    const crediarios = body?.crediarios;
    const userRole = headersRole || body?.userRole || '';
    const userPin = headersPin || body?.userPin || '';

    if (!MISTRAL_API_KEY) {
      return NextResponse.json({ error: 'MISTRAL_API_KEY ausente no ambiente' }, { status: 500 });
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Mensagem inválida' }, { status: 400 });
    }

    // Enforce auth presence for this API route
    if (!userRole || !userPin) {
      return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 });
    }

    // Normalize and reduce input to save tokens
    const normalized: Crediario[] = Array.isArray(crediarios) ? crediarios.map((c: Crediario) => ({
      id: c.id,
      customerName: c.customerName,
      totalBalance: Number(c.totalBalance) || 0,
      isActive: Boolean(c.isActive),
      createdAt: c.createdAt,
      history: (c.history || []).slice(0, 3) // limit history context per client
    })) : [];

    // Build snapshot key for caching (only ids + balances)
    const snapshotKey = normalized
      .map(c => `${c.id}:${Number(c.totalBalance).toFixed(2)}`)
      .sort()
      .join('|');
    const cacheKey = `${userRole || 'unknown'}::${message}::${snapshotKey}`;
    const now = Date.now();
    const cached = aiCache.get(cacheKey);
    if (cached && (now - cached.ts) < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }

    // Build intelligent context about the crediário system
    const totalBalance = normalized.reduce((sum: number, c: Crediario) => sum + (Number(c.totalBalance) || 0), 0);
    const debtorsCount = normalized.filter((c: Crediario) => Number(c.totalBalance) > 0).length;
    const averageBalance = normalized.length > 0 ? totalBalance / normalized.length : 0;
    const topDebtors = normalized
      .filter((c: Crediario) => (Number(c.totalBalance) || 0) > 0)
      .sort((a: Crediario, b: Crediario) => (Number(b.totalBalance) || 0) - (Number(a.totalBalance) || 0))
      .slice(0, 5);

    const today = new Date().toLocaleDateString('pt-BR');

    const systemContext = `
VOCÊ É UMA IA ESPECIALISTA EM GESTÃO DE CREDIÁRIOS DO RESTAURANTE EDIENAI LANCHES

CONTEXTO DO SISTEMA - ${today}:
- Total de crediários ativos: ${normalized.length}
- Saldo total em aberto: R$ ${totalBalance.toFixed(2).replace('.', ',')}
- Clientes com débito: ${debtorsCount}
- Saldo médio por cliente: R$ ${averageBalance.toFixed(2).replace('.', ',')}
- Usuário logado: ${userRole === 'owner' ? 'Proprietário (acesso total)' : 'Garçom (acesso limitado)'}

PRINCIPAIS DEVEDORES:
${topDebtors.map((c: Crediario) => `- ${c.customerName}: R$ ${(Number(c.totalBalance)||0).toFixed(2).replace('.', ',')} (${c.history?.length || 0} transações)`).join('\n')}

TODOS OS CLIENTES:
${normalized.slice(0, 50).map((c: Crediario) => {
  const bal = Number(c.totalBalance) || 0;
  const status = bal > 0 ? 'DEVENDO' : bal < 0 ? 'CRÉDITO' : 'EM DIA';
  return `- ${c.customerName}: R$ ${bal.toFixed(2).replace('.', ',')} [${status}] (ID: ${c.id})`;
}).join('\n')}
${normalized.length > 50 ? `... e mais ${normalized.length - 50} clientes` : ''}

VOCÊ PODE EXECUTAR AÇÕES AUTOMATICAMENTE SE O USUÁRIO SOLICITAR:

APIS DISPONÍVEIS PARA EXECUÇÃO AUTOMÁTICA:
1. createCrediario - Criar novo crediário
   Parâmetros: customerName, initialValue?, initialItems?
   
2. addTransaction - Adicionar transação (payment, consumption, interest)
   Parâmetros: crediarioId, type, amount, description, itemsConsumed?
   
3. updateCrediarioName - Atualizar nome do cliente
   Parâmetros: crediarioId, newCustomerName
   
4. concludeCrediario - Concluir/arquivar crediário
   Parâmetros: crediarioId
   
5. getMenuProducts - Buscar produtos do cardápio
   
6. getPedidos - Buscar histórico de pedidos

ANÁLISES INTELIGENTES QUE VOCÊ DEVE FORNECER:
- Identificar clientes com comportamento de risco
- Sugerir estratégias de cobrança
- Analisar padrões de consumo
- Detectar oportunidades de negócio
- Monitorar saúde financeira do crediário
- Propor ações corretivas

INSTRUÇÕES ESPECIAIS:
- Se o usuário solicitar uma ação específica (criar, adicionar, etc.), execute automaticamente
- Seja proativo em sugerir melhorias
- Analise tendências e padrões nos dados
- Forneça insights valiosos para o negócio
- Use dados reais para embasar suas análises

RESPONDA EM PORTUGUÊS BRASILEIRO COM INTELIGÊNCIA E PROATIVIDADE.
`;

    const prompt = `${systemContext}

MENSAGEM DO USUÁRIO: "${message}"

INSTRUÇÕES:
1. Analise a mensagem considerando todo o contexto do sistema
2. Se o usuário pedir para executar uma ação, identifique qual API usar e responda indicando que você pode executar
3. Forneça análises profundas e insights inteligentes
4. Seja proativo em identificar problemas e oportunidades
5. Use os dados reais para embasar suas análises

Responda de forma inteligente e completa:`;

    // Faster model and tuned parameters for speed + quality
    const response = await mistral.chat.complete({
      model: 'mistral-small-latest',
      messages: [
        {
          role: 'system',
          content: 'Você é uma IA especialista em gestão de crediários. Você tem acesso às APIs do sistema e pode executar ações automaticamente. Seja assertivo, analítico e prático.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      maxTokens: 800,
    });

    const aiResponse = response.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua solicitação.';

    // Parse if AI wants to execute an action
    const executedActions: AIAction[] = [];
    await detectAndExecuteActions(message, normalized, userRole, userPin, executedActions);

    const responseData = {
      response: aiResponse,
      executedActions,
      canExecuteActions: userRole === 'owner',
      analytics: {
        totalBalance,
        debtorsCount,
        averageBalance,
        topDebtors: topDebtors.slice(0, 3),
        suggestions: generateIntelligentSuggestions(normalized)
      }
    };

    aiCache.set(cacheKey, { data: responseData, ts: now });
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Erro na API do chat IA:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
}

// Helper function to detect and execute actions
async function detectAndExecuteActions(
  message: string, 
  crediarios: Crediario[], 
  userRole: string, 
  userPin: string, 
  executedActions: AIAction[]
) {
  if (userRole !== 'owner') return false;

  const lowerMessage = message.toLowerCase();

  // Detect create crediário request
  if ((lowerMessage.includes('criar') || lowerMessage.includes('adicionar')) && 
      (lowerMessage.includes('crediário') || lowerMessage.includes('cliente'))) {
    
    const nameMatch = message.match(/(?:para|cliente|criar)\s+([A-Za-zÀ-ÿ\s]+?)(?:\s+com|\s+de|R\$|\s*$)/i);
    const valueMatch = message.match(/R?\$?\s*(\d+(?:[.,]\d{2})?)/i);
    
    if (nameMatch) {
      const customerName = nameMatch[1].trim();
      const initialValue = valueMatch ? parseFloat(valueMatch[1].replace(',', '.')) : 0;
      
      try {
        const response = await fetchWithAuth(`${BACKEND_URL}/createCrediario`, {
          method: 'POST',
          body: JSON.stringify({
            customerName,
            initialValue,
            initialItemsConsumed: ''
          })
        }, userRole, userPin);
        
        if (response.ok) {
          executedActions.push({
            action: 'createCrediario',
            parameters: { customerName, initialValue },
            reasoning: `Crediário criado automaticamente para ${customerName}`
          });
        }
      } catch (error) {
        console.error('Erro ao criar crediário:', error);
      }
    }
  }

  // Detect payment addition
  if ((lowerMessage.includes('adicionar') || lowerMessage.includes('registrar')) && 
      lowerMessage.includes('pagamento')) {
    
    const nameMatch = message.match(/(?:para|de|cliente)\s+([A-Za-zÀ-ÿ\s]+?)(?:\s+de|R\$|\s*$)/i);
    const valueMatch = message.match(/R?\$?\s*(\d+(?:[.,]\d{2})?)/i);
    
    if (nameMatch && valueMatch) {
      const customerName = nameMatch[1].trim();
      const amount = parseFloat(valueMatch[1].replace(',', '.'));
      const customer = crediarios.find(c => 
        c.customerName.toLowerCase().includes(customerName.toLowerCase())
      );
      
      if (customer) {
        try {
          const response = await fetchWithAuth(`${BACKEND_URL}/addCrediarioTransaction`, {
            method: 'POST',
            body: JSON.stringify({
              crediarioId: customer.id,
              type: 'payment',
              amount,
              description: 'Pagamento registrado via IA',
              itemsConsumed: ''
            })
          }, userRole, userPin);
          
          if (response.ok) {
            executedActions.push({
              action: 'addPayment',
              parameters: { crediarioId: customer.id, amount },
              reasoning: `Pagamento de R$ ${amount.toFixed(2).replace('.', ',')} registrado para ${customer.customerName}`
            });
          }
        } catch (error) {
          console.error('Erro ao adicionar pagamento:', error);
        }
      }
    }
  }

  return executedActions.length > 0;
}

// Generate intelligent suggestions
function generateIntelligentSuggestions(crediarios: Crediario[]): string[] {
  const suggestions: string[] = [];
  
  const highDebtors = crediarios.filter(c => (Number(c.totalBalance) || 0) > 100);
  const veryHighDebtors = crediarios.filter(c => (Number(c.totalBalance) || 0) > 200);
  const creditClients = crediarios.filter(c => (Number(c.totalBalance) || 0) < -10);
  const inactiveClients = crediarios.filter(c => {
    if (!c.history || c.history.length === 0) return true;
    const lastTransaction = c.history[0];
    const daysSince = (Date.now() - new Date(lastTransaction.date).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > 30 && (Number(c.totalBalance) || 0) > 0;
  });

  if (veryHighDebtors.length > 0) {
    suggestions.push(`🚨 ATENÇÃO: ${veryHighDebtors.length} clientes com débito muito alto (>R$ 200). Ação urgente necessária!`);
  }

  if (highDebtors.length > 0) {
    suggestions.push(`⚠️ ${highDebtors.length} clientes com débito elevado (>R$ 100). Considere parcelamento ou desconto para quitação.`);
  }

  if (creditClients.length > 0) {
    suggestions.push(`💰 ${creditClients.length} clientes com crédito em conta. Incentive o consumo desses créditos.`);
  }

  if (inactiveClients.length > 0) {
    suggestions.push(`📅 ${inactiveClients.length} clientes inativos há mais de 30 dias. Considere contato para reativação.`);
  }

  const totalBalance = crediarios.reduce((sum, c) => sum + (Number(c.totalBalance) || 0), 0);
  if (totalBalance > 1000) {
    suggestions.push('💡 Saldo total alto. Considere campanhas de incentivo ao pagamento ou parcelamento.');
  }

  return suggestions;
}
