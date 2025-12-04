
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { DetailedPayment, Member, Group, ContributionSettings } from '@/app/data';
import { subscribeToData } from '@/app/data';
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
import { useFirestore } from '@/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type PaymentDetail = DetailedPayment & { member?: Member };
type ContributionType = keyof DetailedPayment['contributions'];


const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

// --- Detailed Table for Main Group ---
const DetailedPaymentTable = ({ payments, onPaymentChange, contributionLabels }: { payments: PaymentDetail[], onPaymentChange: (paymentId: string, contributionType: ContributionType, isPaid: boolean) => void, contributionLabels: Record<string, string>}) => {
  const contributionKeys = Object.keys(contributionLabels);
  
  return (
    <div className='overflow-x-auto'>
      <Table className="min-w-[1000px]">
        <TableHeader>
          <TableRow>
            <TableHead className='sticky left-0 bg-card z-10 w-[200px]'>Nama</TableHead>
            {contributionKeys.map(key => (
              <TableHead key={key}>{contributionLabels[key]}</TableHead>
            ))}
            <TableHead className="text-right">Jumlah</TableHead>
            <TableHead>Status</TableHead>
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
              
              {contributionKeys.map(type => {
                const contribution = payment.contributions[type as ContributionType];
                 if (contribution && contributionLabels[type]) {
                    return (
                        <TableCell key={type}>
                            <div className="flex items-center gap-2">
                            <Checkbox
                                id={`paid-${payment.id}-${type}`}
                                checked={contribution.paid}
                                onCheckedChange={checked => onPaymentChange(payment.id, type, !!checked)}
                                aria-label={`Tandai ${contributionLabels[type]} untuk ${payment.member?.name} lunas`}
                            />
                            <label htmlFor={`paid-${payment.id}-${type}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {formatCurrency(contribution.amount)}
                            </label>
                            </div>
                        </TableCell>
                    )
                 }
                 return <TableCell key={type}></TableCell>; // Render empty cell if contribution doesn't exist for this payment
              })}

              <TableCell className="text-right">
                {formatCurrency(payment.totalAmount)}
              </TableCell>
              <TableCell>
                 <Badge
                    variant={
                        payment.status === 'Paid'
                        ? 'secondary'
                        : 'destructive'
                    }
                    className={
                        payment.status === 'Paid' ? 'bg-green-500/20 text-green-400 border-green-500/20' : ''
                    }
                    >
                    {payment.status === 'Paid' ? 'Lunas' : 'Belum Lunas'}
                    </Badge>
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
  const db = useFirestore();
  const [allPayments, setAllPayments] = useState<DetailedPayment[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [contributionSettings, setContributionSettings] = useState<ContributionSettings | null>(null);

  const [localChanges, setLocalChanges] = useState<DetailedPayment[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | undefined>(undefined);

  const mainArisanGroup = useMemo(() => allGroups.find(g => g.name === 'Arisan Utama'), [allGroups]);

  useEffect(() => {
    if (!db) return;
    const unsubPayments = subscribeToData(db, 'payments', (data) => {
      setAllPayments(data as DetailedPayment[]);
      setLocalChanges(data as DetailedPayment[]); 
    });
    const unsubMembers = subscribeToData(db, 'members', (data) => setAllMembers(data as Member[]));
    const unsubGroups = subscribeToData(db, 'groups', (data) => {
      const groups = data as Group[];
      setAllGroups(groups);
      // Set default selected group to "Arisan Utama" if it exists
      if (!selectedGroup) {
        const mainGroup = groups.find(g => g.name === 'Arisan Utama');
        if (mainGroup) {
          setSelectedGroup(mainGroup.id);
        } else if (groups.length > 0) {
          setSelectedGroup(groups[0].id);
        }
      }
    });
    const unsubSettings = subscribeToData(db, 'contributionSettings', (data) => {
        if (data.length > 0) {
            setContributionSettings(data[0] as ContributionSettings);
        }
    });

    return () => {
        unsubPayments();
        unsubMembers();
        unsubGroups();
        unsubSettings();
    }
  }, [db]); // remove selectedGroup from dependency array

  const contributionLabels = useMemo(() => {
    if (!contributionSettings) return {};
    const labels: Record<string, string> = {
        main: 'Iuran Utama',
        cash: 'Iuran Kas',
        sick: 'Iuran Sakit',
        bereavement: 'Iuran Kemalangan',
    };
    contributionSettings.others.forEach(other => {
        labels[other.id] = other.description;
    });
    return labels;
  }, [contributionSettings]);

  const calculatePaymentDetails = useCallback((payment: DetailedPayment): DetailedPayment => {
    if (!contributionSettings || !mainArisanGroup) {
        return payment;
    }

    if (payment.groupId !== mainArisanGroup.id) {
        const group = allGroups.find(g => g.id === payment.groupId);
        const totalAmount = group ? group.contributionAmount : 0;
        const contributions = { main: { amount: totalAmount, paid: payment.status === 'Paid' } };
        return {
            ...payment,
            totalAmount,
            contributions: contributions as DetailedPayment['contributions']
        };
    }
    
    // For the main group, calculate everything dynamically based on settings
    const updatedContributions: DetailedPayment['contributions'] = JSON.parse(JSON.stringify(payment.contributions));

    updatedContributions.main.amount = contributionSettings.main;
    updatedContributions.cash.amount = contributionSettings.cash;
    updatedContributions.sick.amount = contributionSettings.sick;
    updatedContributions.bereavement.amount = contributionSettings.bereavement;

    contributionSettings.others.forEach(other => {
        if (!updatedContributions[other.id]) {
             updatedContributions[other.id] = { amount: other.amount, paid: false };
        } else {
             updatedContributions[other.id].amount = other.amount;
        }
    });
    
    let allPaid = true;
    let totalAmount = 0;

    for (const key in updatedContributions) {
      const type = key as ContributionType;
      const contribution = updatedContributions[type];
      if (contribution) {
        totalAmount += contribution.amount;
        if (contribution.amount > 0 && !contribution.paid) {
            allPaid = false;
        }
      }
    }

    const status: DetailedPayment['status'] = allPaid ? 'Paid' : 'Unpaid';
    
    return { ...payment, status, totalAmount, contributions: updatedContributions };
  }, [contributionSettings, mainArisanGroup, allGroups]);

  const handleDetailedPaymentChange = (paymentId: string, contributionType: ContributionType, isPaid: boolean) => {
    setLocalChanges(prevPayments =>
      prevPayments.map(p => {
        if (p.id === paymentId) {
          const updatedPayment = { ...p };
          if (!updatedPayment.contributions[contributionType]) {
            // This case should ideally not happen if data is seeded correctly, but as a fallback:
             updatedPayment.contributions[contributionType] = { amount: 0, paid: isPaid };
          } else {
            updatedPayment.contributions[contributionType].paid = isPaid;
          }
          
          // Recalculate status and total based on the new paid status
          return calculatePaymentDetails(updatedPayment);
        }
        return p;
      })
    );
  };

  const handleSimpleStatusChange = (paymentId: string, newStatus: DetailedPayment['status']) => {
    setLocalChanges(prevPayments => prevPayments.map(p => {
        if (p.id === paymentId) {
            const allPaid = newStatus === 'Paid';
            const updatedContributions: DetailedPayment['contributions'] = JSON.parse(JSON.stringify(p.contributions));
            
            // Mark all underlying contributions as paid or unpaid
            for (const key in updatedContributions) {
                const type = key as ContributionType;
                if(updatedContributions[type]) {
                    updatedContributions[type].paid = allPaid;
                }
            }
            
            return { ...p, status: newStatus, contributions: updatedContributions };
        }
        return p;
    }));
  }
  
  const filteredPayments = useMemo(() => {
    return localChanges
      .filter(p => p.groupId === selectedGroup)
      .map(p => {
          const member = allMembers.find(m => m.id === p.memberId);
          // Recalculate details for display, ensuring it reflects local changes
          const detailedPayment = calculatePaymentDetails(p);
          return {
              ...detailedPayment,
              member,
          };
      });
  }, [localChanges, selectedGroup, allMembers, calculatePaymentDetails]);


  const saveAllChanges = async () => {
    if (!db) return;
    const batch = writeBatch(db);
    const changesToSave = localChanges.filter(local => 
        allPayments.some(original => original.id === local.id && JSON.stringify(original) !== JSON.stringify(local))
    );

    if (changesToSave.length === 0) {
        toast({
            title: "Tidak Ada Perubahan",
            description: "Tidak ada perubahan yang perlu disimpan.",
        });
        return;
    }

    changesToSave.forEach(payment => {
        const docRef = doc(db, "payments", payment.id);
        const { id, member, ...paymentData } = payment; // Exclude client-side only 'member' property
        batch.update(docRef, paymentData);
    });
    
    batch.commit()
        .then(() => {
            toast({
                title: "Perubahan Disimpan",
                description: "Semua status pembayaran telah berhasil diperbarui."
            })
        })
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: 'payments (batch operation)',
                operation: 'write',
                requestResourceData: changesToSave.map(p => ({id: p.id, data: p}))
            });
            errorEmitter.emit('permission-error', permissionError);
        });
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
                    {allGroups.map(group => (
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
            {!contributionSettings || !mainArisanGroup ? (
                 <div className="text-center text-muted-foreground py-8">
                    Memuat pengaturan...
                </div>
            ) : filteredPayments.length > 0 ? (
                selectedGroup === mainArisanGroup.id ? (
                    <DetailedPaymentTable payments={filteredPayments} onPaymentChange={handleDetailedPaymentChange} contributionLabels={contributionLabels} />
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
