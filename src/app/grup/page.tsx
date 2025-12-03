'use client';

import { useState } from 'react';
import { arisanData, type Member } from '@/app/data';
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
import { MoreHorizontal, PlusCircle } from 'lucide-react';
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
            title: "Data Tidak Lengkap",
            description: "Nama dan tanggal bergabung harus diisi.",
            variant: "destructive",
        });
      return;
    }
    
    const newMember: Member = {
      id: formData.id || `m${arisanData.members.length + 1}`,
      name: formData.name,
      joinedDate: formData.joinedDate,
      avatarUrl: formData.avatarUrl || `https://picsum.photos/seed/${formData.name}/100/100`,
      avatarHint: formData.avatarHint || 'person portrait',
      paymentHistory: formData.paymentHistory || [],
      communicationPreferences: formData.communicationPreferences || { channel: 'WhatsApp', preferredTime: 'any' },
    };
    onSave(newMember);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{member?.id ? 'Ubah Anggota' : 'Tambah Anggota Baru'}</DialogTitle>
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
            <Input id="name" value={formData?.name || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="joinedDate" className="text-right">
              Tgl. Bergabung
            </Label>
            <Input id="joinedDate" type="date" value={formData?.joinedDate || ''} onChange={handleChange} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSave}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export default function GrupPage() {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>(arisanData.members);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Partial<Member> | null>(null);

  const handleAdd = () => {
    setSelectedMember({});
    setIsDialogOpen(true);
  };

  const handleEdit = (member: Member) => {
    setSelectedMember(member);
    setIsDialogOpen(true);
  };
  
  const handleDelete = (memberId: string) => {
    // Note: This is a mock delete. In a real app, you'd update your data source.
    setMembers(prev => prev.filter(m => m.id !== memberId));
    toast({
        title: "Anggota Dihapus",
        description: "Anggota telah berhasil dihapus dari daftar.",
    });
  };

  const handleSave = (member: Member) => {
    const isNew = !member.id.startsWith('m') || !members.some(m => m.id === member.id);
    if (isNew) {
        // This is a mock add.
        const newMember = { ...member, id: `m${Math.random()}`}; // ensure unique id for demo
        setMembers(prev => [...prev, newMember]);
        toast({ title: "Anggota Ditambahkan", description: `${member.name} telah ditambahkan.` });
    } else {
        // This is a mock update.
        setMembers(prev => prev.map(m => m.id === member.id ? member : m));
        toast({ title: "Anggota Diperbarui", description: `Data untuk ${member.name} telah diperbarui.` });
    }
    setIsDialogOpen(false);
  };

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header title="Anggota Grup" />
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Daftar Anggota Arisan</CardTitle>
                    <CardDescription>
                        Kelola semua anggota yang terdaftar dalam arisan.
                    </CardDescription>
                </div>
                <Button onClick={handleAdd}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Tambah Anggota
                </Button>
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
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={member.avatarUrl} data-ai-hint={member.avatarHint} />
                            <AvatarFallback>
                              {member.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{member.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(member.joinedDate), 'd MMMM yyyy', { locale: id })}
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
                            <DropdownMenuItem onClick={() => handleEdit(member)}>Ubah</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleDelete(member.id)}>Hapus</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
      
      {isDialogOpen && (
        <MemberDialog
          member={selectedMember}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}
