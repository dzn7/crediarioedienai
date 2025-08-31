'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function PWAManager() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', {
        updateViaCache: 'none'
      })
      .then((registration) => {
        console.log('SW registered:', registration);
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
                setShowUpdatePrompt(true);
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('SW registration failed:', error);
      });

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
          setUpdateAvailable(true);
          setShowUpdatePrompt(true);
        }
      });
    }
  }, []);

  const applyUpdate = async () => {
    try {
      // Clear all caches
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      
      // Unregister current service worker
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      
      // Force reload
      window.location.reload();
    } catch (error) {
      console.error('Error applying update:', error);
      toast.error('Erro ao atualizar. Tente novamente.');
    }
  };

  const dismissUpdate = () => {
    setShowUpdatePrompt(false);
    setUpdateAvailable(false);
  };

  if (!showUpdatePrompt) return null;

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 border-2 border-primary">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-sm">Atualização Disponível</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Uma nova versão do app está disponível. Atualize para obter as últimas melhorias.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={dismissUpdate}
            className="p-1 h-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={applyUpdate} className="flex-1">
            <RefreshCw className="h-3 w-3 mr-1" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={dismissUpdate}>
            Depois
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
