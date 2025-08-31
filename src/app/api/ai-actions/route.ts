import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://southamerica-east1-edienailanches.cloudfunctions.net';

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

export async function POST(request: NextRequest) {
  try {
    const { action, parameters, userRole, userPin } = await request.json();

    if (!userRole || !userPin) {
      return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 });
    }

    if (userRole !== 'owner') {
      return NextResponse.json({ error: 'Apenas o proprietário pode executar ações via IA' }, { status: 403 });
    }

    let result;

    switch (action) {
      case 'createCrediario':
        const createResponse = await fetchWithAuth(`${BACKEND_URL}/createCrediario`, {
          method: 'POST',
          body: JSON.stringify({
            customerName: parameters.customerName,
            initialValue: parameters.initialValue || 0,
            initialItemsConsumed: parameters.initialItems || ''
          })
        }, userRole, userPin);
        
        if (!createResponse.ok) {
          throw new Error('Falha ao criar crediário');
        }
        result = await createResponse.json();
        break;

      case 'addTransaction':
        const transactionResponse = await fetchWithAuth(`${BACKEND_URL}/addCrediarioTransaction`, {
          method: 'POST',
          body: JSON.stringify({
            crediarioId: parameters.crediarioId,
            type: parameters.type,
            amount: parameters.amount,
            description: parameters.description,
            itemsConsumed: parameters.itemsConsumed || ''
          })
        }, userRole, userPin);
        
        if (!transactionResponse.ok) {
          throw new Error('Falha ao adicionar transação');
        }
        result = await transactionResponse.json();
        break;

      case 'updateCrediarioName':
        const updateResponse = await fetchWithAuth(`${BACKEND_URL}/updateCrediarioName`, {
          method: 'POST',
          body: JSON.stringify({
            crediarioId: parameters.crediarioId,
            newCustomerName: parameters.newCustomerName
          })
        }, userRole, userPin);
        
        if (!updateResponse.ok) {
          throw new Error('Falha ao atualizar nome');
        }
        result = await updateResponse.json();
        break;

      case 'concludeCrediario':
        const concludeResponse = await fetchWithAuth(`${BACKEND_URL}/concludeCrediario`, {
          method: 'PUT',
          body: JSON.stringify({
            crediarioId: parameters.crediarioId
          })
        }, userRole, userPin);
        
        if (!concludeResponse.ok) {
          throw new Error('Falha ao concluir crediário');
        }
        result = await concludeResponse.json();
        break;

      case 'getMenuProducts':
        const menuResponse = await fetchWithAuth(`${BACKEND_URL}/getMenuCache`, {
          method: 'GET'
        }, userRole, userPin);
        
        if (!menuResponse.ok) {
          throw new Error('Falha ao buscar cardápio');
        }
        result = await menuResponse.json();
        break;

      case 'getPedidos':
        const pedidosResponse = await fetchWithAuth(`${BACKEND_URL}/getPedidos`, {
          method: 'GET'
        }, userRole, userPin);
        
        if (!pedidosResponse.ok) {
          throw new Error('Falha ao buscar pedidos');
        }
        result = await pedidosResponse.json();
        break;

      default:
        return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      result,
      message: `Ação ${action} executada com sucesso`
    });

  } catch (error) {
    console.error('Erro na API de ações da IA:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
}
