'use client';

import { useState } from 'react';
import { Send, Bot, User, MessageCircle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crediario } from '@/types/crediario';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface CrediarioAIChatProps {
  crediarios: Crediario[];
}

type ExecutedAction = {
  action: string;
  parameters: Record<string, unknown>;
  reasoning: string;
};

export function CrediarioAIChat({ crediarios }: CrediarioAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Olá! Sou sua assistente IA especializada em gestão de crediários. Posso ajudar você a analisar dados, sugerir ações e responder perguntas sobre seus clientes. Como posso ajudar hoje?',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const sendToMistralAI = async (userMessage: string): Promise<string> => {
    try {
      const userRole = localStorage.getItem('loggedInUserRole') || 'waiter';
      const userPin = localStorage.getItem('loggedInUserPin') || '';
      
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          crediarios,
          userRole,
          userPin
        }),
      });

      if (!response.ok) {
        throw new Error('Falha na comunicação com a IA');
      }

      const data = await response.json();
      
      // Show any executed actions to the user
      if (data.executedActions && data.executedActions.length > 0) {
        (data.executedActions as ExecutedAction[]).forEach((action) => {
          if (action?.reasoning) {
            toast.success(`✅ ${action.reasoning}`);
          }
        });
      }
      
      return data.response || 'Desculpe, não consegui processar sua solicitação.';
    } catch (error) {
      console.error('Erro ao comunicar com MistralAI:', error);
      return 'Desculpe, ocorreu um erro ao processar sua solicitação. Verifique sua conexão e tente novamente.';
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    // Get AI response
    try {
      const aiResponseContent = await sendToMistralAI(inputMessage);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponseContent,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch {
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full w-16 h-16 shadow-2xl hover:shadow-3xl transition-all hover:scale-110 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          <MessageCircle className="h-7 w-7" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-24 right-6 w-[450px] h-[600px] shadow-2xl flex flex-col border-2 border-blue-200 bg-white/95 backdrop-blur-sm">
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bot className="h-6 w-6" />
            <div>
              <span className="text-lg font-bold">Assistente IA</span>
              <p className="text-xs opacity-90">Gestão inteligente de crediários</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="hover:bg-white/20 text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-3 space-y-3">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto pr-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Bot className="h-16 w-16 mx-auto mb-6 opacity-50" />
              <p className="text-base font-semibold mb-4">Olá! Sou seu assistente inteligente</p>
              <div className="mt-6 space-y-3 text-left bg-blue-50 rounded-lg p-4 mx-4">
                <p className="text-sm font-semibold text-blue-900">📝 Posso ajudar com:</p>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-600">•</span>
                    <p className="text-sm text-gray-700">"Quem está devendo?"</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-600">•</span>
                    <p className="text-sm text-gray-700">"Criar crediário para [nome]"</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-600">•</span>
                    <p className="text-sm text-gray-700">"Adicionar pagamento de R$ X para [nome]"</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-600">•</span>
                    <p className="text-sm text-gray-700">"Análise de inadimplência"</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-600">•</span>
                    <p className="text-sm text-gray-700">"Sugestões de cobrança"</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-4 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}
                >
                  <div
                    className={`inline-block p-4 rounded-2xl max-w-[85%] shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 px-2">
                    {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
          
          {loading && (
            <div className="text-left mb-4">
              <div className="inline-block p-4 rounded-2xl bg-gray-100 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600">Processando...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="relative flex gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            className="pr-12 py-6 text-base"
          />
          <Button
            onClick={handleSendMessage}
            size="sm"
            disabled={loading || !inputMessage.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
