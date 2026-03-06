import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useUpcomingEvent, useEvents } from "@/api/hooks/useEvents";
import { useLatestArticles } from "@/api/hooks/useContent";
import { HeroSection } from "@/components/home/HeroSection";
import { StatsSection } from "@/components/home/StatsSection";
import { UpcomingEventsSection } from "@/components/home/UpcomingEventsSection";
import { JoinAssociationSection } from "@/components/home/JoinAssociationSection";
import { LatestNewsSection } from "@/components/home/LatestNewsSection";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { CountdownTimer } from "@/components/home/CountdownTimer";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function HomePage() {
  const { data: upcomingEvent } = useUpcomingEvent();
  const { data: eventsData, isLoading: loadingEvents } = useEvents({
    limit: 3,
    status: "upcoming",
  });
  const { data: articles, isLoading: loadingArticles } = useLatestArticles(3);

  return (
    <div>
      {/* Hero Section */}
      <HeroSection />

      {/* Countdown Section */}
      {upcomingEvent && (
        <section className="bg-primary-900 py-12 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-2 text-2xl font-bold">{upcomingEvent.titleAr}</h2>
            <p className="mb-6 text-primary-200">
              {format(new Date(upcomingEvent.startDate), "EEEE، d MMMM yyyy", {
                locale: ar,
              })}
            </p>
            <CountdownTimer targetDate={new Date(upcomingEvent.startDate)} />
            <Button
              asChild
              size="lg"
              className="mt-6 bg-card text-primary-900 hover:bg-card/90 dark:text-primary-200"
            >
              <Link to={`/events/${upcomingEvent.slug}`}>سجل الآن</Link>
            </Button>
          </div>
        </section>
      )}

      <StatsSection />

      <UpcomingEventsSection events={eventsData?.data} isLoading={loadingEvents} />

      <JoinAssociationSection />

      <LatestNewsSection articles={articles} isLoading={loadingArticles} />

      <NewsletterSection />

    </div>
  );
}
