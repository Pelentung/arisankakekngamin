
'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { DetailedPayment, Member, Group, ContributionSettings, Expense } from '@/app/data';
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
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useAuth } from '@/firebase';
import { doc, writeBatch, collection, getDocs, query, where, addDoc, updateDoc, deleteDoc, getDoc, runTransaction } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { format, getMonth, getYear, startOfMonth, endOfMonth, subMonths, parse } from 'date-fns';
import { id } from 'date-fns/locale';
import { MoreHorizontal, PlusCircle, Loader2, Edit, RefreshCw } from 'lucide-react';
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
const DetailedPaymentTable = ({ payments, onPaymentChange, contributionLabels }: { payments: (DetailedPayment & { member?: Member })[], onPaymentChange: (paymentId: string, contributionType: keyof DetailedPayment['contributions'], isPaid: boolean) => void, contributionLabels: Record<string, string>}) => {
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
                const contribution = payment.contributions[type as keyof DetailedPayment['contributions']];
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

const ExpenseDialog = ({ expense, isOpen, onClose, onSave, categories }: { expense: Partial<Expense> | null, isOpen: boolean, onClose: () => void, onSave: (expense: Omit<Expense, 'id'>, id?: string) => void, categories: string[] }) => {
  const [formData, setFormData] = useState<Partial<Expense> | null>(expense);
  const { toast } = useToast();

  useEffect(() => { setFormData(expense); }, [expense]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, [e.target.id]: Number(e.target.value) }));
  const handleCategoryChange = (value: string) => setFormData(prev => ({ ...prev, category: value }));

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
                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
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
  const [contributionSettings, setContributionSettings] = useState<ContributionSettings | null>(null);
  const [mainArisanGroup, setMainArisanGroup] = useState<Group | null>(null);

  // Page state
  const monthOptions = useMemo(() => generateMonthOptions(), []);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);
  const [selectedGroup, setSelectedGroup] = useState<string | undefined>(undefined);
  const [localChanges, setLocalChanges] = useState<DetailedPayment[]>([]);
  
  // Expenses Dialog
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Partial<Expense> | null>(null);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

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

  // Data fetching
  useEffect(() => {
    if (!db || !user) return;
    
    const dataLoaded = { payments: false, members: false, groups: false, expenses: false };
    const checkAllDataLoaded = () => {
        if (Object.values(dataLoaded).every(Boolean)) {
            setIsLoading(false);
        }
    };

    const unsubPayments = subscribeToData(db, 'payments', (data) => { 
        setAllPayments(data as DetailedPayment[]); 
        setLocalChanges(data as DetailedPayment[]);
        dataLoaded.payments = true; checkAllDataLoaded();
    });
    const unsubMembers = subscribeToData(db, 'members', (data) => { 
        setAllMembers(data as Member[]); 
        dataLoaded.members = true; checkAllDataLoaded(); 
    });
    const unsubExpenses = subscribeToData(db, 'expenses', (data) => { 
        setAllExpenses(data as Expense[]); 
        dataLoaded.expenses = true; checkAllDataLoaded(); 
    });
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
      dataLoaded.groups = true; checkAllDataLoaded();
    });

    return () => { 
        unsubPayments(); unsubMembers(); unsubGroups(); unsubExpenses(); 
    };
  }, [db, user, selectedGroup]); 
  
  // Fetch contribution settings based on selected month
  useEffect(() => {
    if (!db || !selectedMonth || !user) return;

    const fetchSettings = async () => {
        const docId = selectedMonth.split('-').join('-');
        const docRef = doc(db, 'contributionSettings', docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            setContributionSettings(docSnap.data() as ContributionSettings);
        } else {
             // Fallback to last month's settings
            const lastMonthDate = subMonths(new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1])), 1);
            const lastMonthId = `${getYear(lastMonthDate)}-${getMonth(lastMonthDate)}`;
            const lastMonthDocRef = doc(db, 'contributionSettings', lastMonthId);
            const lastMonthSnap = await getDoc(lastMonthDocRef);

            if (lastMonthSnap.exists()) {
                setContributionSettings(lastMonthSnap.data() as ContributionSettings);
                toast({ title: "Info", description: `Pengaturan untuk bulan ini tidak ditemukan, menggunakan pengaturan dari ${format(lastMonthDate, 'MMMM yyyy', {locale: id})}.`});
            } else {
                // Fallback to default if no monthly setting exists
                toast({ title: "Peringatan", description: `Pengaturan iuran untuk bulan ini tidak ditemukan, harap atur di halaman Ketetapan Iuran.`, variant: "destructive" });
                setContributionSettings(null);
            }
        }
    }
    fetchSettings();
  }, [db, selectedMonth, toast, user]);

const ensurePaymentsExistForMonth = useCallback(async () => {
    setIsGenerating(true);
    try {
        if (!db) {
            throw new Error("Koneksi database belum siap.");
        }
        if (!selectedGroup) {
            throw new Error("Silakan pilih grup terlebih dahulu.");
        }

        await runTransaction(db, async (transaction) => {
            if (!selectedGroup) throw new Error("Grup belum dipilih.");
            if (!contributionSettings) throw new Error("Pengaturan iuran untuk bulan ini belum ada. Silakan atur di halaman 'Ketetapan Iuran'.");

            const group = allGroups.find(g => g.id === selectedGroup);
            if (!group) throw new Error("Grup tidak ditemukan");

            const settingsForMonth = contributionSettings;
            if (!settingsForMonth) throw new Error("Pengaturan iuran untuk bulan ini tidak ditemukan.");
            
            const [year, month] = selectedMonth.split('-').map(Number);
            
            const paymentsQuery = query(collection(db, 'payments'), where('groupId', '==', selectedGroup));
            const querySnapshot = await transaction.get(paymentsQuery);

            const paymentsForGroup = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DetailedPayment));
            const paymentsForMonth = paymentsForGroup.filter(p => {
                const paymentDate = new Date(p.dueDate);
                return getYear(paymentDate) === year && getMonth(paymentDate) === month;
            });

            const existingMemberIds = new Set(paymentsForMonth.map(p => p.memberId));
            let newPaymentsCount = 0;
            let updatedPaymentsCount = 0;

            // Check existing payments for correctness
            paymentsForMonth.forEach(payment => {
                let needsUpdate = false;
                let newContributions: any = {};
                let newTotalAmount = 0;

                if (group.id === mainArisanGroup?.id) {
                    newContributions.main = { amount: settingsForMonth.main, paid: payment.contributions.main?.paid || false };
                    newContributions.cash = { amount: settingsForMonth.cash, paid: payment.contributions.cash?.paid || false };
                    newContributions.sick = { amount: settingsForMonth.sick, paid: payment.contributions.sick?.paid || false };
                    newContributions.bereavement = { amount: settingsForMonth.bereavement, paid: payment.contributions.bereavement?.paid || false };
                    settingsForMonth.others.forEach(other => {
                        newContributions[other.id] = { amount: other.amount, paid: payment.contributions[other.id]?.paid || false };
                    });
                    newTotalAmount = Object.values(newContributions).reduce((sum: number, c: any) => sum + c.amount, 0);
                } else {
                    newTotalAmount = group.contributionAmount;
                    newContributions.main = { amount: newTotalAmount, paid: payment.contributions.main?.paid || false };
                }
                
                const currentTotalAmount = Object.values(payment.contributions).reduce((sum: number, c: any) => sum + c.amount, 0);
                if (newTotalAmount !== currentTotalAmount) {
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    const paymentRef = doc(db, 'payments', payment.id);
                    const recalculatedTotal = Object.values(newContributions).reduce((sum: number, c: any) => sum + c.amount, 0);
                    const updatedStatus = Object.values(newContributions).every((c: any) => c.paid) ? 'Paid' : 'Unpaid';
                    transaction.update(paymentRef, { 
                        contributions: newContributions, 
                        totalAmount: recalculatedTotal,
                        status: updatedStatus
                    });
                    updatedPaymentsCount++;
                }
            });
            
            // Create new payments for members not in the list
            group.memberIds.forEach(memberId => {
                if (!existingMemberIds.has(memberId)) {
                    let contributions: any = {};
                    let totalAmount = 0;
                    const targetDate = new Date(year, month);
                    const dueDate = endOfMonth(targetDate).toISOString();
            
                    if (group.id === mainArisanGroup?.id) {
                        contributions.main = { amount: settingsForMonth.main, paid: false };
                        contributions.cash = { amount: settingsForMonth.cash, paid: false };
                        contributions.sick = { amount: settingsForMonth.sick, paid: false };
                        contributions.bereavement = { amount: settingsForMonth.bereavement, paid: false };
                        settingsForMonth.others.forEach(other => {
                            contributions[other.id] = { amount: other.amount, paid: false };
                        });
                        totalAmount = Object.values(contributions).reduce((sum: number, c: any) => sum + c.amount, 0);
                    } else {
                        totalAmount = group.contributionAmount;
                        contributions.main = { amount: totalAmount, paid: false };
                    }
            
                    const newPaymentDoc = doc(collection(db, 'payments'));
                    transaction.set(newPaymentDoc, { memberId, groupId: group.id, dueDate, contributions, totalAmount, status: 'Unpaid' });
                    newPaymentsCount++;
                }
            });

            if (newPaymentsCount > 0 || updatedPaymentsCount > 0) {
                let descriptions = [];
                if (newPaymentsCount > 0) descriptions.push(`${newPaymentsCount} catatan iuran baru dibuat.`);
                if (updatedPaymentsCount > 0) descriptions.push(`${updatedPaymentsCount} catatan iuran diperbarui.`);
                toast({
                    title: "Sinkronisasi Selesai",
                    description: descriptions.join(' '),
                });
            } else {
                toast({
                    title: "Sinkronisasi Selesai",
                    description: "Tidak ada catatan iuran baru yang perlu dibuat atau diperbarui.",
                });
            }
        });
    } catch (error: any) {
        console.error("Error ensuring payments exist:", error);
        toast({ title: "Sinkronisasi Gagal", description: error.message, variant: "destructive" });
        if (!(error instanceof FirestorePermissionError)) {
             errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'payments (transaction)', operation: 'write' }));
        }
    } finally {
        setIsGenerating(false);
    }
}, [db, selectedGroup, selectedMonth, allGroups, allMembers, mainArisanGroup, contributionSettings, toast]);
  
  // Filtered data for display
  const filteredPayments = useMemo(() => {
    const group = allGroups.find(g => g.id === selectedGroup);
    if (!group) return [];

    const [year, month] = selectedMonth.split('-').map(Number);
    return localChanges
      .filter(p => {
        const paymentDate = new Date(p.dueDate);
        return p.groupId === selectedGroup &&
               getYear(paymentDate) === year &&
               getMonth(paymentDate) === month &&
               group.memberIds.includes(p.memberId);
      })
      .map(p => ({ ...p, member: allMembers.find(m => m.id === p.memberId) }))
      .filter(p => p.member);
  }, [localChanges, selectedGroup, selectedMonth, allMembers, allGroups]);

  const filteredExpenses = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return allExpenses.filter(e => {
        const expenseDate = new Date(e.date);
        return getYear(expenseDate) === year && getMonth(expenseDate) === month;
    });
  }, [allExpenses, selectedMonth]);

  const contributionLabels = useMemo(() => {
    if (!contributionSettings) return {};
    const labels: Record<string, string> = { main: 'Iuran Utama', cash: 'Iuran Kas', sick: 'Iuran Sakit', bereavement: 'Iuran Kemalangan' };
    contributionSettings.others.forEach(other => { labels[other.id] = other.description; });
    return labels;
  }, [contributionSettings]);

  const expenseCategories = useMemo(() => {
    return ["Talangan Kas", "Sakit", "Kemalangan", "Lainnya"];
  }, []);

  // Payment handlers
  const handleDetailedPaymentChange = (paymentId: string, contributionType: keyof DetailedPayment['contributions'], isPaid: boolean) => {
    setLocalChanges(prev =>
      prev.map(p => {
        if (p.id !== paymentId) return p;

        const updatedContributions = { 
          ...p.contributions, 
          [contributionType]: { ...p.contributions[contributionType], paid: isPaid } 
        };
        
        const allContributionsPaid = Object.values(updatedContributions).every(c => c.paid);
        
        return { 
          ...p, 
          contributions: updatedContributions,
          status: allContributionsPaid ? 'Paid' : 'Unpaid',
        };
      })
    );
  };

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
                                    <Button onClick={ensurePaymentsExistForMonth} disabled={isGenerating} className="w-full sm:w-auto">
                                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                        Sinkronkan Iuran
                                    </Button>
                                    <Button onClick={savePaymentChanges} className="w-full sm:w-auto">Simpan Perubahan</Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isGenerating ? (
                                        <div className="flex items-center justify-center h-60">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        <p className="ml-3 text-muted-foreground">Menyinkronkan data iuran...</p>
                                    </div>
                                ) : filteredPayments.length > 0 ? (
                                    selectedGroup === mainArisanGroup.id ? (
                                        <DetailedPaymentTable payments={filteredPayments} onPaymentChange={handleDetailedPaymentChange} contributionLabels={contributionLabels} />
                                    ) : (
                                        <SimplePaymentTable payments={filteredPayments} onStatusChange={handleSimpleStatusChange} />
                                    )
                                ) : (
                                    <div className="text-center text-muted-foreground py-8 h-60 flex flex-col justify-center items-center">
                                        <p>Tidak ada data iuran untuk ditampilkan.</p>
                                        <p className="text-xs mt-2">Pastikan anggota sudah ditambahkan ke grup, lalu klik 'Sinkronkan Iuran'.</p>
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
                                        <TableCell><Badge variant={expense.category === 'Iuran Sakit' ? 'destructive' : expense.category === 'Iuran Kemalangan' ? 'outline' : 'secondary'}>{expense.category}</Badge></TableCell>
                                        <TableCell>{formatCurrency(expense.amount)}</TableCell>
                                        <TableCell className="text-right">
                                            
                                                <>
                                                <Button variant="ghost" size="icon" onClick={() => handleEditExpense(expense)}><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteExpense(expense.id)}><MoreHorizontal className="h-4 w-4" /></Button>
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
            {isExpenseDialogOpen && <ExpenseDialog expense={selectedExpense} isOpen={isExpenseDialogOpen} onClose={() => setIsExpenseDialogOpen(false)} onSave={handleSaveExpense} categories={expenseCategories} />}
        </SidebarInset>
    </SidebarProvider>
  );
}
