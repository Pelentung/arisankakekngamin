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
import { PlusCircle, Trash, Edit, Upload } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { format } from 'date-fns';

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
}: {
  isOpen: boolean;
  onClose: () => void;
  groups: Group[];
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!name || !address || !phone || !selectedGroupId) {
      toast({
        title: 'Data Tidak Lengkap',
        description: 'Semua kolom harus diisi.',
        variant: 'destructive',
      });
      return;
    }

    const group = arisanData.groups.find(g => g.id === selectedGroupId);
    
    if (group) {
        const newMemberId = `m${arisanData.members.length + 1}`;
        const newMember: Member = {
            id: newMemberId,
            name,
            address,
            phone,
            joinedDate: format(new Date(), 'yyyy-MM-dd'),
            avatarUrl: photoPreview || `https://picsum.photos/seed/${name}/100/100`,
            avatarHint: 'person portrait',
            paymentHistory: [],
            communicationPreferences: { channel: 'WhatsApp', preferredTime: 'any' },
        };

        arisanData.members.push(newMember);

        if (group.memberIds.includes(newMember.id)) {
            toast({
              title: 'Gagal Menambahkan',
              description: `${newMember.name} sudah menjadi anggota di ${group.name}.`,
              variant: 'destructive',
            });
        } else {
            group.memberIds.push(newMember.id);
            toast({
              title: 'Anggota Ditambahkan',
              description: `${newMember.name} telah berhasil ditambahkan ke ${group.name}.`,
            });
            onClose();
        }
    }
  };
  
  const resetForm = () => {
    setName('');
    setAddress('');
    setPhone('');
    setSelectedGroupId('');
    setPhotoPreview(null);
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { resetForm(); } onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Anggota Baru ke Grup</DialogTitle>
          <DialogDescription>
            Isi detail anggota baru dan pilih grup tujuan.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nama
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="Nama lengkap anggota"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">
              Alamat
            </Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="col-span-3" placeholder="Alamat tinggal"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Nomor HP
            </Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" placeholder="Nomor telepon aktif"/>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="photo" className="text-right">
              Foto
            </Label>
            <div className="col-span-3 flex items-center gap-3">
              <Avatar className="h-12 w-12">
                  <AvatarImage src={photoPreview || undefined} />
                  <AvatarFallback><Upload className="h-5 w-5"/></AvatarFallback>
              </Avatar>
              <Input id="photo" type="file" onChange={handlePhotoChange} className="w-auto flex-1" accept="image/*" />
            </div>
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
  
  const group1 = arisanData.groups.find(g => g.id === 'g3'); // Utama
  const group2 = arisanData.groups.find(g => g.id === 'g1'); // 20.000
  const group3 = arisanData.groups.find(g => g.id === 'g2'); // 10.000

  const membersGroup1 = arisanData.members.filter(member =>
    group1?.memberIds.includes(member.id)
  );
  const membersGroup2 = arisanData.members.filter(member =>
    group2?.memberIds.includes(member.id)
  );
  const membersGroup3 = arisanData.members.filter(member =>
    group3?.memberIds.includes(member.id)
  );

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header title="Kelola Grup" />
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="font-headline text-2xl font-bold tracking-tight text-foreground/90 sm:text-3xl">
              Kelola Grup Arisan
            </h1>
            <div className='flex gap-2'>
              <Button asChild variant="outline">
                <Link href="/grup/anggota">Kelola Semua Anggota</Link>
              </Button>
              <Button onClick={() => setIsDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Tambah Anggota ke Grup
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {group1 && <GroupManagementCard group={group1} members={membersGroup1} />}
            {group2 && <GroupManagementCard group={group2} members={membersGroup2} />}
            {group3 && <GroupManagementCard group={group3} members={membersGroup3} />}
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
      />
    </>
  );
}
