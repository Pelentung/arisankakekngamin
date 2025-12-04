
'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { FinancialSummary } from '@/components/dashboard/financial-summary';
import { GroupsList } from '@/components/dashboard/groups-list';
import { WinnerHistory } from '@/components/dashboard/winner-history';
import { RealTimeClock } from '@/components/dashboard/real-time-clock';
import { useUser } from '@/firebase';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const AuthForm = () => {
    const { toast } = useToast();
    const auth = getAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (isSignUp: boolean) => {
        setLoading(true);
        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
                toast({ title: "Pendaftaran Berhasil", description: "Selamat datang! Anda sekarang sudah login." });
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                toast({ title: "Login Berhasil", description: "Selamat datang kembali!" });
            }
        } catch (error: any) {
            console.error("Authentication error:", error);
            const errorMessage = error.code === 'auth/user-not-found' ? 'Pengguna tidak ditemukan.' :
                                 error.code === 'auth/wrong-password' ? 'Password salah.' :
                                 error.code === 'auth/email-already-in-use' ? 'Email sudah terdaftar.' :
                                 'Terjadi kesalahan. Silakan coba lagi.';
            toast({
                title: "Otentikasi Gagal",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Tabs defaultValue="login" className="w-full max-w-sm">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Masuk</TabsTrigger>
                <TabsTrigger value="signup">Daftar</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                <Card>
                    <CardHeader>
                        <CardTitle>Login</CardTitle>
                        <CardDescription>Masuk ke akun Anda untuk melanjutkan.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="login-email">Email</Label>
                            <Input id="login-email" type="email" placeholder="email@contoh.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="login-password">Password</Label>
                            <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <Button onClick={() => handleAuth(false)} disabled={loading} className="w-full">
                            {loading ? 'Memproses...' : 'Login'}
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="signup">
                <Card>
                    <CardHeader>
                        <CardTitle>Daftar</CardTitle>
                        <CardDescription>Buat akun baru jika Anda belum punya.</CardDescription>
                    </CardHeader>
                     <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="signup-email">Email</Label>
                            <Input id="signup-email" type="email" placeholder="email@contoh.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signup-password">Password</Label>
                            <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <Button onClick={() => handleAuth(true)} disabled={loading} className="w-full">
                            {loading ? 'Memproses...' : 'Daftar'}
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
};


const WelcomeScreen = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] -mt-16">
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-blue-500 sm:text-4xl mb-4">
                Selamat Datang di Aplikasi Arisan
            </h1>
            <p className="text-muted-foreground mb-8 text-center">
                Silakan login untuk melanjutkan atau daftar jika Anda pengguna baru.
            </p>
            <AuthForm />
        </div>
    )
}

export default function Home() {
  const { user, loading } = useUser();

  if (loading) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Menu Utama" />
            <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
                <p>Memuat...</p>
            </main>
        </div>
    );
  }

  if (!user) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Menu Utama" />
            <main className="flex-1 p-4 md:p-6 space-y-6">
                <WelcomeScreen />
            </main>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Menu Utama" />
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h1 className="font-headline text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-blue-500 sm:text-3xl">
            ARISAN KELUARGA BESAR Alm. KAKEK NGAMIN
            </h1>
            <RealTimeClock />
        </div>
        
        <FinancialSummary />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3">
            <GroupsList />
          </div>
        </div>

        <WinnerHistory />
      </main>
    </div>
  );
}
