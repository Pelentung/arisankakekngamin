'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Coins, LayoutDashboard, Settings, Trophy, Users, FileText, Receipt } from 'lucide-react';

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
  { href: '/', label: 'Dasbor', icon: LayoutDashboard },
  { href: '/laporan', label: 'Laporan', icon: FileText },
  { href: '/grup', label: 'Grup', icon: Users },
  { href: '/pembayaran', label: 'Pembayaran', icon: Coins },
  { href: '/pengeluaran', label: 'Pengeluaran', icon: Receipt },
  { href: '/undian', label: 'Undian Tarikan', icon: Trophy },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-3 p-2">
          <div className="p-2 rounded-lg bg-primary/20 text-primary">
            <Coins className="h-6 w-6" />
          </div>
          <h1 className="font-headline text-xl font-semibold">Arisan Alm. Kakek Ngamin</h1>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href && item.href !=='#'}
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
            <SidebarMenuButton asChild isActive={pathname === '/settings'} tooltip={'Pengaturan'}>
              <Link href="#">
                <Settings />
                <span>Pengaturan</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
