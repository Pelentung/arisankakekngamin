
'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import type { Group } from '@/app/data';
import { subscribeToData } from '@/app/data';
import { LotteryCard } from '@/components/undian/lottery-card';
import { useFirestore } from '@/firebase';

export default function UndianPage() {
  const db = useFirestore();
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    if (!db) return;
    const unsubscribe = subscribeToData(db, 'groups', (data) => {
        setGroups(data as Group[]);
    });
    return () => unsubscribe();
  }, [db]);
    
  const groupMain = groups.find(g => g.name === 'Arisan Utama');
  const group10k = groups.find(g => g.name === 'Arisan Uang Kaget Rp. 10.000');
  const group20k = groups.find(g => g.name === 'Arisan Uang Kaget Rp. 20.000');
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Yang Sudah Narik" />
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <h1 className="font-headline text-2xl font-bold tracking-tight text-foreground/90 sm:text-3xl">
            Daftar Anggota Yang Sudah Narik
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {groupMain && (
            <LotteryCard 
              group={groupMain}
              title="Grup Arisan Utama"
              description="Daftar anggota yang sudah menarik dari grup utama."
            />
          )}
          {group20k && (
            <LotteryCard 
              group={group20k}
              title="Arisan Uang Kaget Rp. 20.000"
              description="Daftar anggota yang sudah menarik dari grup Uang Kaget Rp. 20.000."
            />
          )}
          {group10k && (
            <LotteryCard 
              group={group10k}
              title="Arisan Uang Kaget Rp. 10.000"
              description="Daftar anggota yang sudah menarik dari grup Uang Kaget Rp. 10.000."
            />
          )}
        </div>
      </main>
    </div>
  );
}
