
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Coins,
  LayoutDashboard,
  Shield,
  Trophy,
  Users,
  FileText,
  Receipt,
  StickyNote,
  Wallet,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';

const allNavItems = [
  { href: '/', label: 'Menu Utama', icon: LayoutDashboard, adminOnly: false },
  { href: '/laporan', label: 'Laporan', icon: FileText, adminOnly: false },
  { href: '/keuangan', label: 'Pengelolaan Keuangan', icon: Wallet, adminOnly: true },
  { href: '/grup', label: 'Kelola Grup & Anggota', icon: Users, adminOnly: true },
  { href: '/undian', label: 'Yang Sudah Narik', icon: Trophy, adminOnly: true },
  { href: '/catatan', label: 'Catatan', icon: StickyNote, adminOnly: true },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const auth = useAuth();
  const { user } = useUser();

  const navItems = allNavItems.filter(item => !item.adminOnly || user?.isAdmin);

  const isNavItemActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/grup') return pathname === '/grup';
    return pathname.startsWith(href);
  };

  if (!user) {
    return null; // Don't render sidebar if user is not logged in
  }

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-3 p-2">
          <div className="p-2 rounded-lg bg-primary/20 text-primary">
            <Coins className="h-6 w-6" />
          </div>
          <h1 className="font-headline text-lg font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-blue-500">
            ARISAN KELUARGA BESAR Alm. KAKEK NGAMIN
          </h1>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={isNavItemActive(item.href)}
                tooltip={item.label}
                onClick={() => setOpenMobile(false)}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <Separator className="my-2" />
        {user?.isAdmin && (
            <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                asChild
                isActive={pathname === '/admin'}
                tooltip={'Ketetapan Iuran'}
                >
                <Link href="/admin">
                    <Shield />
                    <span>Ketetapan Iuran</span>
                </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            </SidebarMenu>
        )}
        <Button variant="ghost" className="w-full justify-start" onClick={() => auth.signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Keluar
        </Button>
      </SidebarFooter>
    </>
  );
}
