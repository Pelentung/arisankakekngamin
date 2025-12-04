
'use client';

import { useState, useEffect } from 'react';
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
import { Shield, PlusCircle, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { doc, setDoc, onSnapshot, Firestore } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

const parseCurrency = (value: string) => {
    return Number(value.replace(/[^0-9]/g, ''));
}


export default function AdminPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const [settings, setSettings] = useState<ContributionSettings | null>(null);

  useEffect(() => {
    if (!db) return;
    const docRef = doc(db, 'contributionSettings', 'default');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as ContributionSettings);
      } else {
        // Initialize with default if not exists
        setSettings({
          main: 50000,
          cash: 10000,
          sick: 5000,
          bereavement: 5000,
          others: [{ id: 'other1', description: 'Iuran Lainnya', amount: 0 }],
        });
      }
    },
    (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
    return () => unsubscribe();
  }, [db]);

  if (!settings) {
    return (
        <div className="flex flex-col min-h-screen">
          <Header title="Halaman Admin" />
          <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
            <p>Loading settings...</p>
          </main>
        </div>
      );
  }


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
    const docRef = doc(db, "contributionSettings", "default");
    
    setDoc(docRef, settings)
      .then(() => {
          toast({
              title: "Pengaturan Disimpan",
              description: "Nominal iuran telah berhasil diperbarui di Firestore."
          })
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
    <>
      <div className="flex flex-col min-h-screen">
        <Header title="Halaman Admin" />
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Shield className="h-8 w-8 text-primary"/>
                    <div>
                        <CardTitle>Pengaturan Nominal Iuran</CardTitle>
                        <CardDescription>
                            Atur jumlah nominal yang harus dibayarkan anggota untuk setiap jenis iuran.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
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
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
