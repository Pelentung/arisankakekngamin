
'use client';

import { useState } from 'react';
import { arisanData, type ContributionSettings } from '@/app/data';
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
import { Shield } from 'lucide-react';

const contributionLabels: Record<keyof ContributionSettings, string> = {
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


export default function AdminPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<ContributionSettings>(arisanData.contributionSettings);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({
        ...prev,
        [id]: Number(value.replace(/[^0-9]/g, ''))
    }));
  };

  const handleSave = () => {
    // In a real app, this would be saved to a database.
    // For this demo, we'll update the mock data object.
    arisanData.contributionSettings = settings;
    toast({
        title: "Pengaturan Disimpan",
        description: "Nominal iuran telah berhasil diperbarui."
    })
  };

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
            <CardContent className="space-y-4">
              {(Object.keys(contributionLabels) as (keyof ContributionSettings)[]).map((key) => (
                <div key={key} className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor={key} className="">
                    {contributionLabels[key]}
                  </Label>
                  <Input 
                    id={key} 
                    type="text" 
                    value={formatCurrency(settings[key]).replace('Rp', '').trim()} 
                    onChange={handleChange}
                    className="col-span-2"
                  />
                </div>
              ))}

              <Button onClick={handleSave} className="w-full mt-6">Simpan Pengaturan</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
