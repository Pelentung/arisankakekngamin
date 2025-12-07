
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { DetailedPayment, Member, Group, Expense } from '@/app/data';
import { subscribeToData } from '@/app/data';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useAuth } from '@/firebase';
import { doc, writeBatch, collection, getDocs, query, where, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { format, getMonth, getYear, startOfMonth, endOfMonth, subMonths, parse } from 'date-fns';
import { id } from 'date-fns/locale';
import { MoreHorizontal, PlusCircle, Loader2, Edit, Trash2, GitPullRequest, AlertCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';


const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

const generateMonthOptions = () => {
    const options = [];
    let currentDate = new Date();
    for (let i = 0; i < 12; i++) {
        const monthValue = `${getYear(currentDate)}-${getMonth(currentDate)}`;
        const monthLabel = format(currentDate, 'MMMM yyyy', { locale: id });
        options.push({ value: monthValue, label: monthLabel });
        currentDate = subMonths(currentDate, 1);
    }
    return options;
};

// --- Detailed Table for Main Group ---
const DetailedPaymentTable = ({ payments, onPaymentChange, onAmountChange, contributionLabels }: { payments: (DetailedPayment & { member?: Member })[], onPaymentChange: (paymentId: string, contributionType: keyof DetailedPayment['contributions'], isPaid: boolean) => void, onAmountChange: (paymentId: string, contributionType: string, amount: number) => void, contributionLabels: Record<string, string>}) => {
  const contributionKeys = useMemo(() => {
    // Explicitly define the order of the columns
    return ['main', 'cash', 'sick', 'bereavement', 'other1', 'other2', 'other3'];
  }, []);

  const columnTotals = useMemo(() => {
    const totals = contributionKeys.reduce((acc, key) => {
        acc[key] = 0;
        return acc;
    }, {} as Record<string, number>);

    let grandTotal = 0;

    payments.forEach(payment => {
        contributionKeys.forEach(key => {
            const contribution = payment.contributions[key as keyof DetailedPayment['contributions']];
            if (contribution?.paid) {
                totals[key] += contribution.amount;
            }
        });
    });
    
    // Recalculate grandTotal based on paid contributions only
    grandTotal = Object.values(totals).reduce((sum, amount) => sum + amount, 0);

    return { ...totals, grandTotal };
  }, [payments, contributionKeys]);
  
  return (
    <div className='overflow-x-auto'>
      <Table className="min-w-[1200px]">
        <TableHeader>
          <TableRow>
            <TableHead className='sticky left-0 bg-card z-10 w-[200px]'>Nama</TableHead>
            {contributionKeys.map(key => (
              <TableHead key={key}>{contributionLabels[key] || key}</TableHead>
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
                const contribution = payment.contributions[type as keyof DetailedPayment['contributions']];
                 if (contribution !== undefined) {
                    const label = contributionLabels[type] || type;
                    const isEditable = type.startsWith('sick') || type.startsWith('bereavement') || type.startsWith('other');
                    
                    return (
                        <TableCell key={type}>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id={`paid-${payment.id}-${type}`}
                                    checked={contribution.paid}
                                    onCheckedChange={checked => onPaymentChange(payment.id, type as keyof DetailedPayment['contributions'], !!checked)}
                                    aria-label={`Tandai ${label} untuk ${payment.member?.name} lunas`}
                                />
                                {isEditable ? (
                                    <Input
                                        type="number"
                                        value={contribution.amount}
                                        onChange={(e) => onAmountChange(payment.id, type, Number(e.target.value))}
                                        className="h-8 w-24"
                                        placeholder="0"
                                    />
                                ) : (
                                    <label htmlFor={`paid-${payment.id}-${type}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {formatCurrency(contribution.amount)}
                                    </label>
                                )}
                            </div>
                        </TableCell>
                    )
                 }
                 return <TableCell key={type}></TableCell>;
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
        <TableFooter>
            <TableRow className="font-bold bg-muted/50">
                <TableCell className="sticky left-0 bg-muted/50 z-10">Total Terbayar</TableCell>
                {contributionKeys.map(key => (
                    <TableCell key={`total-${key}`}>{formatCurrency(columnTotals[key] || 0)}</TableCell>
                ))}
                <TableCell className="text-right">{formatCurrency(columnTotals.grandTotal)}</TableCell>
                <TableCell></TableCell>
            </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

// --- Simple Table for Other Groups ---
const SimplePaymentTable = ({ payments, onStatusChange }: { payments: (DetailedPayment & { member?: Member })[], onStatusChange: (paymentId: string, newStatus: DetailedPayment['status']) => void }) => {
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

const ExpenseDialog = ({ expense, isOpen, onClose, onSave }: { expense: Partial<Expense> | null, isOpen: boolean, onClose: () => void, onSave: (expense: Omit<Expense, 'id'>, id?: string) => void }) => {
  const [formData, setFormData] = useState<Partial<Expense> | null>(expense);
  const { toast } = useToast();

  const expenseCategories: Expense['category'][] = ['Sakit', 'Kemalangan', 'Talangan Kas', 'Lainnya'];

  useEffect(() => { setFormData(expense); }, [expense]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, [e.target.id]: Number(e.target.value) }));
  const handleCategoryChange = (value: string) => setFormData(prev => ({ ...prev, category: value as Expense['category'] }));

  const handleSave = () => {
    if (!formData?.description || !formData?.date || !formData?.amount || !formData?.category) {
        toast({ title: "Data Tidak Lengkap", description: "Semua field harus diisi.", variant: "destructive" });
        return;
    }
    const newExpenseData: Omit<Expense, 'id'> = {
      description: formData.description, date: formData.date, amount: formData.amount, category: formData.category
    };
    onSave(newExpenseData, formData.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{expense?.id ? 'Ubah Pengeluaran' : 'Tambah Pengeluaran Baru'}</DialogTitle>
          <DialogDescription>{expense?.id ? 'Ubah detail pengeluaran.' : 'Isi detail untuk pengeluaran baru.'}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="date" className="text-right">Tanggal</Label><Input id="date" type="date" value={formData?.date || ''} onChange={handleChange} className="col-span-3" /></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="description" className="text-right">Deskripsi</Label><Textarea id="description" value={formData?.description || ''} onChange={handleChange} className="col-span-3" /></div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">Kategori</Label>
            <Select value={formData?.category} onValueChange={handleCategoryChange}><SelectTrigger id="category" className="col-span-3"><SelectValue placeholder="Pilih Kategori" /></SelectTrigger>
            <SelectContent>
                {expenseCategories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="amount" className="text-right">Jumlah</Label><Input id="amount" type="number" value={formData?.amount || ''} onChange={handleAmountChange} className="col-span-3" placeholder="Contoh: 50000" /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Batal</Button><Button onClick={handleSave}>Simpan</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function KeuanganPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Global data
  const [allPayments, setAllPayments] = useState<DetailedPayment[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [mainArisanGroup, setMainArisanGroup] = useState<Group | null>(null);

  // Page state
  const monthOptions = useMemo(() => generateMonthOptions(), []);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);
  const [selectedGroup, setSelectedGroup] = useState<string | undefined>(undefined);
  const [localChanges, setLocalChanges] = useState<DetailedPayment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Expenses Dialog
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Partial<Expense> | null>(null);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // You can ask the AI to modify the labels here in the future
  const contributionLabels: Record<string, string> = {
    main: 'Iuran Utama',
    cash: 'Iuran Kas',
    sick: 'Iuran Sakit',
    bereavement: 'Iuran Kemalangan',
    other1: 'Lainnya 1',
    other2: 'Lainnya 2',
    other3: 'Lainnya 3'
  };

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.isAnonymous) {
        router.push('/');
      } else {
        setUser(currentUser);
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [auth, router]);

  // Data fetching for collections
  useEffect(() => {
    if (!db || !user) return;
    
    setIsLoading(true);
    const unsubPayments = subscribeToData(db, 'payments', (data) => { 
        setAllPayments(data as DetailedPayment[]); 
        setLocalChanges(data as DetailedPayment[]);
    });
    const unsubMembers = subscribeToData(db, 'members', (data) => setAllMembers(data as Member[]));
    const unsubExpenses = subscribeToData(db, 'expenses', (data) => setAllExpenses(data as Expense[]));
    const unsubGroups = subscribeToData(db, 'groups', (data) => {
      const groups = data as Group[];
      setAllGroups(groups);
      const mainGroup = groups.find(g => g.name === 'Arisan Utama');
      if (mainGroup) {
        setMainArisanGroup(mainGroup);
        if (!selectedGroup) {
          setSelectedGroup(mainGroup.id);
        }
      }
    });
    
    Promise.all([
        new Promise(resolve => { const unsub = subscribeToData(db, 'payments', () => { resolve(true); unsub(); }); }),
        new Promise(resolve => { const unsub = subscribeToData(db, 'members', () => { resolve(true); unsub(); }); }),
        new Promise(resolve => { const unsub = subscribeToData(db, 'expenses', () => { resolve(true); unsub(); }); }),
        new Promise(resolve => { const unsub = subscribeToData(db, 'groups', () => { resolve(true); unsub(); }); }),
    ]).finally(() => setIsLoading(false));

    return () => { 
        unsubPayments(); unsubMembers(); unsubGroups(); unsubExpenses(); 
    };
  }, [db, user]); 

  // Filtered data for display
  const filteredPayments = useMemo(() => {
    const group = allGroups.find(g => g.id === selectedGroup);
    if (!group) return [];
  
    const [year, month] = selectedMonth.split('-').map(Number);
    
    const paymentsForMonthAndGroup = localChanges
      .filter(p => {
        const paymentDate = new Date(p.dueDate);
        return p.groupId === selectedGroup &&
               getYear(paymentDate) === year &&
               getMonth(paymentDate) === month &&
               group.memberIds.includes(p.memberId);
      });
  
    // Deduplicate payments by memberId, taking the first one found for UI display.
    const uniquePaymentsMap = new Map<string, DetailedPayment>();
    for (const payment of paymentsForMonthAndGroup) {
      if (!uniquePaymentsMap.has(payment.memberId)) {
        uniquePaymentsMap.set(payment.memberId, payment);
      }
    }
    
    return Array.from(uniquePaymentsMap.values())
      .map(p => ({ ...p, member: allMembers.find(m => m.id === p.memberId) }))
      .filter(p => p.member)
      .sort((a, b) => a.member!.name.localeCompare(b.member!.name));
      
  }, [localChanges, selectedGroup, selectedMonth, allMembers, allGroups]);

  const filteredExpenses = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return allExpenses.filter(e => {
        const expenseDate = new Date(e.date);
        return getYear(expenseDate) === year && getMonth(expenseDate) === month;
    });
  }, [allExpenses, selectedMonth]);

  
  // Payment handlers
  const handleDetailedPaymentChange = useCallback((paymentId: string, contributionType: keyof DetailedPayment['contributions'], isPaid: boolean) => {
    setLocalChanges(prev =>
        prev.map(p => {
            if (p.id !== paymentId) return p;

            const updatedContributions = {
                ...p.contributions,
                [contributionType]: { ...p.contributions[contributionType as keyof DetailedPayment['contributions']], paid: isPaid },
            };
            
            const allContributionsPaid = Object.values(updatedContributions).every(c => c.paid);
            
            return {
                ...p,
                contributions: updatedContributions,
                status: allContributionsPaid ? 'Paid' : 'Unpaid',
            };
        })
    );
  }, []);

  const handleAmountChange = useCallback((paymentId: string, contributionType: string, amount: number) => {
      setLocalChanges(prev =>
          prev.map(p => {
              if (p.id !== paymentId) return p;

              const updatedContributions: DetailedPayment['contributions'] = {
                  ...p.contributions,
                  [contributionType]: { ...(p.contributions[contributionType as keyof DetailedPayment['contributions']] || { paid: false }), amount: amount },
              };
              
              const newTotalAmount = Object.values(updatedContributions).reduce((sum, c) => sum + (c?.amount || 0), 0);

              return {
                  ...p,
                  contributions: updatedContributions,
                  totalAmount: newTotalAmount,
              };
          })
      );
  }, []);

  const handleSimpleStatusChange = (paymentId: string, newStatus: DetailedPayment['status']) => {
    setLocalChanges(prev => prev.map(p => {
        if (p.id !== paymentId) return p;
        const allPaid = newStatus === 'Paid';
        const updatedContributions: DetailedPayment['contributions'] = JSON.parse(JSON.stringify(p.contributions));
        for (const key in updatedContributions) {
          if(updatedContributions[key as keyof DetailedPayment['contributions']]) {
            updatedContributions[key as keyof DetailedPayment['contributions']].paid = allPaid;
          }
        }
        return { ...p, status: newStatus, contributions: updatedContributions };
    }));
  };
  
  const savePaymentChanges = async () => {
    if (!db) return;
    const changesToSave = localChanges.filter(local => allPayments.some(original => original.id === local.id && JSON.stringify(original) !== JSON.stringify(local)));

    if (changesToSave.length === 0) {
        toast({ title: "Tidak Ada Perubahan", description: "Tidak ada perubahan pembayaran yang perlu disimpan." });
        return;
    }

    const batch = writeBatch(db);
    changesToSave.forEach(payment => {
        const { id, member, ...paymentData } = payment;
        batch.update(doc(db, "payments", id), {...paymentData });
    });
    
    try {
      await batch.commit();
      toast({ title: "Perubahan Disimpan", description: "Status pembayaran telah berhasil diperbarui." });
    } catch (serverError) {
      const permissionError = new FirestorePermissionError({ path: 'payments (batch update)', operation: 'write', requestResourceData: changesToSave.map(p => ({id: p.id, data: p})) });
      errorEmitter.emit('permission-error', permissionError);
    }
  };

  // Expense Handlers
  const handleAddExpense = () => {
    const [year, month] = selectedMonth.split('-');
    const date = new Date(Number(year), Number(month), 1);
    setSelectedExpense({ date: format(date, 'yyyy-MM-dd') });
    setIsExpenseDialogOpen(true);
  };
  const handleEditExpense = (expense: Expense) => { setSelectedExpense(expense); setIsExpenseDialogOpen(true); };
  const handleDeleteExpense = (expenseId: string) => {
    if (!db) return;
    const docRef = doc(db, 'expenses', expenseId);
    deleteDoc(docRef)
        .then(() => toast({ title: "Pengeluaran Dihapus", description: "Data pengeluaran telah dihapus." }))
        .catch((e) => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' })));
  };
  const handleSaveExpense = (expenseData: Omit<Expense, 'id'>, id?: string) => {
    if (!db) return;
    if (id) {
        updateDoc(doc(db, 'expenses', id), expenseData)
            .then(() => { toast({ title: "Pengeluaran Diperbarui" }); setIsExpenseDialogOpen(false); })
            .catch((e) => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `expenses/${id}`, operation: 'update', requestResourceData: expenseData })));
    } else {
        addDoc(collection(db, 'expenses'), expenseData)
            .then(() => { toast({ title: "Pengeluaran Ditambahkan" }); setIsExpenseDialogOpen(false); })
            .catch((e) => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'expenses', operation: 'create', requestResourceData: expenseData })));
    }
  };

  const handleSync = useCallback(async () => {
    if (!db || !selectedGroup) {
      toast({ title: "Sinkronisasi Gagal", description: "Database atau grup belum siap.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    let createdCount = 0;
    let updatedCount = 0;
    let deletedCount = 0;

    try {
      const group = allGroups.find(g => g.id === selectedGroup);
      if (!group) throw new Error("Grup yang dipilih tidak ditemukan.");

      const [year, month] = selectedMonth.split('-').map(Number);
      const dueDate = format(new Date(year, month, 1), 'yyyy-MM-dd');

      const isMainGroup = group.name === 'Arisan Utama';
      const fixedMainAmount = 90000;
      const fixedCashAmount = 10000;
      
      const batch = writeBatch(db);

      // 1. Fetch ALL existing payments for the selected month and group
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('groupId', '==', selectedGroup),
        where('dueDate', '==', dueDate)
      );
      const querySnapshot = await getDocs(paymentsQuery);
      const existingPaymentsDocs = querySnapshot.docs;

      // 2. Group payments by memberId
      const paymentsByMember = new Map<string, (DetailedPayment & { id: string })[]>();
      existingPaymentsDocs.forEach(doc => {
          const payment = { id: doc.id, ...doc.data() } as (DetailedPayment & { id: string });
          if (!paymentsByMember.has(payment.memberId)) {
              paymentsByMember.set(payment.memberId, []);
          }
          paymentsByMember.get(payment.memberId)!.push(payment);
      });

      // 3. Handle duplicates: decide which one to keep and delete others
      for (const [memberId, payments] of paymentsByMember.entries()) {
          if (payments.length > 1) {
              // Sort to find the 'best' one to keep (e.g., paid, or highest total amount)
              payments.sort((a, b) => {
                  if (a.status === 'Paid' && b.status !== 'Paid') return -1;
                  if (b.status === 'Paid' && a.status !== 'Paid') return 1;
                  return b.totalAmount - a.totalAmount;
              });

              const paymentToKeep = payments[0];
              const paymentsToDelete = payments.slice(1);
              
              paymentsToDelete.forEach(p => {
                  batch.delete(doc(db, 'payments', p.id));
                  deletedCount++;
              });
              // Update the map to only contain the payment we're keeping
              paymentsByMember.set(memberId, [paymentToKeep]);
          }
      }

      // 4. Iterate over group members to create or update payments
      for (const memberId of group.memberIds) {
        const existingPaymentArr = paymentsByMember.get(memberId);
        const existingPayment = existingPaymentArr ? existingPaymentArr[0] : undefined;
        
        if (existingPayment) {
          // --- UPDATE EXISTING PAYMENT ---
          const paymentRef = doc(db, 'payments', existingPayment.id);
          let hasChanges = false;

          const updatedContributions: DetailedPayment['contributions'] = {
            main: { 
              amount: isMainGroup ? fixedMainAmount : group.contributionAmount,
              paid: existingPayment.contributions.main?.paid || false
            },
            cash: { 
              amount: isMainGroup ? fixedCashAmount : 0,
              paid: isMainGroup ? existingPayment.contributions.cash?.paid || false : true
            },
            sick: { 
                amount: existingPayment.contributions.sick?.amount || 0,
                paid: existingPayment.contributions.sick?.paid || false 
            },
            bereavement: {
                amount: existingPayment.contributions.bereavement?.amount || 0,
                paid: existingPayment.contributions.bereavement?.paid || false
            },
            other1: {
                amount: existingPayment.contributions.other1?.amount || 0,
                paid: existingPayment.contributions.other1?.paid || false
            },
            other2: {
                amount: existingPayment.contributions.other2?.amount || 0,
                paid: existingPayment.contributions.other2?.paid || false
            },
            other3: {
                amount: existingPayment.contributions.other3?.amount || 0,
                paid: existingPayment.contributions.other3?.paid || false
            }
          };

          const totalAmount = Object.values(updatedContributions).reduce((sum, c) => sum + (c?.amount || 0), 0);
          
          if (JSON.stringify(existingPayment.contributions) !== JSON.stringify(updatedContributions) || existingPayment.totalAmount !== totalAmount) {
              hasChanges = true;
          }
          
          if(hasChanges) {
              batch.update(paymentRef, { contributions: updatedContributions, totalAmount });
              updatedCount++;
          }

        } else {
          // --- CREATE NEW PAYMENT ---
          createdCount++;
          let contributions: DetailedPayment['contributions'];
          let totalAmount: number;

          if (isMainGroup) {
            contributions = {
              main: { amount: fixedMainAmount, paid: false },
              cash: { amount: fixedCashAmount, paid: false },
              sick: { amount: 0, paid: false },
              bereavement: { amount: 0, paid: false },
              other1: { amount: 0, paid: false },
              other2: { amount: 0, paid: false },
              other3: { amount: 0, paid: false },
            };
            totalAmount = fixedMainAmount + fixedCashAmount;
          } else {
            contributions = {
              main: { amount: group.contributionAmount, paid: false },
              cash: { amount: 0, paid: true }, // Not applicable for non-main groups
              sick: { amount: 0, paid: true },
              bereavement: { amount: 0, paid: true },
              other1: { amount: 0, paid: true },
              other2: { amount: 0, paid: true },
              other3: { amount: 0, paid: true },
            };
            totalAmount = group.contributionAmount;
          }

          const newPaymentRef = doc(collection(db, 'payments'));
          batch.set(newPaymentRef, {
            memberId,
            groupId: selectedGroup,
            dueDate,
            contributions,
            totalAmount,
            status: 'Unpaid',
          });
        }
      }
      
      await batch.commit();

      toast({
        title: "Sinkronisasi Selesai",
        description: `Iuran untuk ${format(parse(selectedMonth, 'yyyy-M', new Date()), 'MMMM yyyy', { locale: id })}: ${createdCount} dibuat, ${updatedCount} diperbarui, ${deletedCount} duplikat dihapus.`
      });

    } catch (e: any) {
      toast({ title: "Sinkronisasi Gagal", description: e.message || "Terjadi kesalahan saat sinkronisasi.", variant: "destructive" });
       console.error("Sync Error:", e);
    } finally {
      setIsGenerating(false);
    }
  }, [db, selectedGroup, selectedMonth, allGroups, toast, allMembers]);

  if (isLoadingAuth || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full pt-20">
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
               <p className="ml-4 text-muted-foreground">Memuat data keuangan...</p>
           </div>
       );
    }

    if (!mainArisanGroup) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Data Belum Lengkap</CardTitle>
                    <CardDescription>Grup utama belum ditemukan.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Harap pastikan grup 'Arisan Utama' sudah ada.</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                <CardTitle>Pengelolaan Keuangan Arisan</CardTitle>
                <CardDescription>Kelola pemasukan dan pengeluaran arisan per bulan.</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Pilih Bulan" />
                        </SelectTrigger>
                        <SelectContent>{monthOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="pemasukan">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pemasukan">Pemasukan (Iuran)</TabsTrigger>
                        <TabsTrigger value="pengeluaran">Pengeluaran</TabsTrigger>
                    </TabsList>
                    <TabsContent value="pemasukan">
                        <Card>
                            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle>Detail Iuran Bulan Ini</CardTitle>
                                    <CardDescription>Kelola status pembayaran untuk grup yang dipilih.</CardDescription>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                    <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                                    <SelectTrigger className="w-full sm:w-[280px]"><SelectValue placeholder="Pilih Grup" /></SelectTrigger>
                                    <SelectContent>{allGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <Button onClick={savePaymentChanges} className="w-full sm:w-auto">Simpan Perubahan</Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4 flex justify-end">
                                      <Button
                                          variant="outline"
                                          onClick={handleSync}
                                          disabled={isGenerating}
                                        >
                                          {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitPullRequest className="mr-2 h-4 w-4" />}
                                          Buat/Perbarui Iuran Bulan Ini
                                        </Button>
                                    </div>
                                {filteredPayments.length > 0 ? (
                                    selectedGroup === mainArisanGroup.id ? (
                                        <DetailedPaymentTable payments={filteredPayments} onPaymentChange={handleDetailedPaymentChange} onAmountChange={handleAmountChange} contributionLabels={contributionLabels} />
                                    ) : (
                                        <SimplePaymentTable payments={filteredPayments} onStatusChange={handleSimpleStatusChange} />
                                    )
                                ) : (
                                    <div className="text-center text-muted-foreground py-8 h-60 flex flex-col justify-center items-center">
                                        <p>Tidak ada data iuran untuk bulan dan grup ini.</p>
                                        <p className="text-xs mt-2">Klik tombol "Buat/Perbarui Iuran Bulan Ini" untuk membuat atau membersihkan data.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="pengeluaran">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Detail Pengeluaran</CardTitle>
                                    <CardDescription>Catat semua pengeluaran pada bulan yang dipilih.</CardDescription>
                                </div>
                                <Button onClick={handleAddExpense}><PlusCircle className="mr-2 h-4 w-4" />Tambah Pengeluaran</Button>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Tanggal</TableHead><TableHead>Deskripsi</TableHead><TableHead>Kategori</TableHead><TableHead>Jumlah</TableHead><TableHead className="text-right">Tindakan</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                    {filteredExpenses.length > 0 ? filteredExpenses.map((expense) => (
                                        <TableRow key={expense.id}>
                                        <TableCell>{format(new Date(expense.date), 'd MMMM yyyy', { locale: id })}</TableCell>
                                        <TableCell className="font-medium">{expense.description}</TableCell>
                                        <TableCell><Badge variant={expense.category === 'Sakit' ? 'destructive' : expense.category === 'Kemalangan' ? 'outline' : 'secondary'}>{expense.category}</Badge></TableCell>
                                        <TableCell>{formatCurrency(expense.amount)}</TableCell>
                                        <TableCell className="text-right">
                                            
                                                <>
                                                <Button variant="ghost" size="icon" onClick={() => handleEditExpense(expense)}><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteExpense(expense.id)}><Trash2 className="h-4 w-4" /></Button>
                                                </>
                                            
                                        </TableCell>
                                        </TableRow>
                                    )) : <TableRow><TableCell colSpan={5} className="text-center h-24">Tidak ada data pengeluaran untuk bulan ini.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
  }

  return (
    <SidebarProvider>
        <Sidebar>
            <SidebarNav />
        </Sidebar>
        <SidebarInset>
            <div className="flex flex-col min-h-screen">
                <Header title="Pengelolaan Keuangan" />
                <main className="flex-1 p-4 md:p-6 space-y-6">
                    {renderContent()}
                </main>
            </div>
            {isExpenseDialogOpen && <ExpenseDialog expense={selectedExpense} isOpen={isExpenseDialogOpen} onClose={() => setIsExpenseDialogOpen(false)} onSave={handleSaveExpense} />}
        </SidebarInset>
    </SidebarProvider>
  );
}

    