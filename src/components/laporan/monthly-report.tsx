
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Group, Member, DetailedPayment, Expense, ContributionSettings } from '@/app/data';
import { subscribeToData } from '@/app/data';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDownCircle, ArrowUpCircle, Banknote, UserCheck } from 'lucide-react';
import { format, getMonth, getYear, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useFirestore } from '@/firebase';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

const generateMonthOptions = () => {
    const options = [];
    // Go back 12 months from the current month
    let currentDate = new Date();
    for (let i = 0; i < 12; i++) {
        const monthValue = `${getYear(currentDate)}-${getMonth(currentDate)}`;
        const monthLabel = format(currentDate, 'MMMM yyyy', { locale: id });
        options.push({ value: monthValue, label: monthLabel });
        currentDate = subMonths(currentDate, 1);
    }
    return options;
};

export function MonthlyReport() {
    const db = useFirestore();
    const [allPayments, setAllPayments] = useState<DetailedPayment[]>([]);
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [allGroups, setAllGroups] = useState<Group[]>([]);
    const [contributionSettings, setContributionSettings] = useState<ContributionSettings | null>(null);

    const monthOptions = useMemo(() => generateMonthOptions(), []);
    const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);

    useEffect(() => {
        if (!db) return;
        const unsubPayments = subscribeToData(db, 'payments', data => setAllPayments(data as DetailedPayment[]));
        const unsubMembers = subscribeToData(db, 'members', data => setAllMembers(data as Member[]));
        const unsubGroups = subscribeToData(db, 'groups', data => setAllGroups(data as Group[]));
        const unsubSettings = subscribeToData(db, 'contributionSettings', data => {
            if (data.length > 0) setContributionSettings(data[0] as ContributionSettings);
        });

        return () => {
            unsubPayments();
            unsubMembers();
            unsubGroups();
            unsubSettings();
        };
    }, [db]);


    const reportData = useMemo(() => {
        if (!contributionSettings) {
             return { cashIn: 0, cashOut: 0, endingBalance: 0, winner: null, transactions: [], sickFund: 0, bereavementFund: 0 };
        }
        const [year, month] = selectedMonth.split('-').map(Number);
        
        const mainGroup = allGroups.find(g => g.id === 'g3');
        if (!mainGroup) return { cashIn: 0, cashOut: 0, endingBalance: 0, winner: null, transactions: [], sickFund: 0, bereavementFund: 0 };
        
        const allPaymentsForMonth = allPayments
            .filter(p => {
                const paymentDueDate = new Date(p.dueDate);
                return getYear(paymentDueDate) === year && getMonth(paymentDueDate) === month;
            });
        
        const mainGroupPayments = allPaymentsForMonth.filter(p => p.groupId === mainGroup.id);

        let cashIn = 0;
        let sickFund = 0;
        let bereavementFund = 0;
        
        mainGroupPayments.forEach(p => {
            if (p.contributions.main?.paid) cashIn += contributionSettings.main;
            if (p.contributions.cash?.paid) cashIn += contributionSettings.cash;
            if (p.contributions.sick?.paid) sickFund += contributionSettings.sick;
            if (p.contributions.bereavement?.paid) bereavementFund += contributionSettings.bereavement;
            contributionSettings.others.forEach(other => {
                if (p.contributions[other.id]?.paid) cashIn += other.amount;
            })
        });

        // Add other groups' main contribution to cashIn
        allPaymentsForMonth.forEach(p => {
            if (p.groupId !== mainGroup.id && p.status === 'Paid') {
                const group = allGroups.find(g => g.id === p.groupId);
                if(group) cashIn += group.contributionAmount;
            }
        });
        
        const winnerEntry = mainGroup.winnerHistory?.find(wh => {
            const whDate = new Date(wh.month);
            return getYear(whDate) === year && getMonth(whDate) === month;
        });
        
        let winner = null;
        if (winnerEntry) {
            winner = allMembers.find(m => m.id === winnerEntry.memberId);
        }
        
        const cashOut = winner ? contributionSettings.main * mainGroup.memberIds.length : 0;

        const endingBalance = cashIn - cashOut;

        const detailedTransactions = allPaymentsForMonth
            .filter(p => p.status === 'Paid')
            .map(p => {
                const member = allMembers.find(m => m.id === p.memberId);
                const group = allGroups.find(g => g.id === p.groupId);
                const paymentHistoryEntry = member?.paymentHistory.find(ph => {
                    const phDate = new Date(ph.date);
                    return getYear(phDate) === year && getMonth(phDate) === month;
                })
                
                let amount = 0;
                if (group?.id === mainGroup.id) {
                    amount = (p.contributions.main?.paid ? contributionSettings.main : 0) + 
                             (p.contributions.cash?.paid ? contributionSettings.cash : 0);
                    contributionSettings.others.forEach(other => {
                        if (p.contributions[other.id]?.paid) amount += other.amount;
                    })
                } else if (group) {
                    amount = group.contributionAmount;
                }

                return {
                    member: member?.name || 'Tidak diketahui',
                    avatarUrl: member?.avatarUrl,
                    avatarHint: member?.avatarHint,
                    amount: amount,
                    description: group?.name || "Iuran",
                    date: paymentHistoryEntry ? paymentHistoryEntry.date : p.dueDate,
                };
            })
            .filter(tx => tx.amount > 0);

        return { cashIn, cashOut, endingBalance, winner, transactions: detailedTransactions, sickFund, bereavementFund };
    }, [selectedMonth, contributionSettings, allPayments, allGroups, allMembers]);


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <div>
                <CardTitle>Laporan Bulanan</CardTitle>
                <CardDescription>Pilih bulan dan tahun untuk melihat riwayat laporan keuangan.</CardDescription>
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder="Pilih Bulan & Tahun" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Kas Masuk</CardTitle>
                        <ArrowDownCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(reportData.cashIn)}</div>
                        <p className="text-xs text-muted-foreground">Total iuran anggota bulan ini</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Kas Keluar</CardTitle>
                        <ArrowUpCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(reportData.cashOut)}</div>
                        <p className="text-xs text-muted-foreground">Pencairan untuk yang menarik</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saldo Kas Bulan Ini</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(reportData.endingBalance)}</div>
                        <p className="text-xs text-muted-foreground">Selisih kas masuk dan keluar</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Yang Menarik Bulan Terpilih</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {reportData.winner ? (
                            <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={reportData.winner.avatarUrl} data-ai-hint={reportData.winner.avatarHint} />
                                    <AvatarFallback>{reportData.winner.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <p className="font-semibold text-sm">{reportData.winner.name}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Tidak ada data</p>
                        )}
                         <p className="text-xs text-muted-foreground mt-2">Penarik arisan siklus terpilih</p>
                    </CardContent>
                </Card>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Detail Pemasukan Bulan {format(new Date(selectedMonth.split('-')[0], parseInt(selectedMonth.split('-')[1])), 'MMMM yyyy', { locale: id })}</CardTitle>
            <CardDescription>Daftar semua iuran yang telah dibayarkan pada bulan yang dipilih (tidak termasuk dana sosial).</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Anggota</TableHead>
                        <TableHead>Keterangan</TableHead>
                        <TableHead>Tanggal Pembayaran</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reportData.transactions.length > 0 ? (
                        reportData.transactions.map((tx, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 hidden sm:flex">
                                            <AvatarImage src={tx.avatarUrl} data-ai-hint={tx.avatarHint} />
                                            <AvatarFallback>{tx.member.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="font-medium">{tx.member}</div>
                                    </div>
                                </TableCell>
                                <TableCell>{tx.description}</TableCell>
                                <TableCell>{format(new Date(tx.date), 'd MMMM yyyy', { locale: id })}</TableCell>
                                <TableCell className="text-right">{formatCurrency(tx.amount)}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                Tidak ada data transaksi untuk bulan ini.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

       <div className="grid gap-4 sm:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Dana Sosial Sakit</CardTitle>
                    <CardDescription>Total dana sakit yang terkumpul bulan ini.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(reportData.sickFund)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Dana Sosial Kemalangan</CardTitle>
                    <CardDescription>Total dana kemalangan yang terkumpul bulan ini.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(reportData.bereavementFund)}</div>
                </CardContent>
            </Card>
       </div>

    </div>
  );
}
