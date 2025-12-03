'use client';

import { useState, useMemo, useCallback } from 'react';
import { arisanData, type DetailedPayment, type Member, type Group } from '@/app/data';
import { Header } from '@/components/layout/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type PaymentDetail = DetailedPayment & { member?: Member };
type ContributionType = keyof DetailedPayment['contributions'];

const contributionLabels: Record<ContributionType, string> = {
  main: 'Iuran Utama',
  cash: 'Iuran Kas',
  sick: 'Iuran Sakit',
  bereavement: 'Iuran Kemalangan',
  other: 'Iuran Lainnya',
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

// --- Detailed Table for Main Group ---
const DetailedPaymentTable = ({ payments, onPaymentChange }: { payments: PaymentDetail[], onPaymentChange: (paymentId: string, contributionType: ContributionType, isPaid: boolean) => void }) => {
  return (
    <div className='overflow-x-auto'>
      <Table className="min-w-[1000px]">
        <TableHeader>
          <TableRow>
            <TableHead className='sticky left-0 bg-card z-10 w-[200px]'>Nama</TableHead>
            <TableHead>Bulan</TableHead>
            {(Object.keys(contributionLabels) as ContributionType[]).map(key => (
              contributionLabels[key] && <TableHead key={key}>{contributionLabels[key]}</TableHead>
            ))}
            <TableHead className="text-right">Jumlah</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map(payment => (
            <TableRow key={payment.id} data-state={payment.status === 'Paid' ? 'selected' : ''}>
              <TableCell className="font-medium sticky left-0 bg-card z-10 w-[200px]">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 hidden sm:flex">
                    <AvatarImage src={payment.member?.avatarUrl} data-ai-hint={payment.member?.avatarHint} />
                    <AvatarFallback>
                      {payment.member?.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>{payment.member?.name}</div>
                </div>
              </TableCell>
              <TableCell>
                {new Date(payment.dueDate).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </TableCell>
              {(Object.keys(payment.contributions) as ContributionType[]).map(type => (
                payment.contributions[type].amount > 0 && (
                  <TableCell key={type}>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`paid-${payment.id}-${type}`}
                        checked={payment.contributions[type].paid}
                        onCheckedChange={checked => onPaymentChange(payment.id, type, !!checked)}
                        aria-label={`Tandai ${contributionLabels[type]} untuk ${payment.member?.name} lunas`}
                      />
                      <label htmlFor={`paid-${payment.id}-${type}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {formatCurrency(payment.contributions[type].amount)}
                      </label>
                    </div>
                  </TableCell>
                )
              ))}
              <TableCell className="text-right">
                {formatCurrency(payment.totalAmount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// --- Simple Table for Other Groups ---
const SimplePaymentTable = ({ payments, onStatusChange }: { payments: PaymentDetail[], onStatusChange: (paymentId: string, newStatus: DetailedPayment['status']) => void }) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Bulan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {payments.map(payment => (
                    <TableRow key={payment.id} data-state={payment.status === 'Paid' ? 'selected' : ''}>
                        <TableCell>
                           <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 hidden sm:flex">
                              <AvatarImage src={payment.member?.avatarUrl} data-ai-hint={payment.member?.avatarHint} />
                              <AvatarFallback>
                                {payment.member?.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{payment.member?.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(payment.dueDate).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</TableCell>
                        <TableCell>
                          <Select value={payment.status} onValueChange={(value) => onStatusChange(payment.id, value as DetailedPayment['status'])}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Paid"><Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/20 w-full justify-center">Lunas</Badge></SelectItem>
                                <SelectItem value="Unpaid"><Badge variant="destructive">Belum Lunas</Badge></SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(payment.totalAmount)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

export default function PaymentPage() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<DetailedPayment[]>(arisanData.payments);
  const [selectedGroup, setSelectedGroup] = useState('g3'); // Default to 'Grup Arisan Utama'

  const calculatePaymentStatus = useCallback((payment: DetailedPayment): { status: DetailedPayment['status'], totalAmount: number } => {
    const { contributions } = payment;
    let allPaid = true;
    let totalAmount = 0;

    for (const key in contributions) {
      const type = key as ContributionType;
      totalAmount += contributions[type].amount;
      if (contributions[type].amount > 0 && !contributions[type].paid) {
        allPaid = false;
      }
    }

    const status: DetailedPayment['status'] = allPaid ? 'Paid' : 'Unpaid';
    
    return { status, totalAmount };
  }, []);

  const handleDetailedPaymentChange = (paymentId: string, contributionType: ContributionType, isPaid: boolean) => {
    setPayments(prevPayments =>
      prevPayments.map(p => {
        if (p.id === paymentId) {
          const updatedContributions = {
            ...p.contributions,
            [contributionType]: { ...p.contributions[contributionType], paid: isPaid },
          };

          const newP: DetailedPayment = { ...p, contributions: updatedContributions };
          
          const { status } = calculatePaymentStatus(newP);
          newP.status = status;
          
          const memberName = arisanData.members.find(m => m.id === p.memberId)?.name || 'Anggota';
          const contributionLabel = contributionLabels[contributionType];
          if (contributionLabel) {
            toast({
              title: 'Status Iuran Diperbarui',
              description: `${contributionLabel} untuk ${memberName} ${isPaid ? 'sudah' : 'belum'} dibayar.`,
            });
          }
          
          return newP;
        }
        return p;
      })
    );
  };

  const handleSimpleStatusChange = (paymentId: string, newStatus: DetailedPayment['status']) => {
    setPayments(prevPayments => prevPayments.map(p => {
        if (p.id === paymentId) {
            const allPaid = newStatus === 'Paid';
            const updatedContributions = { ...p.contributions };
            
            for (const key in updatedContributions) {
                const type = key as ContributionType;
                if(updatedContributions[type].amount > 0) {
                    updatedContributions[type].paid = allPaid;
                }
            }
            
            const memberName = arisanData.members.find(m => m.id === p.memberId)?.name || 'Anggota';
            toast({
              title: 'Status Pembayaran Diperbarui',
              description: `Status untuk ${memberName} diubah menjadi ${newStatus === 'Paid' ? 'Lunas' : 'Belum Lunas'}.`,
            });

            return { ...p, status: newStatus, contributions: updatedContributions };
        }
        return p;
    }));
  }
  
  const filteredPayments = useMemo(() => {
    return payments
      .filter(p => p.groupId === selectedGroup)
      .map(p => {
        const { status, totalAmount } = calculatePaymentStatus(p);
        return {
          ...p,
          status,
          totalAmount,
          member: arisanData.members.find(m => m.id === p.memberId),
        }
      });
  }, [payments, selectedGroup, calculatePaymentStatus]);


  const saveAllChanges = () => {
    // In a real app, this would send the updated 'payments' state to your backend API.
    // For now, we update the global mock data.
    arisanData.payments = payments;
    toast({
        title: "Perubahan Disimpan",
        description: "Semua status pembayaran telah disimpan."
    })
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Kelola Pembayaran" />
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Transaksi Pembayaran</CardTitle>
              <CardDescription>
                Kelola status pembayaran untuk grup arisan yang dipilih.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-full sm:w-[280px]">
                    <SelectValue placeholder="Pilih Grup" />
                </SelectTrigger>
                <SelectContent>
                    {arisanData.groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                        {group.name}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
                <Button onClick={saveAllChanges} className="w-full sm:w-auto">Simpan Perubahan</Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredPayments.length > 0 ? (
                selectedGroup === 'g3' ? (
                    <DetailedPaymentTable payments={filteredPayments} onPaymentChange={handleDetailedPaymentChange} />
                ) : (
                    <SimplePaymentTable payments={filteredPayments} onStatusChange={handleSimpleStatusChange} />
                )
            ) : (
                <div className="text-center text-muted-foreground py-8">
                    Tidak ada data pembayaran untuk grup ini.
                </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

    