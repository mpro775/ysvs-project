import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, getEventDisplayStatus } from '@/lib/utils';
import type { Event } from '@/types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface UpcomingEventShowcaseCardProps {
  event: Event;
}

const statusConfig: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  upcoming: { label: 'مفتوح', className: 'bg-emerald-500 text-white' },
  ongoing: { label: 'مباشر', className: 'bg-red-500 text-white' },
  completed: { label: 'منتهي', className: 'bg-slate-300 text-slate-700' },
  cancelled: { label: 'ملغي', className: 'bg-slate-300 text-slate-700' },
};

export function UpcomingEventShowcaseCard({ event }: UpcomingEventShowcaseCardProps) {
  const displayStatus = getEventDisplayStatus(event);
  const status = event.status === 'cancelled' ? statusConfig.cancelled : statusConfig[displayStatus];

  return (
    <article className="overflow-hidden rounded-2xl border border-[#e5e8ef] bg-white shadow-[0_8px_26px_rgba(20,30,54,0.1)]">
      <div className="relative h-48 overflow-hidden bg-[#edf1fa]">
        {event.coverImage ? (
          <img src={event.coverImage} alt={event.titleAr} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#7a85a2]">لا توجد صورة</div>
        )}

        <Badge className={cn('absolute right-3 top-3 border-0 px-3 py-1 text-xs font-semibold', status.className)}>
          {status.label}
        </Badge>

        {event.cmeHours > 0 && (
          <Badge className="absolute left-3 top-3 border-0 bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
            CME {event.cmeHours} ساعة
          </Badge>
        )}
      </div>

      <div className="space-y-4 p-4">
        <h3 className="line-clamp-1 text-right text-xl font-bold text-[#1e2438]">{event.titleAr}</h3>

        <div className="space-y-2 text-sm text-[#64708a]">
          <div className="flex items-center justify-between">
            <span>
              {format(new Date(event.startDate), 'd MMMM yyyy', { locale: ar })} -{' '}
              {format(new Date(event.endDate), 'd MMMM yyyy', { locale: ar })}
            </span>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#ecf1ff] text-[#4a62ea]">
              <Calendar className="h-3.5 w-3.5" />
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span>{event.location?.city || 'عن بعد'}</span>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#ecf1ff] text-[#4a62ea]">
              <MapPin className="h-3.5 w-3.5" />
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span>{event.maxAttendees > 0 ? `${event.maxAttendees} مشارك` : 'عدد مفتوح'}</span>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#ecf1ff] text-[#4a62ea]">
              <Users className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        <Button asChild className="h-11 w-full rounded-xl bg-[#3b39c8] text-base font-semibold hover:bg-[#2f2db1]">
          <Link to={`/events/${event.slug}`} className="flex items-center justify-center gap-2">
            عرض التفاصيل
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
