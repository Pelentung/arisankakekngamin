'use client';

import React from 'react';
import { arisanData, type Group, type Member } from '@/app/data';
import { Header } from '@/components/layout/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlusCircle, Trash, Edit } from 'lucide-react';

const GroupManagementCard = ({ group }: { group: Group }) => {
  const members = arisanData.members.filter(member =>
    group.memberIds.includes(member.id)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{group.name}</CardTitle>
        <CardDescription>
          Total {group.memberIds.length} anggota terdaftar dalam grup ini.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {members.map(member => (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-md border p-3"
          >
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={member.avatarUrl} data-ai-hint={member.avatarHint} />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{member.name}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon">
                <Edit className="h-4 w-4" />
                <span className="sr-only">Ubah</span>
              </Button>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                <Trash className="h-4 w-4" />
                <span className="sr-only">Hapus</span>
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default function ManageGroupsPage() {
  const group1 = arisanData.groups.find(g => g.id === 'g2'); // 10.000
  const group2 = arisanData.groups.find(g => g.id === 'g1'); // 20.000

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Kelola Grup" />
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="font-headline text-2xl font-bold tracking-tight text-foreground/90 sm:text-3xl">
                Grup Arisan Utama
            </h1>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Tambah Anggota ke Grup
            </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {group1 && <GroupManagementCard group={group1} />}
          {group2 && <GroupManagementCard group={group2} />}
        </div>
      </main>
    </div>
  );
}
