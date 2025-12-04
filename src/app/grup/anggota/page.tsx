'use client';

import { useState } from 'react';
import { arisanData, type Group, type Member } from '@/app/data';
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
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
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
  onSave: (member: Member) => void;
}) => {
  const [formData, setFormData] = useState<Partial<Member> | null>(member);
  const { toast } = useToast();

  React.useEffect(() => {
    setFormData(member);
  }, [member]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = () => {
    if (!formData?.name || !formData?.joinedDate) {
      toast({
        title: 'Data Tidak Lengkap',
        description: 'Nama dan tanggal bergabung harus diisi.',
        variant: 'destructive',
      });
      return;
    }

    const newMember: Member = {
      id: formData.id || `m${arisanData.members.length + 1}`,
      name: formData.name,
      joinedDate: formData.joinedDate,
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
    onSave(newMember);
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="joinedDate" className="text-right">
              Tgl. Bergabung
            </Label>
            <Input
              id="joinedDate"
              type="date"
              value={formData?.joinedDate || ''}
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
  onAdd: () => void;
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
        onAdd();
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
  const [version, setVersion] = useState(0); // Used to force re-renders
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [isAddToGroupDialogOpen, setIsAddToGroupDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Partial<Member> | null>(
    null
  );

  const { members, groups } = arisanData;

  const forceUpdate = () => setVersion(v => v + 1);

  // Handlers for Member Management
  const handleAddMember = () => {
    setSelectedMember({});
    setIsMemberDialogOpen(true);
  };

  const handleEditMember = (member: Member) => {
    setSelectedMember(member);
    setIsMemberDialogOpen(true);
  };

  const handleDeleteMember = (memberId: string) => {
    arisanData.members = arisanData.members.filter(m => m.id !== memberId);
    // Also remove from all groups
    arisanData.groups.forEach(group => {
      group.memberIds = group.memberIds.filter(id => id !== memberId);
    });
    forceUpdate();
    toast({
      title: 'Anggota Dihapus',
      description: 'Anggota telah berhasil dihapus dari daftar.',
    });
  };

  const handleSaveMember = (member: Member) => {
    const isNew = !members.some(m => m.id === member.id);
    if (isNew) {
      arisanData.members.push({ ...member, id: `m${Date.now()}` });
      toast({
        title: 'Anggota Ditambahkan',
        description: `${member.name} telah ditambahkan.`,
      });
    } else {
      arisanData.members = arisanData.members.map(m =>
        m.id === member.id ? member : m
      );
      toast({
        title: 'Anggota Diperbarui',
        description: `Data untuk ${member.name} telah diperbarui.`,
      });
    }
    forceUpdate();
    setIsMemberDialogOpen(false);
  };
  
  // Handler for removing a member from a specific group
  const handleRemoveFromGroup = (groupId: string, memberId: string) => {
    const group = arisanData.groups.find(g => g.id === groupId);
    if (group) {
        group.memberIds = group.memberIds.filter(id => id !== memberId);
        forceUpdate();
        toast({
            title: "Anggota Dihapus dari Grup",
            description: "Anggota telah dikeluarkan dari grup ini."
        });
    }
  }

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header title="Kelola Grup & Anggota" />
        <main className="flex-1 p-4 md:p-6">
          <Tabs defaultValue="groups">
            <div className="flex items-center justify-between mb-4">
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
              <div className='flex gap-2'>
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
                        <TableHead>Anggota</TableHead>
                        <TableHead>Tanggal Bergabung</TableHead>
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
                          <TableCell>
                            {format(new Date(member.joinedDate), 'd MMMM yyyy', {
                              locale: id,
                            })}
                          </TableCell>
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
        onAdd={forceUpdate}
      />
    </>
  );
}