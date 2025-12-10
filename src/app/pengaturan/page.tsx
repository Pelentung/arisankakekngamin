
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, useFirestore } from '@/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ContributionSettings } from '@/app/data';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, getMonth, getYear, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';

const settingsSchema = z.object({
  main: z.coerce.number().min(0, 'Nominal tidak boleh negatif'),
  cash: z.coerce.number().min(0, 'Nominal tidak boleh negatif'),
  sick: z.coerce.number().min(0, 'Nominal tidak boleh negatif'),
  bereavement: z.coerce.number().min(0, 'Nominal tidak boleh negatif'),
  other1: z.coerce.number().min(0, 'Nominal tidak boleh negatif'),
  other2: z.coerce.number().min(0, 'Nominal tidak boleh negatif'),
  other3: z.coerce.number().min(0, 'Nominal tidak boleh negatif'),
});

const defaultAmounts: z.infer<typeof settingsSchema> = {
  main: 90000,
  cash: 10000,
  sick: 0,
  bereavement: 0,
  other1: 0,
  other2: 0,
  other3: 0,
};

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

export default function KetetapanIuranPage() {
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingSettings, setIsFetchingSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const monthOptions = useMemo(() => generateMonthOptions(), []);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: defaultAmounts,
  });

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.isAnonymous) {
        router.push('/');
      } else {
        setUser(currentUser);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [auth, router]);

  useEffect(() => {
    if (!db || !user) return;

    const fetchSettings = async () => {
      setIsFetchingSettings(true);
      const settingsRef = doc(db, 'contributionSettings', selectedMonth);
      const docSnap = await getDoc(settingsRef);

      if (docSnap.exists()) {
        form.reset(docSnap.data() as ContributionSettings);
      } else {
        // If no settings for the selected month, find the most recent one and use it as a base
        const q = query(collection(db, 'contributionSettings'), orderBy('__name__', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const mostRecentData = querySnapshot.docs[0].data();
            form.reset(mostRecentData as ContributionSettings);
        } else {
            // Fallback to hardcoded defaults if nothing is in the DB
            form.reset(defaultAmounts);
        }
      }
      setIsFetchingSettings(false);
    };

    fetchSettings();
  }, [db, user, form, selectedMonth]);

  const onSubmit = async (data: z.infer<typeof settingsSchema>) => {
    if (!db) return;
    setIsSaving(true);
    try {
      const settingsRef = doc(db, 'contributionSettings', selectedMonth);
      await setDoc(settingsRef, data, { merge: true });
      toast({
        title: 'Ketetapan Disimpan',
        description: `Nominal iuran untuk bulan ${monthOptions.find(m => m.value === selectedMonth)?.label} telah berhasil diperbarui.`,
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Gagal Menyimpan',
        description: 'Terjadi kesalahan saat menyimpan ketetapan iuran.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          <Header title="Ketetapan Iuran" />
          <main className="flex-1 p-4 md:p-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <div>
                        <CardTitle>Ketetapan Nominal Iuran</CardTitle>
                        <CardDescription>
                          Atur nominal default untuk setiap jenis iuran per bulan. Nominal ini akan digunakan saat membuat iuran baru.
                        </CardDescription>
                    </div>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Pilih Bulan" />
                        </SelectTrigger>
                        <SelectContent>{monthOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
              </CardHeader>
              <CardContent>
                {isFetchingSettings ? (
                    <div className="flex items-center justify-center h-60">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField
                            control={form.control}
                            name="main"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Iuran Utama</FormLabel>
                                <FormControl>
                                <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="cash"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Iuran Kas</FormLabel>
                                <FormControl>
                                <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="sick"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Iuran Sakit</FormLabel>
                                <FormControl>
                                <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="bereavement"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Iuran Kemalangan</FormLabel>
                                <FormControl>
                                <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="other1"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Lainnya 1</FormLabel>
                                <FormControl>
                                <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="other2"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Lainnya 2</FormLabel>
                                <FormControl>
                                <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="other3"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Lainnya 3</FormLabel>
                                <FormControl>
                                <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        </div>
                        <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                            <Save className="mr-2 h-4 w-4" />
                            )}
                            Simpan Ketetapan
                        </Button>
                        </div>
                    </form>
                    </Form>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
