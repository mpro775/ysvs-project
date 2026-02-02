import { Link } from 'react-router-dom';
import { Calendar, MapPin, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyRegistrations } from '@/api/hooks/useEvents';
import { EmptyState } from '@/components/shared/EmptyState';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { Event } from '@/types';

export default function MemberEventsPage() {
  const { data: registrations, isLoading } = useMyRegistrations();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!registrations?.length) {
    return (
      <EmptyState
        icon={Calendar}
        title="لا توجد تسجيلات"
        description="لم تسجل في أي مؤتمر بعد"
        action={{
          label: 'تصفح المؤتمرات',
          onClick: () => (window.location.href = '/events'),
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">مؤتمراتي</h1>

      <div className="space-y-4">
        {registrations.map((reg) => {
          const event = reg.event as Event;
          return (
            <Card key={reg._id}>
              <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{event.titleAr}</h3>
                    <Badge
                      variant={
                        reg.status === 'attended'
                          ? 'default'
                          : reg.status === 'confirmed'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {reg.status === 'attended'
                        ? 'حضر'
                        : reg.status === 'confirmed'
                        ? 'مؤكد'
                        : 'معلق'}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(event.startDate), 'd MMMM yyyy', { locale: ar })}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {event.location.city}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm">
                    رقم التسجيل: <span className="font-mono">{reg.registrationNumber}</span>
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link to={`/events/${event.slug}`} className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    عرض التفاصيل
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
