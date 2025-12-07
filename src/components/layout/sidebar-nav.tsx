
'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  LogOut,
  Shield,
  Trophy,
  Users,
  FileText,
  Wallet,
  Megaphone,
} from 'lucide-react';
import { initializeFirebase } from '@/firebase';
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

const navItems = [
  { href: '/', label: 'Menu Utama', icon: LayoutDashboard },
  { href: '/laporan', label: 'Laporan', icon: FileText },
  { href: '/keuangan', label: 'Pengelolaan Keuangan', icon: Wallet },
  { href: '/grup', label: 'Kelola Grup & Anggota', icon: Users },
  { href: '/undian', label: 'Yang Sudah Narik', icon: Trophy },
  { href: '/pengumuman', label: 'Pengumuman', icon: Megaphone },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const router = useRouter();
  const { auth } = initializeFirebase();

  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/');
  };

  const isNavItemActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-3 p-2">
          <div className="rounded-lg bg-primary/20 text-primary h-10 w-10 overflow-hidden flex items-center justify-center p-0">
            <Image src="https://i.imgur.com/Euyh8nM.png" alt="App Logo" width={40} height={40} className="object-cover w-full h-full" />
          </div>
          <h1 className="font-headline text-lg font-extrabold tracking-tight title-gradient">
            ARISAN KELUARGA Alm. KAKEK NGAMIN
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
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Keluar">
              <LogOut />
              <span>Keluar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}

    