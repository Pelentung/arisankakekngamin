
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Group } from '@/app/data';
import { subscribeToData } from '@/app/data';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users } from 'lucide-react';
import { useFirestore } from '@/firebase';

export function GroupsList() {
  const db = useFirestore();
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    if (!db) return;
    const unsubscribe = subscribeToData(db, 'groups', (data) => setGroups(data as Group[]));
    return () => unsubscribe();
  }, [db]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Grup Arisan</CardTitle>
        <CardDescription>Ringkasan grup arisan yang terdaftar.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {groups.map((group) => (
          <div key={group.id} className="flex items-center space-x-4 rounded-md border p-4">
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">{group.name}</p>
              <p className="text-sm text-muted-foreground">
                {group.memberIds.length} anggota
              </p>
            </div>
            <div className="text-right">
                <p className="text-sm font-semibold">
                {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                }).format(group.contributionAmount)}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{group.cycle === 'monthly' ? 'Bulanan' : 'Mingguan'}</p>
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button className="w-full" asChild variant="outline">
          <Link href="/grup">
            <Users className="mr-2 h-4 w-4" />
            Kelola Grup & Anggota
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
