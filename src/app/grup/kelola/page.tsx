'use client';

import React, { useState, useEffect } from 'react';
import { type Group, type Member, subscribeToData } from '@/app/data';
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
import { useFirestore } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const GroupManagementCard = ({
  group,
  members,
  onRemoveMember,
  onEditMember
}: {
  group: Group;
  members: Member[];
  onRemoveMember: (groupId: string, memberId: string) => void;
  onEditMember: (member: Member) => void;
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
              <Button variant="ghost" size="icon" onClick={() => onEditMember(member)}>
                <Edit className="h-4 w-4" />
                <span className="sr-only">Ubah</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => onRemoveMember(group.id, member.id)}
              >
                <Trash className="h-4 w-4" />
                <span className="sr-only">Hapus</span>
              </Button>
            </div>
          </div>
        ))}
         {members.length === 0 && (
            <p className="text-sm text-center text-muted-foreground py-4">Belum ada anggota.</p>
        )}
      </CardContent>
    </Card>
  );
};

const AddMemberToGroupDialog = ({
  isOpen,
  onClose,
  groups,
  allMembers,
  onAdd
}: {
  isOpen: boolean;
  onClose: () => void;
  groups: Group[];
  allMembers: Member[];
  onAdd: (groupId: string, memberId: string) => void;
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

    const group = groups.find(g => g.id === selectedGroupId);
    const member = allMembers.find(m => m.id === selectedMemberId);

    if (group && member) {
      if (group.memberIds.includes(member.id)) {
        toast({
          title: 'Gagal Menambahkan',
          description: `${member.name} sudah menjadi anggota di ${group.name}.`,
          variant: 'destructive',
        });
      } else {
        onAdd(group.id, member.id);
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
  const { toast } = useToast();
  const db = useFirestore();

  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  
  useEffect(() => {
    if (!db) return;
    const unsubMembers = subscribeToData(db, 'members', (data) => setMembers(data as Member[]));
    const unsubGroups = subscribeToData(db, 'groups', (data) => setGroups(data as Group[]));

    return () => {
      unsubMembers();
      unsubGroups();
    };
  }, [db]);


  const handleAddMemberToGroup = async (groupId: string, memberId: string) => {
    if (!db) return;
    const groupRef = doc(db, 'groups', groupId);
    updateDoc(groupRef, {
        memberIds: arrayUnion(memberId)
    })
    .then(() => {
        const member = members.find(m => m.id === memberId);
        const group = groups.find(g => g.id === groupId);
        toast({
          title: 'Anggota Ditambahkan',
          description: `${member?.name} telah berhasil ditambahkan ke ${group?.name}.`,
        });
    })
    .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
            path: groupRef.path,
            operation: 'update',
            requestResourceData: { memberIds: arrayUnion(memberId) },
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  }

  const handleRemoveMemberFromGroup = async (groupId: string, memberId: string) => {
      if (!db) return;
      const groupRef = doc(db, 'groups', groupId);
      updateDoc(groupRef, {
          memberIds: arrayRemove(memberId)
      })
      .then(() => {
          toast({
              title: "Anggota Dihapus dari Grup",
              description: "Anggota telah dikeluarkan dari grup ini."
          });
      })
      .catch((serverError) => {
          const permissionError = new FirestorePermissionError({
              path: groupRef.path,
              operation: 'update',
              requestResourceData: { memberIds: arrayRemove(memberId) },
          });
          errorEmitter.emit('permission-error', permissionError);
      });
  }

  const getGroupMembers = (group: Group) => {
    return members.filter(member => group.memberIds.includes(member.id));
  }

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header title="Kelola Grup" />
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="font-headline text-2xl font-bold tracking-tight text-foreground/90 sm:text-3xl">
              Kelola Grup Arisan
            </h1>
            <Button onClick={() => setIsDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Tambah Anggota ke Grup
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {groups.map(group => (
              <GroupManagementCard 
                key={group.id} 
                group={group} 
                members={getGroupMembers(group)}
                onRemoveMember={handleRemoveMemberFromGroup}
                onEditMember={(member) => console.log('Edit member', member)} // Placeholder
              />
            ))}
          </div>
        </main>
      </div>
      <AddMemberToGroupDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        groups={groups}
        allMembers={members}
        onAdd={handleAddMemberToGroup}
      />
    </>
  );
}
