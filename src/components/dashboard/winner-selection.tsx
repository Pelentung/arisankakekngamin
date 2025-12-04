'use client';

import React, { useState, useEffect } from 'react';
import { subscribeToData, Member, Group } from '@/app/data';
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
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';

export function WinnerSelection() {
  const { toast } = useToast();
  const db = useFirestore();
  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<Member | undefined>(undefined);
  const [drawnWinner, setDrawnWinner] = useState<Member | undefined>(undefined);

  const mainGroup = groups.find(g => g.id === 'g1');

  useEffect(() => {
    if (!db) return;
    const unsubMembers = subscribeToData(db, 'members', (data) => setMembers(data as Member[]));
    const unsubGroups = subscribeToData(db, 'groups', (data) => setGroups(data as Group[]));
    return () => {
      unsubMembers();
      unsubGroups();
    };
  }, [db]);

  useEffect(() => {
    if (mainGroup?.currentWinnerId) {
      const winner = members.find(
        (m) => m.id === mainGroup.currentWinnerId
      );
      setCurrentWinner(winner);
    } else {
        setCurrentWinner(undefined);
    }
  }, [mainGroup, members]);

  const handleDrawWinner = () => {
    if (!mainGroup) return;

    const eligibleMembers = members.filter(m => mainGroup.memberIds.includes(m.id) && m.id !== currentWinner?.id);
    if (eligibleMembers.length === 0) {
        toast({
            title: "Undian Gagal",
            description: "Tidak cukup anggota yang memenuhi syarat untuk mengundi.",
            variant: "destructive",
        });
        return;
    }

    setIsDrawing(true);
    const randomIndex = Math.floor(Math.random() * eligibleMembers.length);
    const newWinner = eligibleMembers[randomIndex];

    setTimeout(() => {
      setDrawnWinner(newWinner);
      setIsDrawing(false);
      setShowWinnerDialog(true);
      toast({
        title: "🎉 Penarik Baru Telah Diundi! 🎉",
        description: `Selamat kepada ${newWinner.name}!`,
      });
    }, 2000); // Simulate drawing animation
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Pemilihan Yang Menarik</CardTitle>
          <CardDescription>
            Yang menarik siklus saat ini dan undian untuk selanjutnya.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
            <Trophy className={cn("w-16 h-16 text-amber-400 transition-transform duration-500", isDrawing && "animate-pulse scale-110")}/>
            {currentWinner ? (
                <>
                <p className="text-sm text-muted-foreground">Yang Menarik Siklus Ini</p>
                <div className="flex items-center gap-3">
                    <Avatar>
                    <AvatarImage src={currentWinner.avatarUrl} data-ai-hint={currentWinner.avatarHint} />
                    <AvatarFallback>{currentWinner.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="font-semibold text-lg">{currentWinner.name}</p>
                </div>
                </>
            ) : (
                <p>Belum ada yang menarik yang dipilih.</p>
            )}
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleDrawWinner} disabled={isDrawing || !mainGroup}>
            {isDrawing ? "Mengundi..." : "Yang Menarik Bulan Berikutnya"}
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
