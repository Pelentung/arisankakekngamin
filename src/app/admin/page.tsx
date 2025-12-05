
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { ContributionSettings, OtherContribution } from '@/app/data';
import { Header } from '@/components/layout/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, PlusCircle, Trash2, Loader2, CalendarIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subMonths, getYear, getMonth } from 'date-fns';
import { id } from 'date-fns/locale';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

const parseCurrency = (value: string) => {
    return Number(value.replace(/[^0-9]/g, ''));
}

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

export default function AdminPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const [settings, setSettings] = useState<ContributionSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const monthOptions = useMemo(() => generateMonthOptions(), []);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);

  useEffect(() => {
    if (!db) return;

    setIsLoading(true);
    const docId = selectedMonth;
    const docRef = doc(db, 'contributionSettings', docId);

    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as ContributionSettings);
        setIsLoading(false);
      } else {
        // If settings for the selected month don't exist, try to fetch last month's
        const lastMonthDate = subMonths(new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1])), 1);
        const lastMonthId = `${getYear(lastMonthDate)}-${getMonth(lastMonthDate)}`;
        const lastMonthDocRef = doc(db, 'contributionSettings', lastMonthId);
        const lastMonthSnap = await getDoc(lastMonthDocRef);
        
        let initialSettings;
        if (lastMonthSnap.exists()) {
            initialSettings = lastMonthSnap.data() as ContributionSettings;
        } else {
            // Absolute fallback
            initialSettings = {
                main: 50000,
                cash: 10000,
                sick: 5000,
                bereavement: 5000,
                others: [{ id: 'other1', description: 'Iuran Lainnya', amount: 0 }],
            };
        }
        setSettings(initialSettings);
        setIsLoading(false);
      }
    },
    (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [db, selectedMonth]);

  const handleFixedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setSettings(prev => prev ? ({
        ...prev,
        [id]: parseCurrency(value)
    }) : null);
  };

  const handleOtherChange = (index: number, field: 'description' | 'amount', value: string | number) => {
    if (!settings) return;
    const newOthers = [...settings.others];
    const item = newOthers[index];
    if (field === 'description' && typeof value === 'string') {
        item.description = value;
    } else if (field === 'amount' && typeof value === 'number') {
        item.amount = value;
    }
    setSettings(prev => prev ? ({...prev, others: newOthers}) : null);
  }

  const addOtherContribution = () => {
    if (!settings) return;
    const newOther = { id: `other${Date.now()}`, description: '', amount: 0 };
    setSettings(prev => prev ? ({...prev, others: [...prev.others, newOther]}) : null);
  }

  const removeOtherContribution = (index: number) => {
    if (!settings || settings.others.length <= 1) {
        toast({
            title: "Tidak bisa menghapus",
            description: "Setidaknya harus ada satu iuran lainnya.",
            variant: "destructive"
        })
        return;
    }
    const newOthers = settings.others.filter((_, i) => i !== index);
    setSettings(prev => prev ? ({...prev, others: newOthers}) : null);
  }

  const handleSave = () => {
    if (!db || !settings) return;
    const docId = selectedMonth;
    const docRef = doc(db, "contributionSettings", docId);
    
    setDoc(docRef, settings, { merge: true })
      .then(() => {
        toast({
            title: "Pengaturan Disimpan",
            description: `Nominal iuran untuk ${format(new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1])), 'MMMM yyyy', { locale: id })} telah berhasil diperbarui.`,
        });
      })
      .catch((serverError) => {
          const permissionError = new FirestorePermissionError({
              path: docRef.path,
              operation: 'write',
              requestResourceData: settings,
          });
          errorEmitter.emit('permission-error', permissionError);
      });
  };

  const fixedContributions: {key: keyof Omit<ContributionSettings, 'others'>, label: string}[] = [
      { key: 'main', label: 'Iuran Utama' },
      { key: 'cash', label: 'Iuran Kas' },
      { key: 'sick', label: 'Iuran Sakit' },
      { key: 'bereavement', label: 'Iuran Kemalangan' },
  ];

  return (
    <SidebarProvider>
        <Sidebar>
            <SidebarNav />
        </Sidebar>
        <SidebarInset>
            <div className="flex flex-col min-h-screen">
                <Header title="Ketetapan Iuran" />
                <main className="flex-1 p-4 md:p-6 space-y-6">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                            <div className="flex items-center gap-4">
                                <Shield className="h-8 w-8 text-primary"/>
                                <div>
                                    <CardTitle>Pengaturan Nominal Iuran</CardTitle>
                                    <CardDescription>
                                        Atur nominal iuran yang berlaku untuk bulan yang dipilih.
                                    </CardDescription>
                                </div>
                            </div>
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-full sm:w-[200px]">
                                    <SelectValue placeholder="Pilih Bulan" />
                                </SelectTrigger>
                                <SelectContent>{monthOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-60">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-4 text-muted-foreground">Memuat pengaturan...</p>
                        </div>
                    ) : !settings ? (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground">Tidak dapat memuat pengaturan.</p>
                        </div>
                    ) : (
                        <>
                            <div className='space-y-4'>
                                {fixedContributions.map(({key, label}) => (
                                    <div key={key} className="grid grid-cols-3 items-center gap-4">
                                    <Label htmlFor={key} className="">
                                        {label}
                                    </Label>
                                    <Input 
                                        id={key} 
                                        type="text" 
                                        value={formatCurrency(settings[key] as number).replace('Rp', '').trim()} 
                                        onChange={handleFixedChange}
                                        className="col-span-2"
                                    />
                                    </div>
                                ))}
                            </div>

                            <Separator />

                            <div className='space-y-4'>
                                <Label className='font-semibold'>Iuran Lainnya</Label>
                                {settings.others.map((other, index) => (
                                    <div key={other.id} className="grid grid-cols-1 md:grid-cols-8 gap-2 items-center">
                                        <Input
                                            placeholder="Keterangan"
                                            value={other.description}
                                            onChange={(e) => handleOtherChange(index, 'description', e.target.value)}
                                            className="md:col-span-4"
                                        />
                                        <Input
                                            type="text"
                                            placeholder="Nominal"
                                            value={formatCurrency(other.amount).replace('Rp', '').trim()}
                                            onChange={(e) => handleOtherChange(index, 'amount', parseCurrency(e.target.value))}
                                            className="md:col-span-3"
                                        />
                                        <Button variant="ghost" size="icon" onClick={() => removeOtherContribution(index)} className="text-destructive hover:text-destructive-foreground hover:bg-destructive justify-self-end">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button variant="outline" onClick={addOtherContribution} className="w-full">
                                    <PlusCircle className="mr-2 h-4 w-4"/>
                                    Tambah Iuran Lainnya
                                </Button>
                            </div>
                            <Button onClick={handleSave} className="w-full mt-6">Simpan Pengaturan</Button>
                        </>
                    )}
                    </CardContent>
                </Card>
                </main>
            </div>
        </SidebarInset>
    </SidebarProvider>
  );
}
