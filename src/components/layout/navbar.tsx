'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { User as UserType } from '@/types/crediario';
import { clearLoginState } from '@/lib/auth';

interface NavbarProps {
  user: UserType;
  onLogout: () => void;
}

export function Navbar({ user, onLogout }: NavbarProps) {
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    clearLoginState();
    onLogout();
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Crediário Edienai</h1>
            <Badge variant={user.role === 'owner' ? 'default' : 'secondary'}>
              {user.role === 'owner' ? 'Proprietário' : 'Garçom'}
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{user.displayName}</span>
            </div>
            
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
