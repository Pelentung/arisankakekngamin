
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
} from 'lucide-react';

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
  { href: '/pembayaran', label: 'Pembayaran', icon: Coins },
  { href: '/pengeluaran', label: 'Pengeluaran', icon: Receipt },
  { href: '/undian', label: 'Yang Sudah Narik', icon: Trophy },
  { href: '/catatan', label: 'Catatan', icon: StickyNote },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const isNavItemActive = (href: string) => {
    // Exact match for the homepage
    if (href === '/') {
      return pathname === '/';
    }
     if (href === '/grup') {
        return pathname === '/grup';
    }
    // StartsWith for all other nested routes
    return pathname.startsWith(href);
  };

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
      </SidebarFooter>
    </>
  );
}
