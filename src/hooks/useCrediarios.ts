'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Crediario } from '@/types/crediario';

export function useCrediarios(userRole: string | null) {
  const [crediarios, setCrediarios] = useState<Crediario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userRole !== 'owner') {
      setCrediarios([]);
      setLoading(false);
      setError('Você não tem permissão para gerenciar crediários.');
      return;
    }

    setLoading(true);
    setError(null);

    const crediariosQuery = query(
      collection(db, 'crediarios'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe: Unsubscribe = onSnapshot(
      crediariosQuery,
      (snapshot) => {
        const crediariosData: Crediario[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          crediariosData.push({
            id: doc.id,
            customerName: data.customerName || '',
            totalBalance: Number(data.totalBalance) || 0,
            isActive: Boolean(data.isActive),
            createdAt: data.createdAt?.toDate() || new Date(),
            history: data.history || []
          });
        });
        setCrediarios(crediariosData);
        setLoading(false);
      },
      (err) => {
        console.error('Erro no listener de crediários:', err);
        setError('Erro ao carregar crediários: ' + err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userRole]);

  return { crediarios, loading, error, refetch: () => window.location.reload() };
}
