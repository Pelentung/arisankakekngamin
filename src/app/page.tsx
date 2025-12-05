
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  getAuth,
  signInWithEmailAndPassword,
  signInAnonymously,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
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
import { Loader2, ShieldQuestion, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { UserDashboard } from '@/components/dashboard/user-dashboard';

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { auth } = initializeFirebase();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const handleUserLogin = async () => {
    if (!email || !password) {
      toast({
        title: 'Login Gagal',
        description: 'Email dan kata sandi harus diisi.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Login Berhasil',
        description: 'Selamat datang kembali!',
      });
      // onAuthStateChanged will handle the state update and dashboard rendering
    } catch (error: any) {
      toast({
        title: 'Login Gagal',
        description: 'Email atau kata sandi salah. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signInAnonymously(auth);
      toast({
        title: 'Login Tamu Berhasil',
        description: 'Anda masuk sebagai tamu.',
      });
    } catch (error) {
      toast({
        title: 'Login Gagal',
        description: 'Tidak dapat masuk sebagai tamu saat ini.',
        variant: 'destructive',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };
  
    if (isLoading) {
        return (
          <div className="flex min-h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        );
    }


  if (user && !user.isAnonymous) {
    // Regular user is logged in, show the admin dashboard
    return <AdminDashboard />;
  }
  
  if (user && user.isAnonymous) {
    // Guest user is logged in, show the guest dashboard
    return <UserDashboard />;
  }

  // If no user, show the login form
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 overflow-x-hidden">
      <div className="mb-8 flex w-full flex-col items-center text-center">
        <div className="mb-4 rounded-lg bg-primary/20 h-16 w-16 overflow-hidden">
            <Image src="https://i.imgur.com/Euyh8nM.png" alt="App Logo" width={64} height={64} className="object-cover w-full h-full"/>
        </div>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight sm:text-4xl animate-shimmer bg-[linear-gradient(110deg,hsl(var(--primary)),45%,hsl(var(--accent)),55%,hsl(var(--primary)))] bg-[length:200%_100%] bg-clip-text text-transparent">
          ARISAN KELUARGA BESAR Alm. KAKEK NGAMIN
        </h1>
        <div className="w-full overflow-hidden">
            <p className="animate-marquee-slow whitespace-nowrap">
              <span className="animate-shimmer bg-[linear-gradient(110deg,hsl(var(--muted-foreground)),45%,hsl(var(--foreground)),55%,hsl(var(--muted-foreground)))] bg-[length:200%_100%] bg-clip-text text-transparent font-bold">Indahnya Tali Persaudaraan</span>
            </p>
        </div>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Masuk sebagai Pengguna untuk mengelola data atau sebagai Tamu untuk
            melihat laporan.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@contoh.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoggingIn}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Kata Sandi</Label>            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoggingIn}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            className="w-full"
            onClick={handleUserLogin}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserIcon className="mr-2 h-4 w-4" />
            )}
            Masuk sebagai Pengguna
          </Button>
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Atau</span>
            </div>
          </div>
          <Button
            variant="secondary"
            className="w-full"
            onClick={handleGuestLogin}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShieldQuestion className="mr-2 h-4 w-4" />
            )}
            Masuk sebagai Tamu
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
