
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Member, Group } from '@/app/data';
import { subscribeToData } from '@/app/data';
import { useFirestore } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MapPin, Trophy } from 'lucide-react';

export function CurrentWinnerCard() {
  const db = useFirestore();
  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db) return;

    let membersLoaded = false;
    let groupsLoaded = false;

    const checkAllLoaded = () => {
      if (membersLoaded && groupsLoaded) {
        setIsLoading(false);
      }
    };

    const unsubMembers = subscribeToData(db, 'members', (data) => {
      setMembers(data as Member[]);
      membersLoaded = true;
      checkAllLoaded();
    });

    const unsubGroups = subscribeToData(db, 'groups', (data) => {
      setGroups(data as Group[]);
      groupsLoaded = true;
      checkAllLoaded();
    });

    return () => {
      unsubMembers();
      unsubGroups();
    };
  }, [db]);

  const { currentWinner, mapUrl } = useMemo(() => {
    const mainGroup = groups.find(g => g.name === 'Arisan Utama');
    if (!mainGroup || !mainGroup.currentWinnerId) {
      return { currentWinner: null, mapUrl: null };
    }

    const winner = members.find(m => m.id === mainGroup.currentWinnerId);
    if (!winner || !winner.address) {
      return { currentWinner: winner || null, mapUrl: null };
    }

    const encodedAddress = encodeURIComponent(winner.address);
    const url = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

    return { currentWinner: winner, mapUrl: url };
  }, [groups, members]);

  return (
    <Card className="border-amber-500/50 border-t-4">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="p-2 bg-amber-500/20 text-amber-600 rounded-lg">
             <Trophy className="w-6 h-6"/>
          </div>
          <div>
            <CardTitle className="uppercase text-amber-600">Anggota yang Menarik Bulan Ini</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">Memuat data pemenang...</p>
          </div>
        ) : currentWinner ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-1 flex flex-col items-center text-center gap-4">
              <Avatar className="h-24 w-24 border-4 border-primary">
                <AvatarImage src={currentWinner.avatarUrl} data-ai-hint={currentWinner.avatarHint} />
                <AvatarFallback className="text-3xl">
                  {currentWinner.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-xl font-bold">{currentWinner.name}</p>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <p className="text-sm">{currentWinner.address || 'Alamat tidak tersedia'}</p>
                </div>
              </div>
            </div>
            <div className="md:col-span-2 h-64 md:h-full w-full rounded-lg overflow-hidden border">
              {mapUrl ? (
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight={0}
                  marginWidth={0}
                  src={mapUrl}
                  title={`Lokasi ${currentWinner.name}`}
                  aria-label={`Lokasi ${currentWinner.name}`}
                ></iframe>
              ) : (
                <div className="flex items-center justify-center h-full bg-muted">
                  <p className="text-muted-foreground">Peta tidak tersedia karena alamat tidak lengkap.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p>Belum ada pemenang yang ditetapkan untuk bulan ini.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
