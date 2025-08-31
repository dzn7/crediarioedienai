'use client';

import { useState, useEffect } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { Navbar } from '@/components/layout/navbar';
import { CrediarioDashboard } from '@/components/crediario/crediario-dashboard';
import { PWAManager } from '@/components/pwa/pwa-manager';
import { loadLoginState } from '@/lib/auth';
import { User } from '@/types/crediario';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = loadLoginState();
    setUser(savedUser);
    setLoading(false);
  }, []);

  const handleLogin = (user: User) => {
    setUser(user);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={handleLogout} />
      <CrediarioDashboard userRole={user.role} />
      <PWAManager />
    </div>
  );
}
