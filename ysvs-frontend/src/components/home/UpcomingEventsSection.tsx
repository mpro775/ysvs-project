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
    <section className="bg-[#f3f3f5] py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col-reverse items-start justify-between gap-3 sm:flex-row sm:items-end">
          <Link to="/events" className="inline-flex items-center gap-2 text-sm font-semibold text-[#5147df] hover:text-[#3f37be]">
            عرض الكل
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="text-right">
            <h2 className="text-4xl font-extrabold text-[#1f2437]">المؤتمرات القادمة</h2>
            <p className="mt-1 text-sm text-[#6a7288]">انضم إلى المؤتمرات المتخصصة وطوّر مهاراتك.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-[430px] animate-pulse rounded-2xl border border-[#e5e8ef] bg-white"
                />
              ))
            : events?.length
              ? events.map((event) => <UpcomingEventShowcaseCard key={event._id} event={event} />)
              : (
                <p className="col-span-3 rounded-2xl bg-white p-8 text-center text-[#7a8094]">
                  لا توجد مؤتمرات قادمة حالياً
                </p>
              )}
        </div>
      </div>
    </section>
  );
}
