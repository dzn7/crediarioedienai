'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { authenticateUser, saveLoginState } from '@/lib/auth';
import { User } from '@/types/crediario';

interface LoginFormProps {
  onLogin: (user: User) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pin.trim()) {
      toast.error('Por favor, digite seu PIN');
      return;
    }

    setLoading(true);
    
    try {
      const user = authenticateUser(pin);
      if (user) {
        saveLoginState(user);
        onLogin(user);
        toast.success(`Bem-vindo, ${user.displayName}!`);
      } else {
        toast.error('PIN inválido. Tente novamente.');
      }
    } catch (error) {
      toast.error('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Crediário Edienai</CardTitle>
          <CardDescription>Digite seu PIN para acessar o sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">PIN de Acesso</Label>
              <Input
                id="pin"
                type="password"
                placeholder="Digite seu PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="text-center text-lg"
                maxLength={4}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
