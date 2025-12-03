'use client';

import React, { useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const GroupManagementCard = ({
  group,
  members,
}: {
  group: Group;
  members: Member[];
}) => {
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
                <AvatarImage
                  src={member.avatarUrl}
                  data-ai-hint={member.avatarHint}
                />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{member.name}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon">
                <Edit className="h-4 w-4" />
                <span className="sr-only">Ubah</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
              >
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

const AddMemberToGroupDialog = ({
  isOpen,
  onClose,
  groups,
  allMembers,
}: {
  isOpen: boolean;
  onClose: () => void;
  groups: Group[];
  allMembers: Member[];
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const { toast } = useToast();

  const handleSave = () => {
    if (!selectedMemberId || !selectedGroupId) {
      toast({
        title: 'Data Tidak Lengkap',
        description: 'Anda harus memilih anggota dan grup.',
        variant: 'destructive',
      });
      return;
    }

    // This is a mock update. In a real app, you'd update your data source.
    const group = arisanData.groups.find(g => g.id === selectedGroupId);
    const member = arisanData.members.find(m => m.id === selectedMemberId);

    if (group && member) {
      if (group.memberIds.includes(member.id)) {
        toast({
          title: 'Gagal Menambahkan',
          description: `${member.name} sudah menjadi anggota di ${group.name}.`,
          variant: 'destructive',
        });
      } else {
        group.memberIds.push(member.id);
        toast({
          title: 'Anggota Ditambahkan',
          description: `${member.name} telah berhasil ditambahkan ke ${group.name}.`,
        });
        onClose();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Anggota ke Grup</DialogTitle>
          <DialogDescription>
            Pilih anggota dan grup tujuan untuk menambahkannya.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="member" className="text-right">
              Anggota
            </Label>
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger id="member" className="col-span-3">
                <SelectValue placeholder="Pilih Anggota" />
              </SelectTrigger>
              <SelectContent>
                {allMembers.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="group" className="text-right">
              Grup
            </Label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger id="group" className="col-span-3">
                <SelectValue placeholder="Pilih Grup Tujuan" />
              </SelectTrigger>
              <SelectContent>
                {groups.map(group => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleSave}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function ManageGroupsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Force re-render when data changes
  const [, setVersion] = useState(0); 
  
  const group1 = arisanData.groups.find(g => g.id === 'g2'); // 10.000
  const group2 = arisanData.groups.find(g => g.id === 'g1'); // 20.000

  const membersGroup1 = arisanData.members.filter(member =>
    group1?.memberIds.includes(member.id)
  );
  const membersGroup2 = arisanData.members.filter(member =>
    group2?.memberIds.includes(member.id)
  );

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header title="Kelola Grup" />
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="font-headline text-2xl font-bold tracking-tight text-foreground/90 sm:text-3xl">
              Grup Arisan Utama
            </h1>
            <Button onClick={() => setIsDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Tambah Anggota ke Grup
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {group1 && <GroupManagementCard group={group1} members={membersGroup1} />}
            {group2 && <GroupManagementCard group={group2} members={membersGroup2} />}
          </div>
        </main>
      </div>
      <AddMemberToGroupDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setVersion(v => v + 1); // Trigger re-render
        }}
        groups={arisanData.groups}
        allMembers={arisanData.members}
      />
    </>
  );
}
