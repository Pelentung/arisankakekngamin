'use client';

import { useState } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useAuth } from '@/firebase';
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
import { Coins } from 'lucide-react';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { UserDashboard } from '@/components/dashboard/user-dashboard';

function AuthenticationForm() {
  const auth = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (isSignUp: boolean) => {
    setIsLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({
          title: 'Pendaftaran Berhasil',
          description: 'Selamat datang! Anda sekarang sudah login.',
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'Login Berhasil' });
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast({
        title: 'Otentikasi Gagal',
        description:
          error.code === 'auth/invalid-credential'
            ? 'Email atau password salah.'
            : error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Tabs defaultValue="login" className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
            <div className="flex items-center gap-3 p-2">
                <div className="p-2 rounded-lg bg-primary/20 text-primary">
                    <Coins className="h-8 w-8" />
                </div>
                <div>
                    <h1 className="font-headline text-lg font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-blue-500">
                        ARISAN KELUARGA BESAR
                    </h1>
                    <p className="text-sm text-muted-foreground -mt-1">Alm. Kakek Ngamin</p>
                </div>
            </div>
        </div>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Masuk</TabsTrigger>
          <TabsTrigger value="signup">Daftar</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>Masuk</CardTitle>
              <CardDescription>
                Masuk ke akun Anda untuk melanjutkan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handleAuth(false)}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Masuk'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle>Daftar</CardTitle>
              <CardDescription>
                Buat akun baru untuk mulai menggunakan aplikasi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handleAuth(true)}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Daftar'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


export default function HomePage() {
    const { user, loading } = useUser();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>Memuat...</p>
            </div>
        );
    }
    
    if (!user) {
        return <AuthenticationForm />;
    }

    if (user.isAdmin) {
        return <AdminDashboard />;
    }

    return <UserDashboard />;
}
