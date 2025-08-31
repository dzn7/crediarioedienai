'use client';

import { useState } from 'react';
import { Send, Bot, User, MessageCircle } from 'lucide-react';
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
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 rounded-full h-12 w-12 p-0"
        size="sm"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 left-4 z-50 w-80 h-96 flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bot className="h-4 w-4" />
          IA Crediário
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="h-6 w-6 p-0"
        >
          ×
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-3 space-y-3">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-2 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="flex-shrink-0">
                  {message.sender === 'ai' ? (
                    <Bot className="h-6 w-6 p-1 bg-primary text-primary-foreground rounded-full" />
                  ) : (
                    <User className="h-6 w-6 p-1 bg-secondary text-secondary-foreground rounded-full" />
                  )}
                </div>
                <div
                  className={`px-3 py-2 rounded-lg text-sm ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-2">
              <Bot className="h-6 w-6 p-1 bg-primary text-primary-foreground rounded-full" />
              <div className="bg-muted px-3 py-2 rounded-lg text-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Digite sua pergunta..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={loading || !inputMessage.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
