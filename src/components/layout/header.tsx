'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft, LogOut, LogIn } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const UserMenu = () => {
  const { user, loading } = useUser();
  const auth = getAuth();

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error during sign-in:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error during sign-out:", error);
    }
  };

  if (loading) {
    return <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />;
  }

  if (!user) {
    return (
      <Button variant="ghost" size="icon" onClick={handleLogin}>
        <LogIn className="h-5 w-5" />
        <span className="sr-only">Login</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
            <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{user.displayName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>Profil</DropdownMenuItem>
        <DropdownMenuItem disabled>Pengaturan</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Keluar</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


export function Header({ title }: { title: string }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      {user && <SidebarTrigger className="md:hidden" />}
      {!isHomePage && (
        <Button asChild variant="default" size="icon" className="h-8 w-8">
            <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Kembali ke Menu Utama</span>
            </Link>
        </Button>
      )}
      <div className="w-full flex-1">
        <h1 className="font-headline text-lg font-semibold md:text-xl">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        {user && (
            <Button variant="ghost" size="icon" className="rounded-full">
            <Search />
            <span className="sr-only">Cari</span>
            </Button>
        )}
        <UserMenu />
      </div>
    </header>
  );
}
