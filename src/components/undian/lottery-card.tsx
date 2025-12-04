
'use client';

import React, { useState, useEffect } from 'react';
import type { Member, Group } from '@/app/data';
import { subscribeToData } from '@/app/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trophy, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { ScrollArea } from '../ui/scroll-area';

interface LotteryCardProps {
    group: Group;
    title: string;
    description: string;
}

export function LotteryCard({ group, title, description }: LotteryCardProps) {
  const { toast } = useToast();
  const db = useFirestore();
  const [members, setMembers] = useState<Member[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!db) return;
    const unsub = subscribeToData(db, 'members', (data) => setMembers(data as Member[]));
    return () => unsub();
  }, [db]);
  
  const currentWinner = members.find(m => m.id === group.currentWinnerId);
  const groupMembers = members.filter(m => group.memberIds.includes(m.id));
  const winnerIds = group.winnerHistory?.map(wh => wh.memberId) || [];

  const handleSelectWinner = async (selectedMember: Member) => {
    if (!db || isSaving) return;

    setIsSaving(true);
    
    const groupRef = doc(db, 'groups', group.id);
    const drawMonth = format(new Date(), 'yyyy-MM-dd');
    
    let dataToUpdate: any = {
      currentWinnerId: selectedMember.id,
    };
    
    if (selectedMember.id) {
        dataToUpdate.winnerHistory = arrayUnion({ month: drawMonth, memberId: selectedMember.id });
    }

    try {
        await updateDoc(groupRef, dataToUpdate);
        if (selectedMember.id) {
            toast({
              title: "Pemenang Telah Ditetapkan",
              description: `Selamat, ${selectedMember.name} telah menjadi penarik arisan.`,
            });
        } else {
            toast({
              title: "Pemenang Dikosongkan",
              description: `Pemenang untuk grup ${group.name} telah dikosongkan.`,
            });
        }
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
            path: groupRef.path,
            operation: 'update',
            requestResourceData: dataToUpdate
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col items-center justify-center gap-4 text-center min-h-[180px]">
            {currentWinner ? (
                <>
                  <Trophy className="w-12 h-12 text-amber-400"/>
                  <p className="text-sm text-muted-foreground">Yang Menarik Saat Ini</p>
                  <div className="flex items-center gap-3">
                      <Avatar>
                      <AvatarImage src={currentWinner.avatarUrl} data-ai-hint={currentWinner.avatarHint} />
                      <AvatarFallback>{currentWinner.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <p className="font-semibold text-lg">{currentWinner.name}</p>
                  </div>
                </>
            ) : (
                 <p className="text-muted-foreground">Belum ada yang menarik yang dipilih untuk grup ini.</p>
            )}
        </CardContent>
         <CardContent className="flex-grow">
            <p className="text-sm font-medium mb-2 text-left">Pilih Pemenang Manual</p>
            <ScrollArea className="h-60 border rounded-md p-2">
                <div className="space-y-2">
                {groupMembers.map(member => {
                  const hasWon = winnerIds.includes(member.id);
                  return (
                    <div key={member.id} className={cn("flex items-center gap-3 p-2 rounded-md", hasWon ? "bg-green-500/10" : "bg-muted/50")}>
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatarUrl} data-ai-hint={member.avatarHint} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="flex-1 font-medium text-sm truncate">{member.name}</span>
                        {hasWon ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        ) : (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="outline" disabled={isSaving}>Pilih</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Konfirmasi Pemenang</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Apakah Anda yakin ingin menetapkan <strong>{member.name}</strong> sebagai pemenang arisan untuk periode ini? Tindakan ini tidak dapat diurungkan.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleSelectWinner(member)}>
                                        Ya, Jadikan Pemenang
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                  )
                })}
                {groupMembers.length === 0 && <p className="text-center text-muted-foreground py-4">Belum ada anggota di grup ini.</p>}
                </div>
            </ScrollArea>
        </CardContent>
        <CardFooter className="pt-4">
             <Button className="w-full" variant="secondary" onClick={() => handleSelectWinner({ id: '', name: 'Kosongkan Pemenang' } as Member)} disabled={isSaving}>
                Kosongkan Pemenang Saat Ini
            </Button>
        </CardFooter>
      </Card>
    </>
  );
}
