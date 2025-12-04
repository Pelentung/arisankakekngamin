
'use client';

import { useState, useEffect } from 'react';
import type { Expense } from '@/app/data';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore } from '@/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const ExpenseDialog = ({
  expense,
  isOpen,
  onClose,
  onSave,
}: {
  expense: Partial<Expense> | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<Expense, 'id'>, id?: string) => void;
}) => {
  const [formData, setFormData] = useState<Partial<Expense> | null>(expense);
  const { toast } = useToast();

  useEffect(() => {
    setFormData(expense);
  }, [expense]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({...prev, [id]: Number(value) }));
  }

  const handleCategoryChange = (value: Expense['category']) => {
    setFormData(prev => ({...prev, category: value}));
  }

  const handleSave = () => {
    if (!formData?.description || !formData?.date || !formData?.amount || !formData?.category) {
        toast({
            title: "Data Tidak Lengkap",
            description: "Semua field harus diisi.",
            variant: "destructive",
        });
      return;
    }
    
    const newExpenseData: Omit<Expense, 'id'> = {
      description: formData.description,
      date: formData.date,
      amount: formData.amount,
      category: formData.category,
    };
    onSave(newExpenseData, formData.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{expense?.id ? 'Ubah Pengeluaran' : 'Tambah Pengeluaran Baru'}</DialogTitle>
          <DialogDescription>
            {expense?.id
              ? 'Ubah detail pengeluaran di bawah ini.'
              : 'Isi detail untuk pengeluaran baru.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Tanggal
            </Label>
            <Input id="date" type="date" value={formData?.date || ''} onChange={handleChange} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Deskripsi
            </Label>
            <Textarea id="description" value={formData?.description || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Kategori
            </Label>
             <Select value={formData?.category} onValueChange={handleCategoryChange}>
              <SelectTrigger id="category" className="col-span-3">
                <SelectValue placeholder="Pilih Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sakit">Anggota Sakit</SelectItem>
                <SelectItem value="Kemalangan">Anggota Kemalangan</SelectItem>
                <SelectItem value="Lainnya">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Jumlah
            </Label>
            <Input id="amount" type="number" value={formData?.amount || ''} onChange={handleAmountChange} className="col-span-3" placeholder="Contoh: 50000" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSave}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export default function ExpensesPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Partial<Expense> | null>(null);

  useEffect(() => {
    if (!db) return;
    const unsubscribe = subscribeToData(db, 'expenses', (data) => setExpenses(data as Expense[]));
    return () => unsubscribe();
  }, [db]);

  const handleAdd = () => {
    setSelectedExpense({ date: format(new Date(), 'yyyy-MM-dd')});
    setIsDialogOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDialogOpen(true);
  };
  
  const handleDelete = (expenseId: string) => {
    if (!db) return;
    const docRef = doc(db, 'expenses', expenseId);
    deleteDoc(docRef)
        .then(() => {
            toast({
                title: "Pengeluaran Dihapus",
                description: "Data pengeluaran telah berhasil dihapus.",
            });
        })
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  const handleSave = (expenseData: Omit<Expense, 'id'>, id?: string) => {
    if (!db) return;
    if (id) {
        const docRef = doc(db, 'expenses', id);
        updateDoc(docRef, expenseData)
            .then(() => {
                toast({ title: "Pengeluaran Diperbarui", description: "Data pengeluaran telah diperbarui." });
                setIsDialogOpen(false);
            })
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'update',
                    requestResourceData: expenseData,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    } else {
        addDoc(collection(db, 'expenses'), expenseData)
            .then(() => {
                toast({ title: "Pengeluaran Ditambahkan", description: "Data pengeluaran baru telah ditambahkan." });
                setIsDialogOpen(false);
            })
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: 'expenses',
                    operation: 'create',
                    requestResourceData: expenseData,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header title="Pengeluaran" />
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Kelola Pengeluaran Arisan</CardTitle>
                    <CardDescription>
                        Catat semua pengeluaran yang terjadi dalam kegiatan arisan.
                    </CardDescription>
                </div>
                <Button onClick={handleAdd}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Tambah Pengeluaran
                </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead className="text-right">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {format(new Date(expense.date), 'd MMMM yyyy', { locale: id })}
                      </TableCell>
                       <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>
                        <Badge variant={
                            expense.category === 'Sakit' ? 'destructive' : 
                            expense.category === 'Kemalangan' ? 'outline' : 'secondary'
                        }>{expense.category}</Badge>
                      </TableCell>
                       <TableCell>{formatCurrency(expense.amount)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Tindakan</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Tindakan</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEdit(expense)}>Ubah</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleDelete(expense.id)}>Hapus</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
      
      {isDialogOpen && (
        <ExpenseDialog
          expense={selectedExpense}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}
