'use client';

import { useState } from 'react';
import { useAuth, useUser } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { Header } from '@/components/layout/header';
import { FinancialSummary } from '@/components/dashboard/financial-summary';
import { GroupsList } from '@/components/dashboard/groups-list';
import { WinnerHistory } from '@/components/dashboard/winner-history';
import { RealTimeClock } from '@/components/dashboard/real-time-clock';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Coins, Loader2 } from 'lucide-react';

const AuthForm = () => {
  const auth = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({
          title: 'Pendaftaran Berhasil',
          description: 'Selamat datang! Akun Anda telah dibuat.',
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'Login Berhasil', description: 'Selamat datang kembali!' });
      }
    } catch (error: any) {
      let errorMessage = 'Terjadi kesalahan. Silakan coba lagi.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email ini sudah terdaftar. Silakan login.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Password yang Anda masukkan salah.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'Pengguna tidak ditemukan. Silakan daftar terlebih dahulu.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password terlalu lemah. Gunakan minimal 6 karakter.';
      }
      toast({
        title: 'Otentikasi Gagal',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Coins className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">
            Arisan Keluarga Alm. Kakek Ngamin
          </CardTitle>
          <CardDescription>
            Silakan masuk atau daftar untuk melanjutkan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="signup"
            className="w-full"
            onValueChange={value => setIsSignUp(value === 'signup')}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signup">Daftar</TabsTrigger>
              <TabsTrigger value="login">Masuk</TabsTrigger>
            </TabsList>
            <form onSubmit={handleAuth}>
              <TabsContent value="signup">
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-signup">Email</Label>
                    <Input
                      id="email-signup"
                      type="email"
                      placeholder="email@contoh.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signup">Password</Label>
                    <Input
                      id="password-signup"
                      type="password"
                      placeholder="Minimal 6 karakter"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="login">
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-login">Email</Label>
                    <Input
                      id="email-login"
                      type="email"
                      placeholder="email@contoh.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-login">Password</Label>
                    <Input
                      id="password-login"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </TabsContent>
              <CardFooter className="flex flex-col gap-4 px-0 pt-6">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isSignUp ? 'Daftar Sekarang' : 'Masuk'}
                </Button>
              </CardFooter>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

const WelcomeScreen = () => {
    return <AuthForm />;
};

const MainDashboard = () => {
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

export default function Home() {
    const { user, loading } = useUser();

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
  
    if (!user) {
      return <WelcomeScreen />;
    }
  
    return <MainDashboard />;
}
