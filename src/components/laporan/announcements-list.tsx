
'use client';

import { useState, useEffect } from 'react';
import type { Announcement } from '@/app/data';
import { subscribeToData } from '@/app/data';
import { useFirestore } from '@/firebase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const MarqueeText = ({ text }: { text: string }) => {
  return (
    <div className="overflow-hidden whitespace-nowrap w-full">
      <div className="inline-block animate-marquee">{text}</div>
    </div>
  );
};


export function AnnouncementsList() {
  const db = useFirestore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    const unsubscribe = subscribeToData(db, 'announcements', (data) => {
        // Sort by most recent
        const sortedData = (data as Announcement[]).sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      setAnnouncements(sortedData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [db]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pengumuman</CardTitle>
          <CardDescription>
            Informasi penting dan terkini dari pengurus arisan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Memuat pengumuman...</p>
        </CardContent>
      </Card>
    );
  }

  if (announcements.length === 0) {
    return null; // Don't render the card if there are no announcements
  }

  return (
    <Card className="bg-destructive/10 border-destructive/30">
      <CardHeader>
        <CardTitle className='uppercase text-yellow-400 animate-blink'>Pengumuman</CardTitle>
        <CardDescription className="text-yellow-500/80">
          Informasi penting dan terkini dari pengurus arisan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible defaultValue={announcements[0]?.id}>
          {announcements.map((announcement) => (
            <AccordionItem value={announcement.id} key={announcement.id} className="border-yellow-400/40">
              <AccordionTrigger>
                <div className="flex flex-col items-start text-left w-full overflow-hidden text-yellow-400">
                    <div className="font-semibold w-full truncate">
                        {announcement.title}
                    </div>
                    <span className="text-xs text-yellow-500/70">
                        Diperbarui: {format(new Date(announcement.updatedAt), 'd MMMM yyyy', { locale: id })}
                    </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="whitespace-pre-wrap text-yellow-400/90 w-full overflow-hidden">
                 <MarqueeText text={announcement.content} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
