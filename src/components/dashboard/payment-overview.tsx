'use client';

import { useState } from 'react';
import { arisanData, type Member } from '@/app/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Bot, MoreHorizontal } from 'lucide-react';
import { ReminderOptimizer } from '../optimize/reminder-optimizer';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"

const today = new Date();
today.setHours(0, 0, 0, 0); // Set time to beginning of day for accurate comparison

const memberDetails = arisanData.payments
  .filter(p => p.groupId === 'g3')
  .map((payment) => {
    const member = arisanData.members.find((m) => m.id === payment.memberId);
    let currentStatus = payment.status;

    // Automatically mark as 'Late' if unpaid and past due date
    if (currentStatus === 'Unpaid' && new Date(payment.dueDate) < today) {
        currentStatus = 'Late';
    }

    const statusMapping = {
      'Paid': 'Lunas',
      'Unpaid': 'Belum Lunas',
      'Late': 'Terlambat',
    }
    return { ...payment, member, status: statusMapping[currentStatus] as 'Lunas' | 'Belum Lunas' | 'Terlambat' };
});

export function PaymentOverview() {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const handleOptimizeClick = (member: Member) => {
    setSelectedMember(member);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tinjauan Pembayaran</CardTitle>
        <CardDescription>
          Lacak pembayaran untuk siklus "Grup Arisan Utama" saat ini.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Sheet open={!!selectedMember} onOpenChange={(isOpen) => !isOpen && setSelectedMember(null)}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anggota</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberDetails.map((detail) => (
                <TableRow key={detail.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={detail.member?.avatarUrl} data-ai-hint={detail.member?.avatarHint} />
                        <AvatarFallback>
                          {detail.member?.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{detail.member?.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        detail.status === 'Lunas'
                          ? 'secondary'
                          : 'destructive'
                      }
                      className={
                        detail.status === 'Lunas' ? 'bg-green-500/20 text-green-400 border-green-500/20' : 
                        detail.status === 'Terlambat' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20' : ''
                      }
                    >
                      {detail.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                    }).format(detail.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {detail.status !== 'Lunas' && (
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleOptimizeClick(detail.member!)}>
                                <Bot className="h-4 w-4 text-primary" />
                                <span className="sr-only">Optimalkan Pengingat</span>
                            </Button>
                        </SheetTrigger>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Tindakan lainnya</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Tindakan</DropdownMenuLabel>
                            <DropdownMenuItem>Catat Pembayaran</DropdownMenuItem>
                            <DropdownMenuItem>Lihat Riwayat</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {selectedMember && (
            <SheetContent className="sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Optimalkan Pengingat Pembayaran</SheetTitle>
                <SheetDescription>
                  Hasilkan jadwal pengingat optimal untuk {selectedMember.name} menggunakan AI.
                </SheetDescription>
              </SheetHeader>
              <ReminderOptimizer member={selectedMember} />
            </SheetContent>
          )}
        </Sheet>
      </CardContent>
    </Card>
  );
}
