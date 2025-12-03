'use client';

import { useState } from 'react';
import { arisanData, type Note } from '@/app/data';
import { Header } from '@/components/layout/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Textarea } from '@/components/ui/textarea';

const NoteDialog = ({
  note,
  isOpen,
  onClose,
  onSave,
}: {
  note: Partial<Note> | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Note) => void;
}) => {
  const [formData, setFormData] = useState<Partial<Note> | null>(note);
  const { toast } = useToast();

  React.useEffect(() => {
    setFormData(note);
  }, [note]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = () => {
    if (!formData?.title || !formData?.content) {
        toast({
            title: "Data Tidak Lengkap",
            description: "Judul dan isi catatan harus diisi.",
            variant: "destructive",
        });
      return;
    }
    
    const now = new Date().toISOString();
    const newNote: Note = {
      id: formData.id || `n${arisanData.notes.length + 1}`,
      title: formData.title,
      content: formData.content,
      createdAt: formData.createdAt || now,
      updatedAt: now,
    };
    onSave(newNote);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{note?.id ? 'Ubah Catatan' : 'Tambah Catatan Baru'}</DialogTitle>
          <DialogDescription>
            {note?.id
              ? 'Ubah detail catatan di bawah ini.'
              : 'Isi detail untuk catatan baru.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Judul
            </Label>
            <Input id="title" value={formData?.title || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="content" className="text-right pt-2">
              Isi Catatan
            </Label>
            <Textarea id="content" value={formData?.content || ''} onChange={handleChange} className="col-span-3" rows={5} />
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


export default function NotesPage() {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>(arisanData.notes);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Partial<Note> | null>(null);

  const handleAdd = () => {
    setSelectedNote({});
    setIsDialogOpen(true);
  };

  const handleEdit = (note: Note) => {
    setSelectedNote(note);
    setIsDialogOpen(true);
  };
  
  const handleDelete = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    toast({
        title: "Catatan Dihapus",
        description: "Catatan telah berhasil dihapus.",
    });
  };

  const handleSave = (note: Note) => {
    const isNew = !note.id.startsWith('n') || !notes.some(n => n.id === note.id);
    if (isNew) {
        const newNote = { ...note, id: `n${Math.random()}`}; 
        setNotes(prev => [newNote, ...prev]);
        toast({ title: "Catatan Ditambahkan", description: "Catatan baru telah disimpan." });
    } else {
        setNotes(prev => prev.map(n => n.id === note.id ? note : n));
        toast({ title: "Catatan Diperbarui", description: "Catatan telah diperbarui." });
    }
    setIsDialogOpen(false);
  };

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header title="Catatan Penting" />
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Kelola Catatan</CardTitle>
                    <CardDescription>
                        Buat, ubah, dan hapus catatan penting terkait arisan.
                    </CardDescription>
                </div>
                <Button onClick={handleAdd}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Tambah Catatan
                </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {notes.map((note) => (
                  <Card key={note.id} className="flex flex-col">
                    <CardHeader className="flex-row items-start justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg">{note.title}</CardTitle>
                            <CardDescription>
                                Terakhir diubah: {format(new Date(note.updatedAt), "d MMM yyyy, HH:mm", { locale: id })}
                            </CardDescription>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="-mt-2 -mr-2">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Tindakan</span>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Tindakan</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEdit(note)}>Ubah</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleDelete(note.id)}>Hapus</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
      
      {isDialogOpen && (
        <NoteDialog
          note={selectedNote}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}
