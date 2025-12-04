
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trophy, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface LotteryCardProps {
    group: Group;
    title: string;
    description: string;
    buttonText: string;
}

export function LotteryCard({ group, title, description, buttonText }: LotteryCardProps) {
  const { toast } = useToast();
  const db = useFirestore();
  const [members, setMembers] = useState<Member[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);
  const [drawnWinner, setDrawnWinner] = useState<Member | undefined>(undefined);

  useEffect(() => {
    if (!db) return;
    const unsub = subscribeToData(db, 'members', (data) => setMembers(data as Member[]));
    return () => unsub();
  }, [db]);
  
  const currentWinner = members.find(m => m.id === group.currentWinnerId);
  const groupMembers = members.filter(m => group.memberIds.includes(m.id));
  const winnerIds = group.winnerHistory?.map(wh => wh.memberId) || [];

  const handleDrawWinner = () => {
    if (!db) return;

    const eligibleMembers = members.filter(m => group.memberIds.includes(m.id) && !winnerIds.includes(m.id));

    if (eligibleMembers.length === 0) {
        toast({
            title: "Undian Selesai",
            description: "Semua anggota di grup ini sudah pernah menarik arisan.",
            variant: "default",
        });
        return;
    }

    setIsDrawing(true);
    const randomIndex = Math.floor(Math.random() * eligibleMembers.length);
    const newWinner = eligibleMembers[randomIndex];

    setTimeout(() => {
      setDrawnWinner(newWinner);
      
      const groupRef = doc(db, 'groups', group.id);
      const drawMonth = format(new Date(), 'yyyy-MM-dd');
      const newWinnerHistory = [...(group.winnerHistory || []), { month: drawMonth, memberId: newWinner.id }];
      
      const dataToUpdate = {
        currentWinnerId: newWinner.id,
        winnerHistory: newWinnerHistory
      };

      updateDoc(groupRef, dataToUpdate)
        .then(() => {
            setIsDrawing(false);
            setShowWinnerDialog(true);
            toast({
              title: "🎉 Penarik Baru Telah Diundi! 🎉",
              description: `Selamat kepada ${newWinner.name}!`,
            });
        })
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: groupRef.path,
                operation: 'update',
                requestResourceData: dataToUpdate
            });
            errorEmitter.emit('permission-error', permissionError);
            setIsDrawing(false);
        });
    }, 2000);
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
                  <Trophy className={cn("w-12 h-12 text-amber-400 transition-transform duration-500", isDrawing && "animate-pulse scale-110")}/>
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
         <CardContent>
          <p className="text-sm font-medium mb-2 text-center">Status Undian Anggota</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {groupMembers.map(member => (
              <div key={member.id} className={cn("flex items-center gap-2 p-1 rounded", winnerIds.includes(member.id) ? "bg-green-500/10 text-green-700" : "bg-muted text-muted-foreground")}>
                <Avatar className="h-5 w-5">
                    <AvatarImage src={member.avatarUrl} data-ai-hint={member.avatarHint} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="truncate">{member.name}</span>
                {winnerIds.includes(member.id) && <CheckCircle2 className="h-4 w-4 ml-auto flex-shrink-0" />}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleDrawWinner} disabled={isDrawing || !group || groupMembers.length === 0}>
            {isDrawing ? "Mengundi..." : buttonText}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={showWinnerDialog} onOpenChange={setShowWinnerDialog}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-headline">Selamat!</DialogTitle>
            <DialogDescription className="text-center">Penarik baru telah dipilih.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Trophy className="w-20 h-20 text-amber-400" />
            <Avatar className="w-24 h-24 border-4 border-primary">
              <AvatarImage src={drawnWinner?.avatarUrl} data-ai-hint={drawnWinner?.avatarHint} />
              <AvatarFallback className="text-3xl">{drawnWinner?.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <p className="text-2xl font-bold font-headline">{drawnWinner?.name}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
