import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { UpcomingEventShowcaseCard } from '@/components/home/UpcomingEventShowcaseCard';
import type { Event } from '@/types';

interface UpcomingEventsSectionProps {
  events?: Event[];
  isLoading?: boolean;
}

export function UpcomingEventsSection({ events, isLoading }: UpcomingEventsSectionProps) {
  return (
    <section className="bg-muted/30 py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col-reverse items-start justify-between gap-3 sm:flex-row-reverse sm:items-end">
          <Link to="/events" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80">
            عرض الكل
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="text-right">
            <h2 className="text-4xl font-extrabold text-foreground">المؤتمرات القادمة</h2>
            <p className="mt-1 text-sm text-muted-foreground">انضم إلى المؤتمرات المتخصصة وطوّر مهاراتك.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-[430px] animate-pulse rounded-2xl border bg-card"
                />
              ))
            : events?.length
              ? events.map((event) => <UpcomingEventShowcaseCard key={event._id} event={event} />)
              : (
                <p className="col-span-3 rounded-2xl bg-card p-8 text-center text-muted-foreground">
                  لا توجد مؤتمرات قادمة حالياً
                </p>
              )}
        </div>
      </div>
    </section>
  );
}
