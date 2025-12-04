
'use client';

import { useState, useEffect, useRef } from 'react';
import type { Group, Member } from '@/app/data';
import { subscribeToData } from '@/app/data';
import { Header } from '@/components/layout/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, UserPlus, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore } from '@/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, arrayUnion, arrayRemove, writeBatch, getDocs, query } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Textarea } from '@/components/ui/textarea';


// Dialog for Adding/Editing a single member
const MemberDialog = ({
  member,
  isOpen,
  onClose,
  onSave,
}: {
  member: Partial<Member> | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Omit<Member, 'id'>, id?: string) => void;
}) => {
  const [formData, setFormData] = useState<Partial<Member> | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (member) {
        setFormData(member);
        if (member.avatarUrl) {
            setPhotoPreview(member.avatarUrl);
        } else {
            setPhotoPreview(null);
        }
    }
  }, [member]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
        setFormData(prev => ({ ...prev, avatarUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!formData?.name) {
      toast({
        title: 'Data Tidak Lengkap',
        description: 'Nama harus diisi.',
        variant: 'destructive',
      });
      return;
    }

    const newMemberData: Omit<Member, 'id'> = {
      name: formData.name,
      address: formData.address || '',
      phone: formData.phone || '',
      joinedDate: formData.joinedDate || new Date().toISOString().split('T')[0],
      avatarUrl:
        formData.avatarUrl ||
        `https://picsum.photos/seed/${formData.name}/100/100`,
      avatarHint: formData.avatarHint || 'person portrait',
      paymentHistory: formData.paymentHistory || [],
      communicationPreferences: formData.communicationPreferences || {
        channel: 'WhatsApp',
        preferredTime: 'any',
      },
    };
    onSave(newMemberData, formData.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {member?.id ? 'Ubah Anggota' : 'Tambah Anggota Baru'}
          </DialogTitle>
          <DialogDescription>
            {member?.id
              ? 'Ubah detail anggota di bawah ini.'
              : 'Isi detail untuk anggota baru.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Foto</Label>
              <div className="col-span-3 flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                      <AvatarImage src={photoPreview || ''} />
                      <AvatarFallback>{formData?.name?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <Input 
                      type="file" 
                      id="photo"
                      accept="image/*"
                      ref={photoInputRef}
                      onChange={handlePhotoChange}
                      className="hidden" 
                  />
                  <Button variant="outline" onClick={() => photoInputRef.current?.click()}>Unggah Foto</Button>
              </div>
            </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nama
            </Label>
            <Input
              id="name"
              value={formData?.name || ''}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="address" className="text-right pt-2">
              Alamat
            </Label>
            <Textarea
              id="address"
              value={formData?.address || ''}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Nomor HP
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData?.phone || ''}
              onChange={handleChange}
              className="col-span-3"
            />
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

// Dialog for adding an existing member to a group
const AddMemberToGroupDialog = ({
  isOpen,
  onClose,
  groups,
  allMembers,
  onAdd,
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

  useEffect(() => {
    if (!isOpen) {
      setSelectedMemberId('');
      setSelectedGroupId('');
    }
  }, [isOpen]);

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
            Pilih anggota yang sudah terdaftar dan grup tujuan untuk
            menambahkannya.
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

export default function ManageGroupsAndMembersPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [isAddToGroupDialogOpen, setIsAddToGroupDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Partial<Member> | null>(
    null
  );

  useEffect(() => {
    if (!db) return;
    
    const seedInitialGroups = async () => {
        const groupsQuery = query(collection(db, 'groups'));
        const querySnapshot = await getDocs(groupsQuery);
      if (querySnapshot.empty) {
        const initialGroups: Omit<Group, 'id' | 'memberIds'>[] = [
          { name: 'Arisan Utama', contributionAmount: 50000, cycle: 'monthly' },
          { name: 'Arisan Uang Kaget Rp. 10.000', contributionAmount: 10000, cycle: 'monthly' },
          { name: 'Arisan Uang Kaget Rp. 20.000', contributionAmount: 20000, cycle: 'monthly' },
        ];
        
        const batch = writeBatch(db);
        initialGroups.forEach(groupData => {
            const docRef = doc(collection(db, 'groups'));
            batch.set(docRef, { ...groupData, memberIds: [] });
        });

        await batch.commit().catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: 'groups (batch)',
                operation: 'create',
                requestResourceData: initialGroups,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
      }
    };
    
    seedInitialGroups();

    const unsubMembers = subscribeToData(db, 'members', (data) => setMembers(data as Member[]));
    const unsubGroups = subscribeToData(db, 'groups', (data) => {
        setGroups(data as Group[])
    });

    return () => {
      unsubMembers();
      unsubGroups();
    };
  }, [db]);


  // Handlers for Member Management
  const handleAddMember = () => {
    setSelectedMember({});
    setIsMemberDialogOpen(true);
  };

  const handleEditMember = (member: Member) => {
    setSelectedMember(member);
    setIsMemberDialogOpen(true);
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!db) return;
    const batch = writeBatch(db);
    
    // First, remove the member from all groups that contain them
    for (const group of groups) {
      if (group.memberIds.includes(memberId)) {
        const groupRef = doc(db, 'groups', group.id);
        batch.update(groupRef, { memberIds: arrayRemove(memberId) });
      }
    }
    
    const memberRef = doc(db, 'members', memberId);
    batch.delete(memberRef);

    batch.commit()
      .then(() => {
        toast({
          title: 'Anggota Dihapus',
          description: 'Anggota telah berhasil dihapus dari daftar dan semua grup.',
        });
      })
      .catch((serverError) => {
          const permissionError = new FirestorePermissionError({
              path: `members/${memberId} and groups`,
              operation: 'delete',
          });
          errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleSaveMember = async (memberData: Omit<Member, 'id'>, id?: string) => {
    if (!db) return;
    if (id) {
        const memberRef = doc(db, 'members', id);
        updateDoc(memberRef, memberData as any)
            .then(() => {
                toast({
                    title: 'Anggota Diperbarui',
                    description: `Data untuk ${memberData.name} telah diperbarui.`,
                });
                setIsMemberDialogOpen(false);
            })
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: memberRef.path,
                    operation: 'update',
                    requestResourceData: memberData,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    } else {
        addDoc(collection(db, 'members'), memberData)
            .then(() => {
                toast({
                    title: 'Anggota Ditambahkan',
                    description: `${memberData.name} telah ditambahkan.`,
                });
                setIsMemberDialogOpen(false);
            })
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: 'members',
                    operation: 'create',
                    requestResourceData: memberData,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    }
  };
  
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

  // Handler for removing a member from a specific group
  const handleRemoveFromGroup = async (groupId: string, memberId: string) => {
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
  
  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header title="Kelola Grup & Anggota" />
        <main className="flex-1 p-4 md:p-6">
          <Tabs defaultValue="groups">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <TabsList>
                <TabsTrigger value="groups">
                  <Users className="mr-2" />
                  Kelola Keanggotaan Grup
                </TabsTrigger>
                <TabsTrigger value="members">
                  <UserPlus className="mr-2" />
                  Kelola Semua Anggota
                </TabsTrigger>
              </TabsList>
              <div className='flex gap-2 flex-wrap'>
                <Button variant="outline" onClick={() => setIsAddToGroupDialogOpen(true)}>
                    <Users className="mr-2 h-4 w-4" />
                    Tambahkan Anggota ke Grup
                </Button>
                <Button onClick={handleAddMember}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Tambah Anggota Baru
                </Button>
            </div>
            </div>

            <TabsContent value="groups">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {groups.map(group => {
                  const groupMembers = members.filter(member =>
                    group.memberIds.includes(member.id)
                  );
                  return (
                    <Card key={group.id}>
                      <CardHeader>
                        <CardTitle>{group.name}</CardTitle>
                        <CardDescription>
                          Total {group.memberIds.length} anggota terdaftar.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {groupMembers.map(member => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between rounded-md border p-2"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={member.avatarUrl}
                                  data-ai-hint={member.avatarHint}
                                />
                                <AvatarFallback>
                                  {member.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm">{member.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive h-8 w-8"
                              onClick={() => handleRemoveFromGroup(group.id, member.id)}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Hapus dari grup</span>
                            </Button>
                          </div>
                        ))}
                         {groupMembers.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">Belum ada anggota.</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="members">
              <Card>
                <CardHeader>
                  <CardTitle>Daftar Semua Anggota</CardTitle>
                  <CardDescription>
                    Kelola semua anggota yang terdaftar dalam sistem arisan.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Anggota</TableHead>
                        <TableHead>Alamat</TableHead>
                        <TableHead>Nomor HP</TableHead>
                        <TableHead className="text-right">Tindakan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map(member => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage
                                  src={member.avatarUrl}
                                  data-ai-hint={member.avatarHint}
                                />
                                <AvatarFallback>
                                  {member.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="font-medium">{member.name}</div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate">{member.address}</TableCell>
                          <TableCell>{member.phone}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Tindakan</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Tindakan</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => handleEditMember(member)}
                                >
                                  Ubah
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                  onClick={() => handleDeleteMember(member.id)}
                                >
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {isMemberDialogOpen && (
        <MemberDialog
          member={selectedMember}
          isOpen={isMemberDialogOpen}
          onClose={() => setIsMemberDialogOpen(false)}
          onSave={handleSaveMember}
        />
      )}

      <AddMemberToGroupDialog
        isOpen={isAddToGroupDialogOpen}
        onClose={() => setIsAddToGroupDialogOpen(false)}
        groups={groups}
        allMembers={members}
        onAdd={handleAddMemberToGroup}
      />
    </>
  );
}

    