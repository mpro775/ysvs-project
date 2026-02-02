import { Link } from 'react-router-dom';
import { Calendar, Users, Award, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUpcomingEvent, useEvents } from '@/api/hooks/useEvents';
import { useLatestArticles } from '@/api/hooks/useContent';
import { useStreamStatus } from '@/api/hooks/useStreaming';
import { HeroSection } from '@/components/home/HeroSection';
import { CountdownTimer } from '@/components/home/CountdownTimer';
import { EventCard } from '@/components/events/EventCard';
import { ArticleCard } from '@/components/news/ArticleCard';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const stats = [
  { label: 'مؤتمر علمي', value: '25+', icon: Calendar },
  { label: 'عضو مسجل', value: '500+', icon: Users },
  { label: 'شهادة صادرة', value: '2000+', icon: Award },
];

export default function HomePage() {
  const { data: streamStatus } = useStreamStatus();
  const { data: upcomingEvent, isLoading: loadingUpcoming } = useUpcomingEvent();
  const { data: eventsData, isLoading: loadingEvents } = useEvents({ limit: 3, status: 'upcoming' });
  const { data: articles, isLoading: loadingArticles } = useLatestArticles(3);

  return (
    <div>
      {/* Hero Section */}
      <HeroSection isLive={streamStatus?.isLive} streamUrl={streamStatus?.embedUrl} />

      {/* Countdown Section */}
      {upcomingEvent && (
        <section className="bg-primary-900 py-12 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-2 text-2xl font-bold">{upcomingEvent.titleAr}</h2>
            <p className="mb-6 text-primary-200">
              {format(new Date(upcomingEvent.startDate), 'EEEE، d MMMM yyyy', { locale: ar })}
            </p>
            <CountdownTimer targetDate={new Date(upcomingEvent.startDate)} />
            <Button asChild size="lg" className="mt-6 bg-white text-primary-900 hover:bg-primary-50">
              <Link to={`/events/${upcomingEvent.slug}`}>سجل الآن</Link>
            </Button>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section className="bg-neutral-50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-3">
            {stats.map((stat) => (
              <Card key={stat.label} className="text-center">
                <CardContent className="pt-6">
                  <stat.icon className="mx-auto mb-4 h-12 w-12 text-primary-600" />
                  <p className="text-4xl font-bold text-primary-900">{stat.value}</p>
                  <p className="text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold">المؤتمرات القادمة</h2>
            <Button variant="ghost" asChild>
              <Link to="/events" className="flex items-center gap-2">
                عرض الكل
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loadingEvents || loadingUpcoming ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <Skeleton className="h-48 w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                </Card>
              ))
            ) : eventsData?.data?.length ? (
              eventsData.data.map((event) => (
                <EventCard key={event._id} event={event} />
              ))
            ) : (
              <p className="col-span-3 text-center text-muted-foreground">
                لا توجد مؤتمرات قادمة حالياً
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Latest News */}
      <section className="bg-neutral-50 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold">أحدث الأخبار</h2>
            <Button variant="ghost" asChild>
              <Link to="/news" className="flex items-center gap-2">
                عرض الكل
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loadingArticles ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <Skeleton className="h-48 w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                </Card>
              ))
            ) : articles?.length ? (
              articles.map((article) => (
                <ArticleCard key={article._id} article={article} />
              ))
            ) : (
              <p className="col-span-3 text-center text-muted-foreground">
                لا توجد أخبار حالياً
              </p>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">انضم إلى الجمعية اليوم</h2>
          <p className="mb-8 text-lg text-primary-100">
            كن جزءاً من مجتمع أطباء الأوعية الدموية في اليمن
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link to="/register">إنشاء حساب مجاني</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
