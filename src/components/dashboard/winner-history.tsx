import { arisanData } from '@/app/data';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export function WinnerHistory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Anggota Yang Sudah Narik</CardTitle>
        <CardDescription>
          Daftar anggota yang sudah pernah memenangkan undian di setiap grup.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {arisanData.groups.map(group => {
            const winners = (group.winnerHistory || [])
              .map(history => {
                const member = arisanData.members.find(
                  m => m.id === history.memberId
                );
                return member ? { ...member, month: history.month } : null;
              })
              .filter(Boolean);

            return (
              <AccordionItem key={group.id} value={group.id}>
                <AccordionTrigger>{group.name}</AccordionTrigger>
                <AccordionContent>
                  {winners.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {winners.map(winner => (
                        <div
                          key={winner!.id}
                          className="flex items-center gap-3 rounded-md border p-3"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={winner!.avatarUrl}
                              data-ai-hint={winner!.avatarHint}
                            />
                            <AvatarFallback>
                              {winner!.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">
                              {winner!.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Menarik pada: {new Date(winner!.month).toLocaleDateString('id-ID', { month: 'long', year: 'numeric'})}
                            </p>
                          </div>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Belum ada riwayat penarikan untuk grup ini.
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
