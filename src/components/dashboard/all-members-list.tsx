'use client';

import { useState, useEffect } from 'react';
import type { Member } from '@/app/data';
import { subscribeToData } from '@/app/data';
import { useFirestore } from '@/firebase';
import { Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '../ui/scroll-area';

export function AllMembersList() {
  const db = useFirestore();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    
    setIsLoading(true);
    const unsubscribe = subscribeToData(db, 'members', (data) => {
      setMembers(data as Member[]);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Memuat daftar anggota...</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-96">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[250px]">Anggota</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead>Nomor HP</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
            {members.map(member => (
                <TableRow key={member.id}>
                <TableCell>
                    <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarImage
                        src={member.avatarUrl}
                        data-ai-hint={member.avatarHint}
                        />
                        <AvatarFallback>
                        {member.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{member.name}</div>
                    </div>
                </TableCell>
                <TableCell className="max-w-[300px] truncate">{member.address || '-'}</TableCell>
                <TableCell>{member.phone || '-'}</TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
    </ScrollArea>
  );
}
