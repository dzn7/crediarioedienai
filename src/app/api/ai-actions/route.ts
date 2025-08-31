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
    const headersRole = request.headers.get('x-user-role') || request.headers.get('X-User-Role') || '';
    const headersPin = request.headers.get('x-user-pin') || request.headers.get('X-User-Pin') || '';

    const body = await request.json();
    const action = body?.action;
    const parameters = body?.parameters || {};
    const userRole = headersRole || body?.userRole || '';
    const userPin = headersPin || body?.userPin || '';

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
          let errMsg = 'Falha ao criar crediário';
          try { const e = await createResponse.json(); if (e?.error || e?.message) errMsg = e.error || e.message; } catch {}
          return NextResponse.json({ error: errMsg }, { status: createResponse.status });
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
          let errMsg = 'Falha ao adicionar transação';
          try { const e = await transactionResponse.json(); if (e?.error || e?.message) errMsg = e.error || e.message; } catch {}
          return NextResponse.json({ error: errMsg }, { status: transactionResponse.status });
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
          let errMsg = 'Falha ao atualizar nome';
          try { const e = await updateResponse.json(); if (e?.error || e?.message) errMsg = e.error || e.message; } catch {}
          return NextResponse.json({ error: errMsg }, { status: updateResponse.status });
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
          let errMsg = 'Falha ao concluir crediário';
          try { const e = await concludeResponse.json(); if (e?.error || e?.message) errMsg = e.error || e.message; } catch {}
          return NextResponse.json({ error: errMsg }, { status: concludeResponse.status });
        }
        result = await concludeResponse.json();
        break;

      case 'getMenuProducts':
        const menuResponse = await fetchWithAuth(`${BACKEND_URL}/getMenuCache`, {
          method: 'GET'
        }, userRole, userPin);
        
        if (!menuResponse.ok) {
          let errMsg = 'Falha ao buscar cardápio';
          try { const e = await menuResponse.json(); if (e?.error || e?.message) errMsg = e.error || e.message; } catch {}
          return NextResponse.json({ error: errMsg }, { status: menuResponse.status });
        }
        result = await menuResponse.json();
        break;

      case 'getPedidos':
        const pedidosResponse = await fetchWithAuth(`${BACKEND_URL}/getPedidos`, {
          method: 'GET'
        }, userRole, userPin);
        
        if (!pedidosResponse.ok) {
          let errMsg = 'Falha ao buscar pedidos';
          try { const e = await pedidosResponse.json(); if (e?.error || e?.message) errMsg = e.error || e.message; } catch {}
          return NextResponse.json({ error: errMsg }, { status: pedidosResponse.status });
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
