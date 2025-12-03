
'use client';

import { useState } from 'react';
import { arisanData, type ContributionSettings, type OtherContribution } from '@/app/data';
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
  const [settings, setSettings] = useState<ContributionSettings>(arisanData.contributionSettings);

  const handleFixedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({
        ...prev,
        [id]: parseCurrency(value)
    }));
  };

  const handleOtherChange = (index: number, field: 'description' | 'amount', value: string | number) => {
    const newOthers = [...settings.others];
    const item = newOthers[index];
    if (field === 'description' && typeof value === 'string') {
        item.description = value;
    } else if (field === 'amount' && typeof value === 'number') {
        item.amount = value;
    }
    setSettings(prev => ({...prev, others: newOthers}));
  }

  const addOtherContribution = () => {
    const newOther = { id: `other${Date.now()}`, description: '', amount: 0 };
    setSettings(prev => ({...prev, others: [...prev.others, newOther]}));
  }

  const removeOtherContribution = (index: number) => {
    if (settings.others.length <= 1) {
        toast({
            title: "Tidak bisa menghapus",
            description: "Setidaknya harus ada satu iuran lainnya.",
            variant: "destructive"
        })
        return;
    }
    const newOthers = settings.others.filter((_, i) => i !== index);
    setSettings(prev => ({...prev, others: newOthers}));
  }

  const handleSave = () => {
    // In a real app, this would be saved to a database.
    arisanData.contributionSettings = settings;
    toast({
        title: "Pengaturan Disimpan",
        description: "Nominal iuran telah berhasil diperbarui."
    })
  };

  const fixedContributions: {key: keyof ContributionSettings, label: string}[] = [
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
