'use client';

import { useState } from 'react';
import { arisanData, type Expense } from '@/app/data';
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
import { MoreHorizontal, PlusCircle, Receipt } from 'lucide-react';
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

const ExpenseDialog = ({
  expense,
  isOpen,
  onClose,
  onSave,
}: {
  expense: Partial<Expense> | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
}) => {
  const [formData, setFormData] = useState<Partial<Expense> | null>(expense);
  const { toast } = useToast();

  React.useEffect(() => {
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
    
    const newExpense: Expense = {
      id: formData.id || `e${arisanData.expenses.length + 1}`,
      description: formData.description,
      date: formData.date,
      amount: formData.amount,
      category: formData.category,
    };
    onSave(newExpense);
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
  const [expenses, setExpenses] = useState<Expense[]>(arisanData.expenses);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Partial<Expense> | null>(null);

  const handleAdd = () => {
    setSelectedExpense({ date: format(new Date(), 'yyyy-MM-dd')});
    setIsDialogOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDialogOpen(true);
  };
  
  const handleDelete = (expenseId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
    toast({
        title: "Pengeluaran Dihapus",
        description: "Data pengeluaran telah berhasil dihapus.",
    });
  };

  const handleSave = (expense: Expense) => {
    const isNew = !expense.id.startsWith('e') || !expenses.some(e => e.id === expense.id);
    if (isNew) {
        const newExpense = { ...expense, id: `e${Math.random()}`}; 
        setExpenses(prev => [...prev, newExpense]);
        toast({ title: "Pengeluaran Ditambahkan", description: "Data pengeluaran baru telah ditambahkan." });
    } else {
        setExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));
        toast({ title: "Pengeluaran Diperbarui", description: "Data pengeluaran telah diperbarui." });
    }
    setIsDialogOpen(false);
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
